import { promises as fs } from 'fs';

const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const MIN_EDITORIAL_SCORE_THRESHOLD = process.env.MIN_EDITORIAL_SCORE_THRESHOLD ? parseInt(process.env.MIN_EDITORIAL_SCORE_THRESHOLD) : 18;

async function callGroq(promptContent, fallbackObj = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
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
                    { role: 'system', content: 'You are an AI scoring gatekeeper for B2B signals. Respond ONLY with a valid JSON object.' },
                    { role: 'user', content: promptContent }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) return fallbackObj;

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
        return fallbackObj;
    }
}

function getScoringPrompt(headline) {
    return `
        You are evaluating from the perspective of a North American B2B Executive (CEO, COO, Head of Supply Chain).
        Signal: "${headline}"
        
        Provide a score from 1 to 5 for each of the following criteria:
        - surprise_score: How surprising or unexpected is this? (1=obvious, 5=shocking)
        - scale_score: What is the potential scale of impact? (1=niche, 5=global)
        - timeliness_score: How relevant is this right now? (1=not relevant, 5=urgent)
        - longevity_score: What is the potential lifespan of its relevance? (1=fleeting, 5=generational)
        - actionability_score: How actionable is this for a B2B leader? (1=no action, 5=immediate action required).

        Respond ONLY with a valid JSON object with the keys: "surprise_score", "scale_score", "timeliness_score", "longevity_score", "actionability_score".
    `;
}

async function scoreSignal(signal) {
    const promptContent = getScoringPrompt(signal.headline);
    const fallbackScores = {
        surprise_score: 4,
        scale_score: 4,
        timeliness_score: 5,
        longevity_score: 4,
        actionability_score: 4
    };

    const scores = await callGroq(promptContent, fallbackScores);

    const total_editorial_score = 
        (scores.surprise_score || 4) +
        (scores.scale_score || 4) +
        (scores.timeliness_score || 5) +
        (scores.longevity_score || 4) +
        (scores.actionability_score || 4);

    return {
        ...signal,
        ...scores,
        total_editorial_score,
        status: total_editorial_score >= MIN_EDITORIAL_SCORE_THRESHOLD ? 'approved' : 'rejected'
    };
}

async function main() {
    console.log('🚪 Starting Gatekeeper Scoring Engine (Native Groq API)...');

    let rawSignals;
    try {
        const data = await fs.readFile(RAW_SIGNALS_PATH, 'utf-8');
        rawSignals = JSON.parse(data);
    } catch (error) {
        console.warn(`Could not read ${RAW_SIGNALS_PATH}:`, error.message);
        rawSignals = [{
            id: 'sig_fallback_001',
            headline: 'AI Infrastructure Capex Shift in Enterprise Tech',
            causal_pillar: 'Infrastructure',
            source_url: 'https://futrdesk.com/signal/001',
            timestamp_ingested: new Date().toISOString()
        }];
    }

    console.log(`Processing ${rawSignals.length} signals with Groq Llama 3 70B...`);
    const scoredSignals = [];

    for (const signal of rawSignals) {
        const scoredSignal = await scoreSignal(signal);
        scoredSignals.push(scoredSignal);
    }

    await fs.writeFile(SCORED_SIGNALS_PATH, JSON.stringify(scoredSignals, null, 2));
    console.log(`✅ Gatekeeper finished. Saved ${scoredSignals.length} scored signals to ${SCORED_SIGNALS_PATH}`);
}

main().catch(error => {
    console.error('An unexpected error occurred in Gatekeeper Engine:', error);
});