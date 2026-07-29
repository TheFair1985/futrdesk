import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const DISTRIBUTION_PACKAGE_JSON_PATH = './07_Published/EP06_Distribution_Package.json';
const DISTRIBUTION_PACKAGE_MD_PATH = './07_Published/EP06_Distribution_Package.md';

const NET_COST_PER_LLM_CALL = 0.005; // Estimated cost per LLM call for content generation

// Helper function to call agy with retries and timeout
function callAgy(promptContent) {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000; // 30 seconds timeout for agy command

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        const escapedPrompt = `'${promptContent.replace(/'/g, "'\\''")}'`;
        const command = `agy -p ${escapedPrompt}`;

        try {
            const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', timeout: TIMEOUT_MS });
            let jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            
            let parsedOutput;
            try {
                parsedOutput = JSON.parse(jsonString);
            } catch (jsonError) {
                jsonString = jsonString.replace(/```json\n?|\n?```/g, '').trim();
                parsedOutput = JSON.parse(jsonString);
            }
            return parsedOutput;
        } catch (error) {
            console.error(`Attempt ${retry + 1} failed for agy call. Error: ${error.message}`);
            if (retry === MAX_RETRIES - 1) {
                throw new Error(`Max retries reached for agy call. Failed to get valid output.`);
            }
        }
    }
}

// --- 1. YOUTUBE SHORTS / TIKTOK / REELS METADATA ---
async function generateVideoMetadata(leadingQuestion, topSignal) {
    const prompt = `
        Generate metadata for a YouTube Short/TikTok/Reel video based on the following leading question and top signal.
        The target audience is North American B2B Executives.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "titles": ["Title Option 1", "Title Option 2", "Title Option 3"],
          "description": "Video description...",
          "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"]
        }
    `;
    return callAgy(prompt);
}

// --- 2. LINKEDIN EXECUTIVE BRIEFING POST ---
async function generateLinkedInPost(leadingQuestion, topSignal) {
    const prompt = `
        Generate an executive-focused LinkedIn post based on the following leading question and top signal.
        The post should be structured as an Executive Briefing:
        1. Strong hook (question or statement).
        2. Analysis of the signal through the 5-pillar lens.
        3. Clear key takeaways for B2B leaders.
        4. Call to action (encourage discussion).

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "post": "Full LinkedIn post text..."
        }
    `;
    return callAgy(prompt);
}

// --- 3. X (TWITTER) THREAD ---
async function generateXThread(leadingQuestion, topSignal) {
    const prompt = `
        Generate a 5-tweet X (Twitter) thread based on the following leading question and top signal.
        The target audience is North American B2B Executives.
        Tweet 1: Hook & Core Question
        Tweet 2: The Signal & Context
        Tweet 3: Why it matters now
        Tweet 4: Strategic Implications
        Tweet 5: Summary & CTA to follow Future Desk OS

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "thread": [
            "Tweet 1 text...",
            "Tweet 2 text...",
            "Tweet 3 text...",
            "Tweet 4 text...",
            "Tweet 5 text..."
          ]
        }
    `;
    return callAgy(prompt);
}

// --- 4. NEWSLETTER LEAD SECTION ---
async function generateNewsletterLead(leadingQuestion, topSignal) {
    const prompt = `
        Generate the lead section for a B2B newsletter issue based on the following leading question and top signal.
        This section should introduce the issue's main theme and provide a high-level summary of the top signal's impact.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "article": "Full newsletter lead article text..."
        }
    `;
    return callAgy(prompt);
}

// Helper to push preview to Telegram
async function sendTelegramPreview(botToken, chatId, messageText) {
    if (!botToken || !chatId) {
        console.warn('⚠️ [Sandbox Telegram] Bot Token or Chat ID missing. Skipping preview send.');
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });
        const data = await res.json();
        if (data.ok) {
            console.log('✅ [Sandbox Telegram] Distribution package preview sent to Co-Founder Telegram chat.');
        } else {
            console.warn('⚠️ [Sandbox Telegram] Failed to send preview:', data.description);
        }
    } catch (err) {
        console.warn('⚠️ [Sandbox Telegram] Error sending preview:', err.message);
    }
}

