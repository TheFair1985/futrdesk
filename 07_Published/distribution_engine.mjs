import { promises as fs } from 'fs';
import { ensureFileSystem } from '../init_system.mjs';
import { runHealthCheck } from '../05_Database/health_check.mjs';
import { createNotionApprovalCard } from '../05_Database/notion_gateway.mjs';
import { renderVideoFactory } from '../04_Visuals/video_factory.mjs';
import { uploadVideoToCloud } from '../04_Visuals/asset_attacher.mjs';
import { sendPlunkNewsletter } from './distributors/plunk_distributor.mjs';
import { publishSocialContent } from './distributors/social_publisher.mjs';
import { dispatchToN8N } from './distributors/webhook_dispatcher.mjs';

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

// --- 5. KALLAWAY VIDEO-REGIEBUCH GENERATOR ---
async function generateKallawayRegiebuch(leadingQuestion, topSignal) {
    const prompt = `
        DU BIST EIN ELITE-REGISSEUR UND VIDEO-PRODUCER FÜR VIRALE B2B-KURZFİLME UND EDITORIAL VIDEOS (KALLAWAY PROTOKOLL).
        ERSTELLE EIN VOLLSTÄNDIGES REGIEBUCH IM JSON-FORMAT FÜR FOLGENDES SIGNAL:
        Headline: "${topSignal.headline}"
        Pillar: "${topSignal.causal_pillar}"
        Question: "${leadingQuestion}"

        Das JSON-Objekt MUSS ein Array namens "scenes" enthalten. Jedes Szenen-Objekt MUSS exakt die folgenden 7 Felder haben:
        "timing", "speaker", "text", "action", "b_roll_topic", "sound_trigger", "highlight_words".

        Respond ONLY with a valid JSON object.
    `;
    const fallback = {
        scenes: [
            {
                timing: "00:00 - 00:03",
                speaker: "Host 1",
                text: `${topSignal.headline}. Why proprietary models fail ROI expectations.`,
                action: "Direct eye contact, rapid zoom on Host 1",
                b_roll_topic: "Dark modern datacenter server racks with blinking LEDs",
                sound_trigger: "SFX_WHOOSH_HEAVY",
                highlight_words: ["ROI", "CapEx", "AI"]
            },
            {
                timing: "00:03 - 00:07",
                speaker: "Host 2",
                text: `${leadingQuestion}`,
                action: "Side angle perspective change, raised eyebrow",
                b_roll_topic: "Executive boardroom glass wall reflection at dusk",
                sound_trigger: "SFX_RISER_SUBTLE",
                highlight_words: ["Decision Systems", "Margins"]
            }
        ]
    };
    return callGroq(prompt, fallback);
}

