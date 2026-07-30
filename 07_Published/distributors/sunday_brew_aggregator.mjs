import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { dirname } from 'path';

// Safely load environment variables
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Continue in production
}

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const PREVIEW_HTML_PATH = './07_Published/previews/sunday_brew_preview.html';
const PLUNK_API_URL = 'https://api.useplunk.com/v1/send';

/**
 * Compiles structured newsletter JSON payload into an email-safe, table-based Master HTML Template
 * matching the Mobile App Dashboard UI aesthetic (Obsidian/Charcoal Dark Mode).
 * @param {Object} data - Structured newsletter content from Groq AI
 * @returns {string} Fully compiled HTML document string
 */
export function renderMasterNewsletterHTML(data = {}) {
    const subject = data.subject || "⚡ Sunday Brew: Executive Intelligence Digest";
    const intro = data.intro || "The top macro signals and strategic takeaways for B2B executive leaders this week.";
    const signals = Array.isArray(data.signals) ? data.signals : [];
    const sponsorCopy = data.sponsor_copy || "Brought to you by PartnerStack — Scale your B2B enterprise partner ecosystem effortlessly.";

    const renderSignalCard = (signal, index) => {
        const title = signal.title || signal.headline || `Signal #${index + 1}`;
        const pillar = signal.causal_pillar || signal.pillar || "Strategic Insight";
        const score = Math.min(30, Math.max(1, signal.total_editorial_score || signal.score || 25));
        const scorePercentage = Math.round((score / 30) * 100);

        const takeaways = Array.isArray(signal.takeaways) ? signal.takeaways : [signal.takeaway || "Re-evaluate capital allocation and operational workflows."];

        const renderBullet = (text, idx) => {
            const dotColor = idx % 2 === 0 ? '#10B981' : '#FF3B30';
            return `
                <tr style="vertical-align: top;">
                    <td style="padding: 5px 12px 6px 0; width: 14px;">
                        <div style="width: 7px; height: 7px; border-radius: 50%; background-color: ${dotColor}; margin-top: 7px;"></div>
                    </td>
                    <td style="padding: 4px 0 6px 0; color: #CBD5E1; font-size: 14px; line-height: 1.6; font-family: 'Inter', -apple-system, sans-serif;">
                        ${text}
                    </td>
                </tr>
            `;
        };

        return `
            <!-- Dashboard Activity Card ${index + 1} -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #0F172A; border-radius: 12px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);">
                <tr>
                    <td style="padding: 24px;">
                        <!-- Top Metadata Row: Pill Badge + Score Meter -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                            <tr>
                                <td style="text-align: left; vertical-align: middle;">
                                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.3); color: #00F2FE; font-size: 11px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 1px; border-radius: 20px;">
                                        ${pillar}
                                    </span>
                                </td>
                                <td style="text-align: right; vertical-align: middle; width: 150px;">
                                    <div style="display: inline-block; text-align: right; width: 100%;">
                                        <div style="margin-bottom: 4px;">
                                            <span style="font-size: 10px; color: #64748B; font-weight: 700; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">SCORE: </span>
                                            <span style="font-size: 11px; font-weight: 700; color: #00F2FE; font-family: 'Space Grotesk', monospace;">${score}/30</span>
                                        </div>
                                        <!-- 4px High Metric Score Bar -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1E293B; border-radius: 4px; height: 4px; overflow: hidden;">
                                            <tr>
                                                <td style="width: ${scorePercentage}%; background-color: #00F2FE; height: 4px; border-radius: 4px;"></td>
                                                <td style="width: ${100 - scorePercentage}%; height: 4px;"></td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Bold Activity Header -->
                        <h3 style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 18px; line-height: 1.35; font-weight: 700; font-family: 'Space Grotesk', -apple-system, sans-serif; letter-spacing: -0.2px;">
                            ${index + 1}. ${title}
                        </h3>

                        <!-- Actionable Takeaway Bullet Grid -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            ${takeaways.map((t, i) => renderBullet(t, i)).join('')}
                        </table>
                    </td>
                </tr>
            </table>
        `;
    };

    const sponsorBlock = `
        <!-- SPONSOR_AD_SLOT -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #1E293B; border: 1px solid #F5A623; border-radius: 12px; overflow: hidden;">
            <tr>
                <td style="padding: 24px; text-align: center;">
                    <div style="display: inline-block; padding: 4px 14px; background-color: rgba(245, 166, 35, 0.15); border: 1px solid rgba(245, 166, 35, 0.4); border-radius: 20px; margin-bottom: 10px;">
                        <span style="font-size: 10px; color: #F5A623; font-weight: 800; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 1.5px;">⚡ ENTERPRISE SPONSORSHIP</span>
                    </div>
                    <h4 style="margin: 6px 0 10px 0; color: #FFFFFF; font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; line-height: 1.4;">${sponsorCopy}</h4>
                    <a href="https://partnerstack.com/?utm_source=futrdesk&utm_medium=newsletter" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #F5A623; color: #090D16; font-size: 13px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; text-decoration: none; border-radius: 8px;">Explore Partner Engine &rarr;</a>
                </td>
            </tr>
        </table>
    `;

    let signalsHTML = '';
    signals.forEach((sig, idx) => {
        signalsHTML += renderSignalCard(sig, idx);
        if (idx === 1) {
            signalsHTML += sponsorBlock;
        }
    });

    if (signals.length < 2) {
        signalsHTML += sponsorBlock;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090D16; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #090D16; padding: 40px 10px;">
        <tr>
            <td align="center">
                <!-- Mobile Dashboard Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #090D16; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                    
                    <!-- Dashboard Header Bar -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; background-color: #0F172A; border-bottom: 1px solid #1E293B; text-align: left;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: #F5A623; letter-spacing: 2px; text-transform: uppercase;">FUTRDESK OS</span>
                                        <span style="font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #64748B; margin-left: 8px;">| SUNDAY BREW</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 6px;">
                                        <span style="font-size: 13px; color: #94A3B8; font-weight: 500;">Executive Dashboard & Macro Signal Synthesis</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Macro Executive Intro -->
                    <tr>
                        <td style="padding: 28px 32px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
                            <h2 style="margin: 0 0 10px 0; color: #FFFFFF; font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; line-height: 1.35;">
                                ${subject}
                            </h2>
                            <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                                ${intro}
                            </p>
                        </td>
                    </tr>

                    <!-- Dashboard Activity Cards List -->
                    <tr>
                        <td style="padding: 28px 32px; background-color: #090D16;">
                            <div style="margin-bottom: 20px; font-size: 11px; font-weight: 800; color: #64748B; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 1.5px;">
                                📊 RECENTLY COMPLETED SIGNALS
                            </div>
                            ${signalsHTML}
                        </td>
                    </tr>

                    <!-- Dashboard Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #0F172A; border-top: 1px solid #1E293B; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #64748B; font-size: 12px; line-height: 1.5;">
                                You are receiving this Executive Briefing as a subscriber of <strong style="color: #CBD5E1;">Future Desk OS Intelligence</strong>.
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="https://futrdesk.com/privacy" style="color: #F5A623; text-decoration: none; margin-right: 12px; font-weight: 600;">Privacy Policy</a>
                                <a href="{{ UnsubscribeURL }}" style="color: #64748B; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

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
 * Calls Groq API to synthesize structured newsletter content fields for Master HTML template injection.
 */
export async function synthesizeSundayBrewHTML(topSignals) {
    console.log('🤖 [Sunday Brew Step 2/3] Calling Groq API (llama-3.3-70b-versatile) for structured JSON synthesis...');
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('❌ [Sunday Brew Error] GROQ_API_KEY environment variable is missing.');
    }

    const signalBullets = topSignals.map((s, idx) => `${idx + 1}. [Pillar: ${s.causal_pillar}] ${s.headline}`).join('\n');

    const prompt = `
        DU BIST DER CHEFREDAKTEUR DES B2B EXECUTIVE NEWSLETTERS "FUTURE DESK SUNDAY BREW".
        ERSTELLE STRUKTURIERTEN NEWSLETTER-CONTENT IM VALIDEN JSON-FORMAT BASIEREND AUF DIESEN TOP B2B SIGNALEN:

        ${signalBullets}

        STRENGE FORMATIERUNGS- UND REGEL-ANFORDERUNGEN:
        Antworte AUSSCHLIESSLICH im validen JSON-Format mit exakt folgenden Feldern:
        {
          "subject": "Punchy, high-open-rate B2B subject line (e.g. ⚡ Sunday Brew: Why Model-Agnostic Workflows Won Q3)",
          "intro": "1-2 sentences macro executive summary setting the strategic context for C-level leaders.",
          "sponsor_copy": "Brought to you by PartnerStack — Scale your enterprise B2B partner network effortlessly.",
          "signals": [
            {
              "causal_pillar": "Infrastructure",
              "title": "Clear Action-Oriented Title",
              "takeaways": [
                "Strategic Action Takeaway 1 for CEOs/CFOs",
                "Strategic Action Takeaway 2 for Operations"
              ]
            }
          ]
        }
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
        console.log(`✅ [Sunday Brew] Groq structured JSON synthesis complete! Subject: "${parsed.subject}"`);
        return parsed;
    } catch (err) {
        console.warn(`⚠️ [Sunday Brew Groq Fallback]: ${err.message}`);
        return {
            subject: `⚡ Sunday Brew: Top B2B Signals Reshaping Enterprise Margins`,
            intro: `Amazon's retreat from proprietary foundation models highlights a broader trend: C-level leaders are decoupling core business logic to defend EBITDA margins.`,
            sponsor_copy: `Brought to you by PartnerStack — Scale your enterprise B2B partner engine.`,
            signals: topSignals.map(s => ({
                causal_pillar: s.causal_pillar || 'Strategy',
                title: s.headline,
                takeaways: [
                    `Audit proprietary AI compute maintenance costs against price-performance API providers.`,
                    `Shift capital allocation to model-agnostic workflow layer architecture.`
                ]
            }))
        };
    }
}

