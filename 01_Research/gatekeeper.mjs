import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const MIN_EDITORIAL_SCORE_THRESHOLD = 18;

function getScoringPrompt(headline) {
    // Use JSON.stringify to handle all special characters in the headline,
    // then remove the outer quotes added by JSON.stringify for the shell command.
    // Finally, escape any remaining double quotes for the shell.
    const escapedHeadline = JSON.stringify(headline)
                                .slice(1, -1) // Remove outer quotes
                                .replace(/"/g, '\\"'); // Escape inner double quotes

    return `
        You are evaluating from the perspective of a North American B2B Executive (CEO, COO, Head of Supply Chain).
        Signal: "${escapedHeadline}"
        
        Provide a score from 1 to 5 for each of the following criteria:
        - surprise_score: How surprising or unexpected is this? (1=obvious, 5=shocking)
        - scale_score: What is the potential scale of impact? (1=niche, 5=global)
        - timeliness_score: How relevant is this right now? (1=not relevant, 5=urgent)
        - longevity_score: What is the potential lifespan of its relevance? (1=fleeting, 5=generational)
        - actionability_score: How actionable is this for a B2B leader? (1=no action, 5=immediate action required). A signal has high 'Actionability' (4-5 points) if it influences an operational strategy, an investment (Capex), or an organizational risk.

        Return ONLY a valid, raw JSON object with the keys: "surprise_score", "scale_score", "timeliness_score", "longevity_score", "actionability_score". Do not include any other text or markdown.
    `;
}

async function scoreSignal(signal) {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 10000; // 10 seconds timeout for agy command

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        const promptContent = getScoringPrompt(signal.headline);
        // Escape single quotes within the prompt content, then wrap the whole thing in single quotes
        const escapedPrompt = `'${promptContent.replace(/'/g, "'\\''")}'`;
        const command = `agy -p ${escapedPrompt}`;

        try {
            const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', timeout: TIMEOUT_MS });

            let jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            
            let scores;
            try {
                scores = JSON.parse(jsonString);
            } catch (jsonError) {
                console.error('JSON parsing failed, trying cleanup:', jsonError.message);
                // If direct parse fails, try to clean up common LLM output formats
                jsonString = jsonString.replace(/```json\n?|\n?```/g, '').trim(); // Remove markdown code blocks
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
            console.error(`Attempt ${retry + 1} failed for signal: "${signal.headline}". Error: ${error.message}`);
            if (retry === MAX_RETRIES - 1) {
                console.error(`Max retries reached for signal: "${signal.headline}". Marking as rejected.`);
                return {
                    ...signal,
                    surprise_score: 0,
                    scale_score: 0,
                    timeliness_score: 0,
                    longevity_score: 0,
                    actionability_score: 0,
                    total_editorial_score: 0,
                    status: 'rejected'
                };
            }
        }
    }
}

async function main() {
    console.log('Starting the Gatekeeper...');
    
    let rawSignals = [];
    try {
        const data = await fs.readFile(RAW_SIGNALS_PATH, 'utf-8');
        rawSignals = JSON.parse(data);
    } catch (error) {
        console.error('Error reading raw signals file. Did the sensor_engine run correctly?', error);
        return;
    }

    const scoredSignals = [];
    for (const signal of rawSignals) {
        console.log(`Scoring: ${signal.headline}`);
        const scoredSignal = await scoreSignal(signal);
        scoredSignals.push(scoredSignal);
    }

    const approvedSignals = scoredSignals.filter(s => s.status === 'approved');

    await fs.writeFile(SCORED_SIGNALS_PATH, JSON.stringify(approvedSignals, null, 2));

    // --- ABSCHLUSS-REPORT ---
    const pillarCounts = rawSignals.reduce((acc, signal) => {
        acc[signal.causal_pillar] = (acc[signal.causal_pillar] || 0) + 1;
        return acc;
    }, {});
    
    const totalCost = rawSignals.length * 0.0015; // Assuming cost from sensor_engine

    console.log('\n--- CO-FOUNDER DASHBOARD ---');
    console.log('1. International Signal Distribution:');
    for (const pillar in pillarCounts) {
        console.log(`  - ${pillar}: ${pillarCounts[pillar]}`);
    }
    console.log(`\n2. Gatekeeper Performance:`);
    console.log(`  - ${approvedSignals.length} of ${rawSignals.length} signals passed the ${MIN_EDITORIAL_SCORE_THRESHOLD}-point gate.`);

    if (approvedSignals.length > 0) {
        console.log(`\n3. Top 3 Approved Signals:`);
        approvedSignals
            .sort((a, b) => b.total_editorial_score - a.total_editorial_score)
            .slice(0, 3)
            .forEach((signal, index) => {
                console.log(`  ${index + 1}. "${signal.headline}"`);
                console.log(`     Score: ${signal.total_editorial_score} | Surprise: ${signal.surprise_score}, Scale: ${signal.scale_score}, Timeliness: ${signal.timeliness_score}, Longevity: ${signal.longevity_score}, Actionability: ${signal.actionability_score}`);
            });
    }
    
    console.log(`\n4. Net Processing Costs:`);
    console.log(`  - Estimated cost for this run: €${totalCost.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Gatekeeper:', error);
});