// --- 6. MULTI-PLATFORM METADATA MATRIX GENERATOR ---
async function generateMetadataMatrix(leadingQuestion, topSignal) {
    const prompt = `
        DU BIST EIN MULTI-PLATFORM CONTENT DISTRIBUTOR FÜR DAS B2B EXECUTIVE NETWORK "FUTURE DESK OS".
        ERSTELLE EIN STRUKTURIERTES METADATA-PAKET IM VALIDEN JSON-FORMAT BASIEREND AUF FOLGENDEN SIGNALDATED:

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Causal Pillar: "${topSignal.causal_pillar}"

        STRENGE ANFORDERUNGEN & JSON SCHEMA:
        Respond ONLY with a valid JSON object matching this exact schema:

        {
          "linkedin_post": "Executive Summary format. Starts with a strong counter-intuitive hook sentence, followed by exactly 3 bullet points (key strategic takeaways for C-level leaders), and ends with a single open strategic question. EXPLICIT RULE: NO EXTERNAL URLS OR LINKS ALLOWED INSIDE THIS TEXT BLOCK.",
          "x_thread_tweet_1": "Provocative hook tweet (MAX 280 CHARACTERS).",
          "x_thread_tweet_2": "Context and executive call-to-action tweet (MAX 280 CHARACTERS).",
          "yt_shorts_meta": {
            "title": "Scroll-stopping title (MAX 60 CHARACTERS, MUST INCLUDE #Shorts)",
            "description": "3-4 sentences optimized for B2B search intent and algorithm indexability.",
            "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
          },
          "tiktok_meta": {
            "description": "Long-tail B2B search SEO focused video caption.",
            "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3", "#Hashtag4", "#Hashtag5"]
          },
          "ig_reels_meta": "High dynamic energy caption for B2B executives, ending with 'Link in Bio', followed by 3-5 niche B2B hashtags."
        }
    `;

    const fallback = {
        linkedin_post: `🚀 Executive Briefing: ${topSignal.causal_pillar} Shift\n\nSignal: "${topSignal.headline}"\n\nKey Strategic Takeaways:\n• 1. Operational CapEx must adapt to rapid intelligence commoditization.\n• 2. Workflow layer architecture defends long-term margins over proprietary model ownership.\n• 3. CFOs must audit custom LLM maintenance costs against price-performance APIs.\n\nHow is your executive board re-evaluating capital allocation for internal decision systems this quarter?`,
        x_thread_tweet_1: `1/2 Signal Alert: ${topSignal.headline}. Owning your foundation model isn't moat insurance—it's a CapEx trap for enterprise leaders.`,
        x_thread_tweet_2: `2/2 Shift from model-centric to workflow-centric design. Decouple core logic and dynamically route tasks to defend margins. Follow @FutureDeskOS for daily B2B intelligence.`,
        yt_shorts_meta: {
            title: `Why Enterprise AI CapEx Fails ROI #Shorts`,
            description: `Amazon's retreat from flagship AI models highlights a critical lesson for enterprise leaders. Learn why model-agnostic workflows defend long-term B2B margins.`,
            tags: ["#EnterpriseAI", "#B2BStrategy", "#CapEx", "#FutureDeskOS"]
        },
        tiktok_meta: {
            description: `B2B Enterprise AI strategy breakdown: Why model-agnostic operational workflows outperform proprietary foundation models in Q3.`,
            hashtags: ["#EnterpriseAI", "#B2BTech", "#ExecutiveLeadership", "#CapEx", "#FutureDeskOS"]
        },
        ig_reels_meta: `Stop over-capitalizing custom LLMs! Enterprise leaders are pivoting to model-agnostic decision workflows to defend Q3 margins. Full analysis & Link in Bio #B2BStrategy #ExecutiveBriefing #EnterpriseAI #FutureDeskOS`
    };

    return callGroq(prompt, fallback);
}

/**
 * Detects common B2B tool mentions and appends UTM-tagged affiliate URLs.
 * @param {string} text - Input text string
 * @returns {string} Text with appended affiliate links
 */
export function injectAffiliateLinks(text = '') {
    if (!text || typeof text !== 'string') return text;

    const affiliateMap = [
        { regex: /\bNotion\b/gi, name: 'Notion', url: 'https://notion.so/?utm_source=futrdesk&utm_medium=content&utm_campaign=b2b_briefing' },
        { regex: /\bVercel\b/gi, name: 'Vercel', url: 'https://vercel.com/?utm_source=futrdesk&utm_medium=content&utm_campaign=b2b_briefing' },
        { regex: /\bGroq\b/gi, name: 'Groq', url: 'https://groq.com/?utm_source=futrdesk&utm_medium=content&utm_campaign=b2b_briefing' },
        { regex: /\bSupabase\b/gi, name: 'Supabase', url: 'https://supabase.com/?utm_source=futrdesk&utm_medium=content&utm_campaign=b2b_briefing' },
        { regex: /\bLemon Squeezy\b/gi, name: 'Lemon Squeezy', url: 'https://futrdesk.lemonsqueezy.com/?utm_source=futrdesk&utm_medium=content' },
        { regex: /\bPartnerStack\b/gi, name: 'PartnerStack', url: 'https://partnerstack.com/?utm_source=futrdesk&utm_medium=content' }
    ];

    let modifiedText = text;
    const detectedLinks = [];

    for (const item of affiliateMap) {
        if (item.regex.test(text) && !text.includes(item.url)) {
            detectedLinks.push(`🔗 ${item.name}: ${item.url}`);
        }
    }

    if (detectedLinks.length > 0) {
        modifiedText = `${modifiedText.trim()}\n\n---\nExecutive Toolkit:\n${detectedLinks.join('\n')}`;
    }

    return modifiedText;
}

