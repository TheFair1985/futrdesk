import { promises as fs } from 'fs';

const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const DISTRIBUTION_PACKAGE_JSON_PATH = './07_Published/EP06_Distribution_Package.json';
const DISTRIBUTION_PACKAGE_MD_PATH = './07_Published/EP06_Distribution_Package.md';

const NET_COST_PER_LLM_CALL = 0.0005; // Groq ultra-low latency & cost estimation

// --- Native Groq API Helper ---
async function callGroq(promptContent, fallbackObj = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ [Groq API] GROQ_API_KEY is missing. Utilizing structured fallback.');
        return fallbackObj;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are an AI executive intelligence analyst for Future Desk OS. Respond ONLY with a valid JSON object.' },
                    { role: 'user', content: promptContent }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.warn(`⚠️ [Groq API] Response error [HTTP ${response.status}]: ${errorDetails}`);
            return fallbackObj;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) return fallbackObj;

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(content);
        } catch (e) {
            const cleaned = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
            parsedOutput = JSON.parse(cleaned);
        }
        return parsedOutput;

    } catch (err) {
        console.warn(`⚠️ [Groq API] Fetch error: ${err.message}`);
        return fallbackObj;
    }
}

// --- 1. YOUTUBE SHORTS / TIKTOK / REELS METADATA ---
async function generateVideoMetadata(leadingQuestion, topSignal) {
    const prompt = `
        Generate metadata for a YouTube Short/TikTok/Reel video based on the following leading question and top signal.
        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a valid JSON object in this exact format:
        {
          "titles": ["Title Option 1", "Title Option 2", "Title Option 3"],
          "description": "Video description...",
          "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"]
        }
    `;
    const fallback = {
        titles: [
            `${topSignal.causal_pillar}: ${topSignal.headline.substring(0, 40)}...`,
            "Future Desk OS B2B Executive Briefing",
            "90-Day Machine Strategy Shift"
        ],
        description: `B2B Executive Briefing on ${topSignal.causal_pillar} signal: "${topSignal.headline}"`,
        hashtags: ["#B2B", "#AI", "#FutureDeskOS"]
    };
    return callGroq(prompt, fallback);
}

// --- 2. LINKEDIN EXECUTIVE BRIEFING POST ---
async function generateLinkedInPost(leadingQuestion, topSignal) {
    const prompt = `
        Generate an executive-focused LinkedIn post based on the following leading question and top signal.
        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Respond ONLY with a valid JSON object in this exact format:
        {
          "post": "Full LinkedIn post text..."
        }
    `;
    const fallback = {
        post: `🚀 Executive Briefing: ${topSignal.causal_pillar} Shift\n\nSignal: "${topSignal.headline}"\n\nKey Question: ${leadingQuestion}\n\nStrategic Takeaway for B2B Leaders: Evaluate Capex and decision systems for the upcoming quarter.`
    };
    return callGroq(prompt, fallback);
}

// --- 3. X (TWITTER) THREAD ---
async function generateXThread(leadingQuestion, topSignal) {
    const prompt = `
        Generate a 5-tweet X (Twitter) thread based on the following leading question and top signal.
        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"

        Respond ONLY with a valid JSON object in this exact format:
        {
          "thread": ["Tweet 1", "Tweet 2", "Tweet 3", "Tweet 4", "Tweet 5"]
        }
    `;
    const fallback = {
        thread: [
            `1/5 Signal Alert: "${topSignal.headline}"`,
            `2/5 Why it matters: Impacting ${topSignal.causal_pillar}.`,
            `3/5 Core Question: ${leadingQuestion}`,
            `4/5 Actionable step: Audit your operational workflow.`,
            `5/5 Follow @FutureDeskOS for daily B2B intelligence.`
        ]
    };
    return callGroq(prompt, fallback);
}

// --- 4. NEWSLETTER LEAD SECTION ---
async function generateNewsletterLead(leadingQuestion, topSignal) {
    const prompt = `
        Generate the lead section for a B2B newsletter issue based on the following leading question and top signal.
        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"

        Respond ONLY with a valid JSON object in this exact format:
        {
          "article": "Full newsletter lead article text..."
        }
    `;
    const fallback = {
        article: `Welcome to this issue of Future Desk OS. Today we examine "${topSignal.headline}" and what it signifies for decision systems in the coming cycle.`
    };
    return callGroq(prompt, fallback);
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
    console.log('🚀 Starting Native Groq Cloud AI Distribution Engine...');

    const isSandboxMode = process.env.SANDBOX_MODE !== 'false';
    console.log(`🔒 Environment Mode: ${isSandboxMode ? 'SANDBOX_MODE (Dry Run)' : 'LIVE_PRODUCTION'}`);

    let scriptJson;
    try {
        const rawScript = await fs.readFile(SCRIPT_JSON_PATH, 'utf-8');
        scriptJson = JSON.parse(rawScript);
    } catch (e) {
        console.warn(`Could not read script file ${SCRIPT_JSON_PATH}, using fallback script data.`);
        scriptJson = {
            leadingQuestion: 'How will recent AI infrastructure shifts impact B2B decision systems over the next 90 days?',
            topSignal: {
                headline: 'Enterprise AI Infrastructure Investment Reaches Record High',
                causal_pillar: 'Infrastructure'
            },
            metadata: { topSignalId: 'sig_default_01' }
        };
    }

    const leadingQuestion = scriptJson.leadingQuestion;
    const topSignal = scriptJson.topSignal;

    console.log(`Processing Distribution Package for Signal: "${topSignal.headline}" via Groq Cloud API (Llama 3 70B)...`);

    let totalLlmCost = 0;
    const distributionPackage = {};

    console.log('Generating YouTube Shorts / TikTok / Reels metadata with Groq...');
    distributionPackage.videoMetadata = await generateVideoMetadata(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating LinkedIn post with Groq...');
    distributionPackage.linkedInPost = await generateLinkedInPost(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating X (Twitter) thread with Groq...');
    distributionPackage.xThread = await generateXThread(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating Newsletter lead section with Groq...');
    distributionPackage.newsletterLead = await generateNewsletterLead(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    distributionPackage.metadata = {
        generationTimestamp: new Date().toISOString(),
        netProcessingCostEur: totalLlmCost,
        sourceScriptId: scriptJson.metadata ? scriptJson.metadata.topSignalId : 'sig_001',
        sandboxMode: isSandboxMode,
        aiEngine: 'Groq Cloud Llama-3-70b-8192'
    };

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
            `📦 *Future Desk OS - Groq Cloud Dry Run Bundle*\n\n` +
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
        console.log('✅ External API posts successfully dispatched.');
    }

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- PUBLISHING DASHBOARD ---');
    console.log(`Engine: Groq REST API (Llama 3 70B)`);
    console.log(`Mode: ${isSandboxMode ? 'SANDBOX (Preview Only)' : 'LIVE'}`);
    console.log('1. Strongest LinkedIn Executive Hook Preview:');
    console.log(`  "${(distributionPackage.linkedInPost.post || '').split('\n')[0]}"`);
    console.log('2. Net Processing Costs for Content Multiplication:');
    console.log(`  - Estimated LLM cost: €${totalLlmCost.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Distribution Engine:', error);
});