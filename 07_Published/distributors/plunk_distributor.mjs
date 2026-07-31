import { promises as fs } from 'fs';

const DEFAULT_NEWSLETTER_PATH = './09_Newsletter/newsletter_preview.html';

/**
 * Sends newsletter to subscriber list via Plunk REST API
 * @param {Object} contentPackage - Generated content package containing newsletter article
 * @returns {Promise<Object>} Plunk API dispatch result
 */
export async function sendPlunkNewsletter(contentPackage = {}) {
    const apiKey = (process.env.PLUNK_SECRET_API_KEY || process.env.PLUNK_API_KEY)?.replace(/['"]/g, '').trim();

    if (!apiKey) {
        console.warn('⚠️ [Plunk Distributor] PLUNK_SECRET_API_KEY is missing. Skipping live newsletter dispatch.');
        return { success: false, reason: 'Missing PLUNK_SECRET_API_KEY' };
    }

    let htmlContent = '';
    try {
        htmlContent = await fs.readFile(DEFAULT_NEWSLETTER_PATH, 'utf-8');
    } catch (e) {
        const articleText = contentPackage.newsletterLead?.article || 'Future Desk OS Executive Briefing';
        htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Future Desk OS Briefing</title></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #090D16;">Future Desk OS — Executive Briefing</h1>
                <div>${articleText.replace(/\n/g, '<br/>')}</div>
            </body>
            </html>
        `;
    }

    const subject = contentPackage.videoMetadata?.titles?.[0] || 
                    contentPackage.title || 
                    'Future Desk OS — Autonomous Executive Briefing';

    try {
        console.log('📧 [Plunk Distributor] Dispatching newsletter via Plunk REST API (https://next-api.useplunk.com/v1/send)...');
        console.log("[Plunk Distributor] Plunk Key Prefix:", apiKey.substring(0, 3));
        const response = await fetch('https://next-api.useplunk.com/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: process.env.PLUNK_RECIPIENT_OR_LIST?.replace(/['"]/g, '').trim() || 'subscribers@futrdesk.com',
                from: process.env.PLUNK_SENDER_EMAIL?.replace(/['"]/g, '').trim() || 'newsletter@futrdesk.com',
                subject: subject,
                body: htmlContent,
                name: 'Future Desk OS Briefing'
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ [Plunk Distributor] API Error [HTTP ${response.status}]: ${errText}`);
            return { success: false, status: response.status, error: errText };
        }

        const data = await response.json();
        console.log(`✅ [Plunk Distributor] Newsletter successfully sent via Plunk! Transaction ID: ${data.id || 'ok'}`);
        return { success: true, data };
    } catch (err) {
        console.error(`❌ [Plunk Distributor] Exception during Plunk send: ${err.message}`);
        return { success: false, error: err.message };
    }
}
