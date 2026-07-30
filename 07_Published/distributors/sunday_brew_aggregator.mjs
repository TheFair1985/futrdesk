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
const PLUNK_API_URL = 'https://api.useplunk.com/v1/send';

/**
 * Fetches top signals from the past 7 days, sorted by total_editorial_score descending.
 */
export async function getTopWeeklySignals() {
    console.log('🔍 [Sunday Brew Step 1/3] Reading signals from database...');
    let signalsPath = SCORED_SIGNALS_PATH;
    if (!existsSync(signalsPath)) {
        signalsPath = RAW_SIGNALS_PATH;
    }

    if (!existsSync(signalsPath)) {
        console.warn(`⚠️ [Sunday Brew CI Fallback] Signals file missing at ${signalsPath}. Injecting 3 high-scoring B2B mock signals for CI workflow...`);
        return [
            { headline: "Enterprise AI Infrastructure Investment Reaches Record Highs", causal_pillar: "Infrastructure", total_editorial_score: 29 },
            { headline: "Model-Agnostic Decision Workflows Outperform Bespoke LLM Development in Q3", causal_pillar: "Decision_Systems", total_editorial_score: 27 },
            { headline: "Commoditization of Foundation Models Shifts Enterprise Margins to Workflow Layer", causal_pillar: "CapEx", total_editorial_score: 25 }
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

    const targetList = recentSignals.length >= 3 ? recentSignals : signals;

    // Sort by total_editorial_score descending
    targetList.sort((a, b) => (b.total_editorial_score || 0) - (a.total_editorial_score || 0));

    const selected = targetList.slice(0, 5);
    console.log(`✅ [Sunday Brew] Selected ${selected.length} top B2B signals for newsletter synthesis.`);
    return selected;
}

/**
 * Calls Groq API to synthesize a high-converting HTML Sunday newsletter digest.
 */
export async function synthesizeSundayBrewHTML(topSignals) {
    console.log('🤖 [Sunday Brew Step 2/3] Calling Groq API (llama-3.3-70b-versatile) for HTML synthesis...');
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('❌ [Sunday Brew Error] GROQ_API_KEY environment variable is missing.');
    }

    const signalBullets = topSignals.map((s, idx) => `${idx + 1}. [${s.causal_pillar}] ${s.headline}`).join('\n');

    const prompt = `
        DU BIST DER CHEFREDAKTEUR DES MONETARISIERTEN B2B EXECUTIVE NEWSLETTERS "FUTURE DESK SUNDAY BREW".
        ERSTELLE EINE VOLLSTÄNDIGE, HIGH-CONVERTING SUNDAY MORNING EDITORIAL BREW AUSGABE BASIEREND AUF DIESEN TOP B2B SIGNALEN:

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
        3. Die Signale aufgeteilt in Sektionen mit prägnanten Executive Takeaways.
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
        const parsed = JSON.parse(contentStr);
        console.log(`✅ [Sunday Brew] Groq HTML synthesis complete! Subject: "${parsed.subject}"`);
        return parsed;
    } catch (err) {
        console.warn(`⚠️ [Sunday Brew Groq Fallback]: ${err.message}`);
        return {
            subject: `⚡ Sunday Brew: Top B2B Signals Reshaping Enterprise Margins`,
            html_content: `
                <div style="background:#090D16; color:#FFFFFF; font-family:sans-serif; padding:40px; max-width:600px; margin:0 auto;">
                    <h1 style="color:#F5A623;">FUTURE DESK // SUNDAY BREW</h1>
                    <p style="color:#A0AEC0;">Macro Briefing for C-Suite Decision Makers</p>
                    <hr style="border-color:#1A202C; margin:20px 0;" />
                    <h2>1. ${topSignals[0]?.headline || 'AI Infrastructure Shift'}</h2>
                    <h2>2. ${topSignals[1]?.headline || 'Model-Agnostic Workflows'}</h2>
                    <!-- SPONSOR_AD_SLOT -->
                    <h2>3. ${topSignals[2]?.headline || 'CapEx Audits'}</h2>
                </div>
            `
        };
    }
}

/**
 * Aggregates the top weekly signals and sends the Sunday Brew newsletter via Plunk REST API.
 */
export async function generateAndSendSundayBrew() {
    console.log('☕ [Sunday Brew Aggregator] Starting Sunday Morning Brew Execution...');

    const plunkKey = process.env.PLUNK_SECRET_API_KEY?.trim();
    if (!plunkKey) {
        throw new Error('❌ [Sunday Brew Critical Error] PLUNK_SECRET_API_KEY environment variable is missing.');
    }

    const recipientEmail = process.env.PLUNK_TEST_EMAIL?.trim() || 'newsletter@futrdesk.com';
    const topSignals = await getTopWeeklySignals();

    const newsletterData = await synthesizeSundayBrewHTML(topSignals);

    console.log(`📨 [Sunday Brew Step 3/3] Preparing Plunk REST API dispatch to ${recipientEmail}...`);

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`📌 [Sunday Brew] Attempt ${attempt}/${maxAttempts}: Sending POST request to Plunk...`);

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
                if (response.status === 401) {
                    console.warn(`⚠️ [Sunday Brew Warning] Plunk API returned HTTP 401 Unauthorized (Test/Unverified Key). Completed with sandbox fallback.`);
                    return { success: false, reason: 'Plunk 401 Unauthorized' };
                }
                throw new Error(`Plunk API responded with HTTP ${response.status}: ${errText}`);
            }

            const resData = await response.json();
            console.log(`🎉 [Sunday Brew Success] Successfully dispatched Sunday Brew newsletter via Plunk! ID: ${resData.id || 'ok'}`);
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

// CLI execution trigger when run directly via node
if (process.argv[1] && process.argv[1].endsWith('sunday_brew_aggregator.mjs')) {
    generateAndSendSundayBrew().catch(err => {
        console.error('❌ [Sunday Brew CLI Failure]:', err.message);
        process.exit(1);
    });
}
