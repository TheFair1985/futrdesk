export default async function handler(req, res) {
    // Enable CORS preflight handling
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
    }

    try {
        const body = req.body || {};
        
        // Extract message or callback query from Telegram payload
        const message = body.message || body.channel_post || (body.callback_query ? body.callback_query.message : null);
        const callbackData = body.callback_query ? body.callback_query.data : null;
        
        if (!message) {
            return res.status(200).json({ status: 'ignored', reason: 'No message object found' });
        }

        const chatId = String(message.chat.id);
        const chatUsername = message.chat.username ? String(message.chat.username) : '';
        const text = (message.text || callbackData || '').trim();

        const expectedChatId = String(process.env.TELEGRAM_CHAT_ID || '');
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const ghPat = process.env.GH_PAT || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'TheFair1985/futrdesk';

        console.log(`[Webhook] Incoming message from chatId: ${chatId} (@${chatUsername}). Text: "${text}"`);

        // Security / Verification Check
        if (expectedChatId && chatId !== expectedChatId && chatUsername !== expectedChatId && !chatUsername.includes(expectedChatId)) {
            console.warn(`[Webhook] Unauthorized sender attempt: ${chatId} / @${chatUsername}`);
            return res.status(403).json({ error: 'Unauthorized chat ID' });
        }

        // Check for /approve command
        if (text === '/approve' || text.startsWith('/approve') || text === 'approve') {
            if (!ghPat) {
                console.error('[Webhook] Missing GH_PAT / GITHUB_PAT environment variable');
                await sendTelegramMessage(botToken, chatId, '⚠️ *Error:* GitHub Personal Access Token (GH_PAT) is not configured in Vercel environment variables.');
                return res.status(500).json({ error: 'Missing GitHub Access Token' });
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
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (ghResponse.ok || ghResponse.status === 204) {
                console.log('[Webhook] Successfully dispatched telegram_approve event to GitHub');
                await sendTelegramMessage(botToken, chatId, '⚡ *Approved!* GitHub Actions Autonomous Production Run has been triggered.');
                return res.status(200).json({ success: true, message: 'Dispatched telegram_approve to GitHub Actions' });
            } else {
                const errorText = await ghResponse.text();
                console.error(`[Webhook] GitHub API dispatch failed [${ghResponse.status}]: ${errorText}`);
                await sendTelegramMessage(botToken, chatId, `❌ *GitHub Dispatch Failed:* Status ${ghResponse.status}`);
                return res.status(500).json({ error: 'GitHub dispatch failed', details: errorText });
            }
        }

        // Default response for other messages or commands
        if (text === '/start' || text === '/status') {
            await sendTelegramMessage(botToken, chatId, '🤖 *Future Desk OS Bridge Active*%0AStatus: Online & Ready.%0APendings: Waiting for `/approve` signal.');
            return res.status(200).json({ status: 'online' });
        }

        return res.status(200).json({ status: 'ignored', message: 'Command not recognized' });

    } catch (err) {
        console.error('[Webhook Error]', err);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
}

async function sendTelegramMessage(botToken, chatId, text) {
    if (!botToken || !chatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error('Failed to send Telegram message:', e.message);
    }
}
