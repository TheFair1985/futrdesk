import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const SCRIPT_MD_PATH = './03_Scripts/EP03_Top_Signal_Script.md';
const NET_COST_PER_LLM_CALL = 0.005;

function callAgy(promptContent, fallbackObj = {}) {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 15000;

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
            console.warn(`Attempt ${retry + 1} for agy call skipped (${error.message}).`);
        }
    }
    return fallbackObj;
}

// --- 1. THE 1-QUESTION RULE ---
async function generateLeadingQuestion(signal) {
    const prompt = `
        Based on the following top B2B signal, generate exactly ONE deep, counter-intuitive leading question.
        Signal Headline: "${signal.headline}"
        Causal Pillar: "${signal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "leadingQuestion": "Your question here..."
        }
    `;
    const fallback = {
        leadingQuestion: `How will recent shifts in ${signal.causal_pillar || 'Intelligence'} impact executive decision systems over the next 90 days?`
    };
    return callAgy(prompt, fallback);
}

// --- 2. MULTI-PERSON DIALOGUE GENERATION ---
async function generateDialogue(leadingQuestion, signal) {
    const prompt = `
        Generate a multi-person dialogue script for an episode of "Future Desk OS".
        The dialogue should be between two hosts:
        - Host 1 (Analyst): Data-driven, objective, focuses on facts.
        - Host 2 (Challenger): Skeptical, practical, focuses on real-world implications for B2B executives.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${signal.headline}"
        Top Signal Causal Pillar: "${signal.causal_pillar}"

        Respond ONLY with a JSON object in this format:
        {
          "analystIntro": "Analyst's opening statement...",
          "challengerResponse": "Challenger's response...",
          "dialogue": [
            { "speaker": "Analyst", "line": "..." },
            { "speaker": "Challenger", "line": "..." }
          ]
        }
    `;
    const fallback = {
        analystIntro: `Welcome to Future Desk OS. Today we analyze a high-impact ${signal.causal_pillar} signal: "${signal.headline}".`,
        challengerResponse: `What is the immediate operational risk and capex requirement for B2B leaders?`,
        dialogue: [
            { speaker: "Analyst", line: `The signal highlights accelerated shift in ${signal.causal_pillar}.` },
            { speaker: "Challenger", line: "Execs need to adapt their decision frameworks before the quarter ends." }
        ]
    };
    return callAgy(prompt, fallback);
}

// --- MAIN FUNCTION ---
async function main() {
    console.log('✍️ Starting Editorial Engine...');

    let scoredSignals;
    try {
        const rawScored = await fs.readFile(SCORED_SIGNALS_PATH, 'utf-8');
        scoredSignals = JSON.parse(rawScored);
    } catch (e) {
        console.warn(`Could not read ${SCORED_SIGNALS_PATH}, using default signal.`);
        scoredSignals = [{
            id: 'sig_top_default_01',
            headline: 'Enterprise AI Infrastructure Investment Reaches Record High',
            causal_pillar: 'Infrastructure',
            total_editorial_score: 22,
            status: 'approved'
        }];
    }

    const approvedSignals = scoredSignals.filter(s => s.status === 'approved');
    approvedSignals.sort((a, b) => (b.total_editorial_score || 0) - (a.total_editorial_score || 0));

    if (approvedSignals.length === 0) {
        console.log('No approved signals found. Exiting Editorial Engine.');
        return;
    }

    const topSignal = approvedSignals[0];
    console.log(`Top Signal selected: "${topSignal.headline}" (Score: ${topSignal.total_editorial_score})`);

    let totalLlmCost = 0;

    console.log('Generating 1-Question Rule...');
    const questionResult = await generateLeadingQuestion(topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating Multi-Person Dialogue...');
    const dialogueResult = await generateDialogue(questionResult.leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    const fullScriptData = {
        topSignal,
        leadingQuestion: questionResult.leadingQuestion,
        script: dialogueResult,
        metadata: {
            generationTimestamp: new Date().toISOString(),
            netProcessingCostEur: totalLlmCost,
            topSignalId: topSignal.id
        }
    };

    await fs.writeFile(SCRIPT_JSON_PATH, JSON.stringify(fullScriptData, null, 2));
    console.log(`Saved script JSON to ${SCRIPT_JSON_PATH}`);

    let markdownContent = `# Episode Script: ${topSignal.headline}\n\n`;
    markdownContent += `**Leading Question:** ${questionResult.leadingQuestion}\n\n`;
    markdownContent += `**Analyst Intro:** ${dialogueResult.analystIntro}\n\n`;
    markdownContent += `**Challenger Response:** ${dialogueResult.challengerResponse}\n\n`;
    markdownContent += `### Dialogue:\n`;
    dialogueResult.dialogue.forEach(line => {
        markdownContent += `**${line.speaker}:** ${line.line}\n\n`;
    });

    await fs.writeFile(SCRIPT_MD_PATH, markdownContent);
    console.log(`Saved script Markdown to ${SCRIPT_MD_PATH}`);

    console.log('✅ Editorial Engine completed successfully.');
}

main().catch(error => {
    console.error('An unexpected error occurred in Editorial Engine:', error);
});