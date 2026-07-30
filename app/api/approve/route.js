export async function POST(request) {
    try {
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }

        const bodyStr = JSON.stringify(body);
        const isApproved =
            body.status === "Approved" ||
            body.properties?.Status?.status?.name === "Approved" ||
            body.properties?.Status?.select?.name === "Approved" ||
            bodyStr.includes('"Approved"');

        if (!isApproved) {
            return Response.json(
                { status: "ignored", reason: "Status is not Approved" },
                { status: 200 }
            );
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
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    event_type: "content_approved"
                })
            }
        );

        if (githubResponse.ok || githubResponse.status === 204) {
            return Response.json(
                { success: true, message: "Workflow triggered successfully" },
                { status: 200 }
            );
        } else {
            const errorText = await githubResponse.text();
            return Response.json(
                { success: false, error: errorText },
                { status: githubResponse.status }
            );
        }
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