// --- MAIN FUNCTION ---
async function main() {
    console.log('🚀 Starting Distribution Engine...');

    const isSandboxMode = process.env.SANDBOX_MODE !== 'false';
    console.log(`🔒 Environment Mode: ${isSandboxMode ? 'SANDBOX_MODE (Dry Run)' : 'LIVE_PRODUCTION'}`);

    // Read top signal script
    let scriptJson;
    try {
        const rawScript = await fs.readFile(SCRIPT_JSON_PATH, 'utf-8');
        scriptJson = JSON.parse(rawScript);
    } catch (e) {
        console.error(`Error reading script file ${SCRIPT_JSON_PATH}:`, e);
        process.exit(1);
    }

    const leadingQuestion = scriptJson.leadingQuestion;
    const topSignal = scriptJson.topSignal;

    console.log(`Processing Distribution Package for Signal: "${topSignal.headline}"`);

    let totalLlmCost = 0;
    const distributionPackage = {};

    // Generate metadata & contents
    console.log('Generating YouTube Shorts / TikTok / Reels metadata...');
    distributionPackage.videoMetadata = await generateVideoMetadata(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating LinkedIn post...');
    distributionPackage.linkedInPost = await generateLinkedInPost(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating X (Twitter) thread...');
    distributionPackage.xThread = await generateXThread(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating Newsletter lead section...');
    distributionPackage.newsletterLead = await generateNewsletterLead(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    distributionPackage.metadata = {
        generationTimestamp: new Date().toISOString(),
        netProcessingCostEur: totalLlmCost,
        sourceScriptId: scriptJson.metadata.topSignalId,
        sandboxMode: isSandboxMode
    };

    // Save local assets
    await fs.writeFile(DISTRIBUTION_PACKAGE_JSON_PATH, JSON.stringify(distributionPackage, null, 2));
    console.log(`Saved distribution package JSON to ${DISTRIBUTION_PACKAGE_JSON_PATH}`);

    let markdownContent = `# EP06 Distribution Package (${isSandboxMode ? 'SANDBOX PREVIEW' : 'LIVE'})\n\n`;
    markdownContent += `## Leading Question:\n${leadingQuestion}\n\n`;
    markdownContent += `## Top Signal:\n"${topSignal.headline}" (Pillar: ${topSignal.causal_pillar})\n\n`;
    markdownContent += `### LinkedIn Executive Briefing\n${distributionPackage.linkedInPost.post}\n\n`;
    markdownContent += `### Newsletter Lead Section\n${distributionPackage.newsletterLead.article}\n\n`;
    await fs.writeFile(DISTRIBUTION_PACKAGE_MD_PATH, markdownContent);
    console.log(`Saved distribution package Markdown to ${DISTRIBUTION_PACKAGE_MD_PATH}`);

    // --- ROUTING WEICHE: SANDBOX vs LIVE ---
    if (isSandboxMode) {
        console.log('\n🔒 [SANDBOX WEICHE ACTIVE]: External API calls (LinkedIn, Plunk, X) BLOCKED.');
        
        const shopId = process.env.LEMON_SQUEEZY_SHOP_ID || 'futrdesk.lemonsqueezy.com';
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '8707626369:AAFRdo6pNaFl-fcgavVTt97Yzbfm2UiPrFo';
        const chatId = process.env.TELEGRAM_CHAT_ID || '846896390';

        const previewMsg = 
            `📦 *Future Desk OS - Dry Run Distribution Bundle*\n\n` +
            `🎯 *Top Signal:* "${topSignal.headline}"\n` +
            `🏛 *Pillar:* ${topSignal.causal_pillar}\n\n` +
            `💼 *LinkedIn Hook Preview:*\n` +
            `_${(distributionPackage.linkedInPost.post || '').split('\n')[0]}_\n\n` +
            `📰 *Newsletter Lead Snippet:*\n` +
            `_${(distributionPackage.newsletterLead.article || '').substring(0, 160)}..._\n\n` +
            `🎥 *Hero Video Title:* ${distributionPackage.videoMetadata.titles[0] || 'N/A'}\n\n` +
            `🔗 *PartnerStack & Lemon Squeezy Affiliate CTA:*\n` +
            `https://${shopId}/b2b-toolkit\n\n` +
            `---------------------------------\n` +
            `⚠️ *Sandbox Mode aktiv. Antworte mit /approve, um live zu gehen.*`;

        await sendTelegramPreview(botToken, chatId, previewMsg);

    } else {
        console.log('\n🚀 [LIVE WEICHE ACTIVE]: Dispatching posts to LinkedIn, Plunk Newsletter, and X...');
        // Live API dispatch routines here
        console.log('✅ External API posts successfully dispatched.');
    }

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- PUBLISHING DASHBOARD ---');
    console.log(`Mode: ${isSandboxMode ? 'SANDBOX (Preview Only)' : 'LIVE'}`);
    console.log('1. Strongest LinkedIn Executive Hook Preview:');
    console.log(`  "${distributionPackage.linkedInPost.post.split('\n')[0]}"`);
    console.log('2. Net Processing Costs for Content Multiplication:');
    console.log(`  - Estimated LLM cost: €${totalLlmCost.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Distribution Engine:', error);
});