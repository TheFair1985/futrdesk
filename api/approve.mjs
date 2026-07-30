async function getParsedBody(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        return req.body;
    }
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch (e) {}
    }
    if (Buffer.isBuffer(req.body)) {
        try { return JSON.parse(req.body.toString('utf-8')); } catch (e) {}
    }
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try {
                resolve(JSON.parse(data || '{}'));
            } catch (e) {
                resolve({});
            }
        });
    });
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'online',
            service: 'Future Desk OS - Notion Approval Webhook',
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const body = await getParsedBody(req);
        const bodyStr = JSON.stringify(body);

        const isApproved =
            body.status === 'Approved' ||
            body.properties?.Status?.status?.name === 'Approved' ||
            body.properties?.Status?.select?.name === 'Approved' ||
            bodyStr.includes('"Approved"');

        if (!isApproved) {
            return res.status(200).json({ status: 'ignored', reason: 'Status is not Approved' });
        }

        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const repoPath = (owner && repo && !repo.includes('/'))
            ? `${owner}/${repo}`
            : (repo || 'TheFair1985/futrdesk');

        const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;

        const githubResponse = await fetch(
            `https://api.github.com/repos/${repoPath}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'content_approved'
                })
            }
        );

        if (githubResponse.ok || githubResponse.status === 204) {
            return res.status(200).json({ success: true, message: 'Workflow triggered successfully' });
        } else {
            const errorText = await githubResponse.text();
            return res.status(githubResponse.status).json({ success: false, error: errorText });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
