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
            timestamp: new Date().toISOString(),
            instructions: 'Register this endpoint with Telegram setWebhook API.'
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Only GET and POST are accepted.' });
    }

    try {
        const body = req.body || {};
        
        // Extract message or callback query from Telegram update payload
        const message = body.message || body.channel_post || (body.callback_query ? body.callback_query.message : null);
        const callbackData = body.callback_query ? body.callback_query.data : null;
        
        if (!message) {
            return res.status(200).json({ status: 'ignored', reason: 'No message object found' });
        }

        const chatId = String(message.chat.id);
        const chatUsername = message.chat.username ? String(message.chat.username) : '';
        const rawText = (message.text || callbackData || '').trim();
        const text = rawText.toLowerCase();

        const rawExpectedId = String(process.env.TELEGRAM_CHAT_ID || '').replace(/^@/, '').trim();
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const ghPat = process.env.GH_PAT || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'TheFair1985/futrdesk';

        console.log(`[Webhook] Received message from chatId: "${chatId}" (@${chatUsername}). Content: "${rawText}"`);

        // Helper command: /id or /myid or /start -> Returns the user's Chat ID immediately
        if (text === '/id' || text === '/myid' || text === '/start') {
            const replyMsg = `🤖 *Future Desk OS Bridge Active*\n\n` +
                             `📍 *Your Numeric Chat ID:* \`${chatId}\`\n` +
                             `👤 *Username:* @${chatUsername || 'N/A'}\n\n` +
                             `Copy this Chat ID and set \`TELEGRAM_CHAT_ID=${chatId}\` in your Vercel & GitHub environment variables.\n\n` +
                             `Commands:\n` +
                             `• \`/id\` - Show Chat ID\n` +
                             `• \`/approve\` - Launch Autonomous Production Run on GitHub`;
            await sendTelegramMessage(botToken, chatId, replyMsg);
            return res.status(200).json({ status: 'success', chatId: chatId });
        }

        // Security / Verification Check (if TELEGRAM_CHAT_ID is configured)
        const isAuthorized = !rawExpectedId || 
                             chatId === rawExpectedId || 
                             (chatUsername && chatUsername.toLowerCase() === rawExpectedId.toLowerCase());

        if (!isAuthorized) {
            console.warn(`[Webhook] Unauthorized attempt from chatId: ${chatId} (@${chatUsername}). Expected: ${rawExpectedId}`);
            await sendTelegramMessage(botToken, chatId, `⚠️ *Unauthorized Chat ID*\nYour Chat ID is \`${chatId}\`. Please update \`TELEGRAM_CHAT_ID\` in Vercel.`);
            return res.status(403).json({ error: 'Unauthorized Chat ID', yourChatId: chatId });
        }

        // Handle /approve command
        if (text === '/approve' || text.startsWith('/approve') || text === 'approve') {
            if (!ghPat) {
                console.error('[Webhook] Missing GH_PAT environment variable');
                await sendTelegramMessage(botToken, chatId, '⚠️ *Error:* GitHub Access Token (\`GH_PAT\`) is missing in Vercel environment variables.');
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
                await sendTelegramMessage(botToken, chatId, `❌ *GitHub Dispatch Failed (${ghResponse.status}):*\n${errorText}`);
                return res.status(500).json({ error: 'GitHub dispatch failed', details: errorText });
            }
        }

        // Generic reply for unrecognized commands
        await sendTelegramMessage(botToken, chatId, `ℹ️ *Command Received:* "${rawText}"\nReply with \`/approve\` to launch production run or \`/id\` to inspect your Chat ID.`);
        return res.status(200).json({ status: 'received', message: rawText });

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