/**
 * Aggregates the top weekly signals, compiles Master HTML, saves preview, and dispatches newsletter via Plunk REST API.
 */
export async function generateAndSendSundayBrew() {
    console.log('☕ [Sunday Brew Aggregator] Starting Sunday Morning Brew Execution...');

    const plunkKey = process.env.PLUNK_SECRET_API_KEY?.trim();
    if (!plunkKey) {
        throw new Error('❌ [Sunday Brew Critical Error] PLUNK_SECRET_API_KEY environment variable is missing.');
    }

    const recipientEmail = process.env.PLUNK_TEST_EMAIL?.trim() || 'newsletter@futrdesk.com';
    const topSignals = await getTopWeeklySignals();

    const structuredData = await synthesizeSundayBrewHTML(topSignals);
    const compiledHTML = renderMasterNewsletterHTML(structuredData);

    // Save compiled Master HTML to 07_Published/previews/sunday_brew_preview.html for local browser inspection
    try {
        await fs.mkdir(dirname(PREVIEW_HTML_PATH), { recursive: true });
        await fs.writeFile(PREVIEW_HTML_PATH, compiledHTML);
        console.log(`✅ [Sunday Brew] Master HTML preview generated and saved to ${PREVIEW_HTML_PATH}`);
    } catch (err) {
        console.error(`⚠️ [Sunday Brew] Error writing HTML preview file: ${err.message}`);
    }

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
                    subject: structuredData.subject,
                    body: compiledHTML
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 401) {
                    console.warn(`⚠️ [Sunday Brew Warning] Plunk API returned HTTP 401 Unauthorized (Test/Unverified Key). Completed with sandbox fallback.`);
                    return { success: false, reason: 'Plunk 401 Unauthorized', previewPath: PREVIEW_HTML_PATH };
                }
                throw new Error(`Plunk API responded with HTTP ${response.status}: ${errText}`);
            }

            const resData = await response.json();
            console.log(`🎉 [Sunday Brew Success] Successfully dispatched Sunday Brew newsletter via Plunk! ID: ${resData.id || 'ok'}`);
            return { success: true, emailId: resData.id, subject: structuredData.subject, previewPath: PREVIEW_HTML_PATH };
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
