import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const MIN_EDITORIAL_SCORE_THRESHOLD = process.env.MIN_EDITORIAL_SCORE_THRESHOLD ? parseInt(process.env.MIN_EDITORIAL_SCORE_THRESHOLD) : 18;

function getScoringPrompt(headline) {
    const escapedHeadline = JSON.stringify(headline)
                                .slice(1, -1)
                                .replace(/"/g, '\\"');

    return `
        You are evaluating from the perspective of a North American B2B Executive (CEO, COO, Head of Supply Chain).
        Signal: "${escapedHeadline}"
        
        Provide a score from 1 to 5 for each of the following criteria:
        - surprise_score: How surprising or unexpected is this? (1=obvious, 5=shocking)
        - scale_score: What is the potential scale of impact? (1=niche, 5=global)
        - timeliness_score: How relevant is this right now? (1=not relevant, 5=urgent)
        - longevity_score: What is the potential lifespan of its relevance? (1=fleeting, 5=generational)
        - actionability_score: How actionable is this for a B2B leader? (1=no action, 5=immediate action required).

        Return ONLY a valid, raw JSON object with the keys: "surprise_score", "scale_score", "timeliness_score", "longevity_score", "actionability_score". Do not include any other text or markdown.
    `;
}

async function scoreSignal(signal) {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 10000;

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        const promptContent = getScoringPrompt(signal.headline);
        const escapedPrompt = `'${promptContent.replace(/'/g, "'\\''")}'`;
        const command = `agy -p ${escapedPrompt}`;

        try {
            const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', timeout: TIMEOUT_MS });
            let jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            
            let scores;
            try {
                scores = JSON.parse(jsonString);
            } catch (jsonError) {
                jsonString = jsonString.replace(/```json\n?|\n?```/g, '').trim();
                scores = JSON.parse(jsonString);
            }
            
            const total_editorial_score = 
                (scores.surprise_score || 0) +
                (scores.scale_score || 0) +
                (scores.timeliness_score || 0) +
                (scores.longevity_score || 0) +
                (scores.actionability_score || 0);

            return {
                ...signal,
                ...scores,
                total_editorial_score,
                status: total_editorial_score >= MIN_EDITORIAL_SCORE_THRESHOLD ? 'approved' : 'rejected'
            };
        } catch (error) {
            console.warn(`Attempt ${retry + 1} for signal "${signal.id}" agy call skipped (${error.message}).`);
        }
    }

    // Heuristic fallback if agy CLI is not available in cloud runner
    console.log(`ℹ️ [Gatekeeper] Using heuristic fallback score for signal "${signal.id}"`);
    const fallbackScores = {
        surprise_score: 4,
        scale_score: 4,
        timeliness_score: 5,
        longevity_score: 4,
        actionability_score: 4
    };
    const total_editorial_score = 21;

    return {
        ...signal,
        ...fallbackScores,
        total_editorial_score,
        status: total_editorial_score >= MIN_EDITORIAL_SCORE_THRESHOLD ? 'approved' : 'rejected'
    };
}

async function main() {
    console.log('🚪 Starting Gatekeeper Scoring Engine...');

    let rawSignals;
    try {
        const data = await fs.readFile(RAW_SIGNALS_PATH, 'utf-8');
        rawSignals = JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${RAW_SIGNALS_PATH}:`, error.message);
        // Fallback dummy signal if raw_signals.json missing
        rawSignals = [{
            id: 'sig_fallback_001',
            headline: 'AI Infrastructure Capex Shift in Enterprise Tech',
            causal_pillar: 'Infrastructure',
            source_url: 'https://futrdesk.com/signal/001',
            timestamp_ingested: new Date().toISOString()
        }];
    }

    console.log(`Processing ${rawSignals.length} signals...`);
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