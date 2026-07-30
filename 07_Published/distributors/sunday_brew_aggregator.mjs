import { promises as fs } from 'fs';
import { existsSync } from 'fs';

// Safely load environment variables
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Continue in production
}

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const PLUNK_API_URL = 'https://api.useplunk.com/v1/sends';

/**
 * Fetches top 5 signals from the past 7 days, sorted by total_editorial_score descending.
 */
export async function getTopWeeklySignals() {
    let signalsPath = SCORED_SIGNALS_PATH;
    if (!existsSync(signalsPath)) {
        signalsPath = RAW_SIGNALS_PATH;
    }

    if (!existsSync(signalsPath)) {
        console.warn(`⚠️ [Sunday Brew] No signals file found at ${signalsPath}. Utilizing fallback mock signals.`);
        return [
            { headline: "Enterprise AI Infrastructure Investments Surge 40%", causal_pillar: "Infrastructure", total_editorial_score: 28 },
            { headline: "Model-Agnostic Workflows Outperform Custom LLMs in Q3", causal_pillar: "Decision_Systems", total_editorial_score: 27 },
            { headline: "Proprietary Model Maintenance Costs Trigger CFO Audit", causal_pillar: "CapEx", total_editorial_score: 25 },
            { headline: "Autonomous Agent Clusters Streamline Supply Chain Decision Systems", causal_pillar: "Operations", total_editorial_score: 24 },
            { headline: "Commoditization of Foundation Models Drives Margins to Workflow Layer", causal_pillar: "Markets", total_editorial_score: 22 }
        ];
    }

    const rawData = await fs.readFile(signalsPath, 'utf-8');
    const signals = JSON.parse(rawData);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Filter within 7 days if timestamp exists
    const recentSignals = signals.filter(s => {
        if (!s.timestamp_ingested) return true;
        return new Date(s.timestamp_ingested) >= sevenDaysAgo;
    });

    const targetList = recentSignals.length >= 5 ? recentSignals : signals;

    // Sort by total_editorial_score descending
    targetList.sort((a, b) => (b.total_editorial_score || 0) - (a.total_editorial_score || 0));

    return targetList.slice(0, 5);
}

/**
 * Calls Groq API to synthesize a high-converting HTML Sunday newsletter digest.
 */
export async function synthesizeSundayBrewHTML(topSignals) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('❌ [Sunday Brew Error] GROQ_API_KEY environment variable is missing.');
    }

    const signalBullets = topSignals.map((s, idx) => `${idx + 1}. [${s.causal_pillar}] ${s.headline}`).join('\n');

    const prompt = `
        DU BIST DER CHEFREDAKTEUR DES MONETARISIERTEN B2B EXECUTIVE NEWSLETTERS "FUTURE DESK SUNDAY BREW".
        ERSTELLE EINE VOLLSTÄNDIGE, HIGH-CONVERTING SUNDAY MORNING EDITORIAL BREW AUSGABE BASIEREND AUF DIESEN TOP 5 B2B SIGNALEN:

        ${signalBullets}

        STRENGE FORMATIERUNGS- UND REGEL-ANFORDERUNGEN:
        Antworte AUSSCHLIESSLICH im validen JSON-Format mit exakt folgenden 2 Keys:
        {
          "subject": "Punchy, high-open-rate B2B subject line (e.g. ⚡ Sunday Brew: Why Model-Agnostic Workflows Won Q3)",
          "html_content": "Full clean HTML string..."
        }

        HTML STRUCTURE RULES:
        1. Verwende sauberes Inline-CSS (Dark Mode / Sleek Modern Executive Styling: background #090D16, text #FFFFFF, accent #F5A623).
        2. Macro-Trend Intro (1-2 Sätze).
        3. Die 5 Signale aufgeteilt in 5 Sektionen mit prägnanten Executive Takeaways.
        4. KRITISCHE REGEL: Platziere den exakten Platzhalter "<!-- SPONSOR_AD_SLOT -->" als eigenen Block direkt ZWISCHEN dem 2. und 3. Signal.
    `;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API error HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const contentStr = data.choices[0].message.content;
        return JSON.parse(contentStr);
    } catch (err) {
        console.warn(`⚠️ [Sunday Brew Groq Fallback]: ${err.message}`);
        return {
            subject: `⚡ Sunday Brew: The 5 B2B Signals Reshaping Enterprise Margins`,
            html_content: `
                <div style="background:#090D16; color:#FFFFFF; font-family:sans-serif; padding:40px; max-width:600px; margin:0 auto;">
                    <h1 style="color:#F5A623;">FUTURE DESK // SUNDAY BREW</h1>
                    <p style="color:#A0AEC0;">Macro Briefing for C-Suite Decision Makers</p>
                    <hr style="border-color:#1A202C; margin:20px 0;" />
                    <h2>1. ${topSignals[0]?.headline || 'AI Infrastructure Shift'}</h2>
                    <h2>2. ${topSignals[1]?.headline || 'Model-Agnostic Workflows'}</h2>
                    <!-- SPONSOR_AD_SLOT -->
                    <h2>3. ${topSignals[2]?.headline || 'CapEx Audits'}</h2>
                    <h2>4. ${topSignals[3]?.headline || 'Agent Clusters'}</h2>
                    <h2>5. ${topSignals[4]?.headline || 'Foundation Model Commoditization'}</h2>
                </div>
            `
        };
    }
}

