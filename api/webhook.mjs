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
    // Enable CORS preflight handling
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Health-check / Browser test via GET
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'online',
            service: 'Future Desk OS - Telegram Webhook Bridge',
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const body = await getParsedBody(req);
        
        // Extract message, edited message, or callback query from Telegram update payload
        const message = body.message || body.edited_message || body.channel_post || (body.callback_query ? body.callback_query.message : null);
        const callbackData = body.callback_query ? body.callback_query.data : null;
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '8707626369:AAFRdo6pNaFl-fcgavVTt97Yzbfm2UiPrFo';
        const ghPat = process.env.GH_PAT || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'TheFair1985/futrdesk';

        if (!message) {
            console.warn('[Webhook] Received POST without message object:', JSON.stringify(body));
            return res.status(200).json({ status: 'ignored', reason: 'No message object found in body' });
        }

        const chatId = String(message.chat.id);
        const chatUsername = message.chat.username ? String(message.chat.username) : '';
        const rawText = (message.text || callbackData || '').trim();
        const text = rawText.toLowerCase();

        console.log(`[Webhook] Processing message from chatId: "${chatId}" (@${chatUsername}). Text: "${rawText}"`);

        const rawExpectedId = String(process.env.TELEGRAM_CHAT_ID || '').replace(/^@/, '').trim().toLowerCase();

        // Authorized Co-Founder list (accepts 846896390, thefair1985, and any configured TELEGRAM_CHAT_ID)
        const authorizedList = [
            '846896390',
            'thefair1985',
            rawExpectedId
        ].filter(Boolean);

        const isAuthorized = authorizedList.includes(chatId) || 
                             (chatUsername && authorizedList.includes(chatUsername.toLowerCase()));

        // Command: /id, /start, /help, /status
        if (text.includes('id') || text.includes('start') || text.includes('help') || text.includes('status')) {
            const authStatus = isAuthorized ? '✅ *Authorized Co-Founder*' : '⚠️ *Unauthorized*';
            const patStatus = ghPat ? '✅ *Configured*' : '⚠️ *Missing GH_PAT in Vercel*';
            const replyMsg = `🤖 *Future Desk OS Bridge Active*\n\n` +
                             `📍 *Your Numeric Chat ID:* \`${chatId}\`\n` +
                             `👤 *Username:* @${chatUsername || 'N/A'}\n` +
                             `🔐 *Co-Founder Status:* ${authStatus}\n` +
                             `🔑 *GitHub Token Status:* ${patStatus}\n\n` +
                             `Commands:\n` +
                             `• \`/id\` - Show Status\n` +
                             `• \`/approve\` - Trigger Production Run on GitHub`;
            await sendTelegramMessage(botToken, chatId, replyMsg);
            return res.status(200).json({ status: 'success', chatId: chatId, isAuthorized: isAuthorized });
        }

        // Security check
        if (!isAuthorized) {
            console.warn(`[Webhook] Unauthorized attempt from chatId: ${chatId} (@${chatUsername}).`);
            await sendTelegramMessage(botToken, chatId, `⚠️ *Unauthorized Access*\nYour Chat ID is \`${chatId}\` (@${chatUsername}). Please update \`TELEGRAM_CHAT_ID\` in Vercel.`);
            return res.status(200).json({ status: 'unauthorized', yourChatId: chatId });
        }

        // Command: /approve (or any message containing "approve")
        if (text.includes('approve')) {
            if (!ghPat) {
                console.error('[Webhook] Missing GH_PAT in Vercel');
                await sendTelegramMessage(botToken, chatId, '⚠️ *Missing GH_PAT Token in Vercel!*\n\nPlease add `GH_PAT` to Vercel Environment Variables so Vercel can trigger GitHub Actions.');
                return res.status(200).json({ error: 'Missing GitHub Access Token' });
            }

            // Trigger GitHub Repository Dispatch Event
            const ghResponse = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${ghPat}`,
                    'User-Agent': 'Vercel-Telegram-Bridge',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'telegram_approve',
                    client_payload: {
                        approved_by: chatId,
                        sender: chatUsername,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (ghResponse.ok || ghResponse.status === 204) {
                console.log('[Webhook] Successfully dispatched telegram_approve event to GitHub');
                await sendTelegramMessage(botToken, chatId, '⚡ *Approved!* Autonomous Production Run triggered on GitHub Actions.');
                return res.status(200).json({ success: true, message: 'Dispatched telegram_approve to GitHub Actions' });
            } else {
                const errorText = await ghResponse.text();
                console.error(`[Webhook] GitHub API dispatch failed [${ghResponse.status}]: ${errorText}`);
                await sendTelegramMessage(botToken, chatId, `❌ *GitHub Dispatch Failed (${ghResponse.status}):*\n\`${errorText}\``);
                return res.status(200).json({ error: 'GitHub dispatch failed', details: errorText });
            }
        }

        // Catch-all response so user always receives feedback on any message
        await sendTelegramMessage(botToken, chatId, `ℹ️ *Command Received:* "${rawText}"\n\nReply with \`/approve\` to launch Autonomous Production Run.`);
        return res.status(200).json({ status: 'received', text: rawText });

    } catch (err) {
        console.error('[Webhook Error]', err);
        return res.status(200).json({ error: 'Internal Server Error', message: err.message });
    }
}

async function sendTelegramMessage(botToken, chatId, text) {
    if (!botToken || !chatId) {
        console.error('Cannot send Telegram message: missing botToken or chatId', { botToken: !!botToken, chatId });
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        const json = await res.json();
        if (!json.ok) {
            console.error('[Telegram Send Error]', json);
        }
    } catch (e) {
        console.error('Failed to send Telegram message:', e.message);
    }
}