// --- MAIN FUNCTION ---
async function main() {
    await ensureFileSystem();
    await runHealthCheck();
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

    console.log('Generating Multi-Platform Metadata Matrix with Groq...');
    distributionPackage.metadataMatrix = await generateMetadataMatrix(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    // Apply UTM Affiliate Injection to YouTube Shorts, TikTok, and X Thread (LinkedIn remains untouched)
    if (distributionPackage.metadataMatrix.yt_shorts_meta) {
        distributionPackage.metadataMatrix.yt_shorts_meta.description = injectAffiliateLinks(distributionPackage.metadataMatrix.yt_shorts_meta.description);
    }
    if (distributionPackage.metadataMatrix.tiktok_meta) {
        distributionPackage.metadataMatrix.tiktok_meta.description = injectAffiliateLinks(distributionPackage.metadataMatrix.tiktok_meta.description);
    }
    if (distributionPackage.metadataMatrix.x_thread_tweet_2) {
        distributionPackage.metadataMatrix.x_thread_tweet_2 = injectAffiliateLinks(distributionPackage.metadataMatrix.x_thread_tweet_2);
    }

    // Backwards compatibility mappings for existing downstream components
    distributionPackage.videoMetadata = {
        titles: [distributionPackage.metadataMatrix.yt_shorts_meta?.title || 'Future Desk OS Short'],
        description: distributionPackage.metadataMatrix.yt_shorts_meta?.description || '',
        hashtags: distributionPackage.metadataMatrix.yt_shorts_meta?.tags || ['#B2B', '#FutureDeskOS']
    };
    distributionPackage.linkedInPost = {
        post: distributionPackage.metadataMatrix.linkedin_post
    };
    distributionPackage.xThread = {
        thread: [
            distributionPackage.metadataMatrix.x_thread_tweet_1,
            distributionPackage.metadataMatrix.x_thread_tweet_2
        ]
    };

    console.log('Generating Newsletter lead section with Groq...');
    distributionPackage.newsletterLead = await generateNewsletterLead(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating Kallaway Video-Regiebuch with Groq...');
    distributionPackage.kallawayRegiebuch = await generateKallawayRegiebuch(leadingQuestion, topSignal);
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

    // --- REMOTION VIDEO FACTORY RENDERING ---
    console.log('\n🎬 Triggering Remotion Video Factory Engine...');
    const videoResult = await renderVideoFactory(distributionPackage);
    distributionPackage.renderedVideoPath = videoResult.videoPath;

    // --- CLOUD ASSET UPLOAD ---
    console.log('\n☁️ Uploading Rendered Video Asset to Supabase Cloud Storage...');
    const cloudResult = await uploadVideoToCloud(distributionPackage.renderedVideoPath);
    distributionPackage.video_download_url = cloudResult.video_download_url;

    // --- NOTION APPROVAL CARD DISPATCH ---
    console.log('\n📌 Writing Content Package to Notion Approval Center...');
    const contentPackage = {
        title: distributionPackage.videoMetadata?.titles?.[0] || topSignal.headline || "Future Desk OS Editorial",
        linkedInPost: distributionPackage.linkedInPost,
        xThread: distributionPackage.xThread,
        kallawayRegiebuch: distributionPackage.kallawayRegiebuch,
        videoMetadata: distributionPackage.videoMetadata,
        newsletterLead: distributionPackage.newsletterLead,
        status: "Draft",
        metadata: distributionPackage.metadata
    };

    const notionResult = await createNotionApprovalCard(contentPackage);
    if (notionResult.success) {
        console.log(`✅ Notion Approval Card successfully created! Page ID: ${notionResult.pageId}`);
    } else {
        console.warn(`⚠️ Notion Approval Card dispatch completed with status: ${notionResult.reason || notionResult.error}`);
    }

    // --- MULTI-PLATFORM LIVE DISTRIBUTION ---
    console.log('\n📡 Triggering Multi-Platform Live Distribution...');
    const plunkResult = await sendPlunkNewsletter(distributionPackage);
    const socialResult = await publishSocialContent(distributionPackage);

    // --- N8N WEBHOOK DISPATCH ---
    console.log('\n🌐 Dispatching Metadata Payload to n8n Webhook...');
    if (process.env.N8N_WEBHOOK_URL) {
        await dispatchToN8N();
    } else {
        console.warn('⚠️ [N8N Dispatcher Warning] N8N_WEBHOOK_URL environment variable is missing. Skipping n8n push.');
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