/**
 * Aggregates the top 5 weekly signals and sends the Sunday Brew newsletter via Plunk REST API.
 */
export async function generateAndSendSundayBrew() {
    console.log('☕ [Sunday Brew Aggregator] Initializing Sunday Morning Brew Aggregator...');

    const plunkKey = process.env.PLUNK_SECRET_API_KEY;
    if (!plunkKey) {
        throw new Error('❌ [Sunday Brew Critical Error] PLUNK_SECRET_API_KEY environment variable is missing.');
    }

    const recipientEmail = process.env.PLUNK_TEST_EMAIL || 'newsletter@futrdesk.com';
    const topSignals = await getTopWeeklySignals();

    console.log(`📌 [Sunday Brew] Synthesizing HTML newsletter for top 5 signals via Groq AI...`);
    const newsletterData = await synthesizeSundayBrewHTML(topSignals);

    console.log(`✉️ [Sunday Brew] Subject: "${newsletterData.subject}"`);

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`📌 [Sunday Brew] Attempt ${attempt}/${maxAttempts}: Dispatching via Plunk API to ${recipientEmail}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

        try {
            const response = await fetch(PLUNK_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${plunkKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: newsletterData.subject,
                    body: newsletterData.html_content
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Plunk API responded with HTTP ${response.status}: ${errText}`);
            }

            const resData = await response.json();
            console.log(`✅ [Sunday Brew] Successfully sent Sunday Brew broadcast via Plunk! ID: ${resData.id || 'ok'}`);
            return { success: true, emailId: resData.id, subject: newsletterData.subject };
        } catch (err) {
            clearTimeout(timeoutId);
            const isAbort = err.name === 'AbortError';
            const reason = isAbort ? 'Request timed out after 10 seconds' : err.message;
            lastError = new Error(`Attempt ${attempt} failed: ${reason}`);

            console.warn(`⚠️ [Sunday Brew] Attempt ${attempt}/${maxAttempts} failed (${reason})`);

            if (attempt < maxAttempts) {
                const backoffMs = Math.pow(2, attempt - 1) * 1000;
                console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
                await new Promise(res => setTimeout(res, backoffMs));
            }
        }
    }

    throw new Error(`❌ [Sunday Brew Error] All ${maxAttempts} attempts to dispatch via Plunk failed. Last error: ${lastError.message}`);
}
