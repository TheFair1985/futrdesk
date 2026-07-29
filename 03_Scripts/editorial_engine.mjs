import { promises as fs } from 'fs';

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const SCRIPT_MD_PATH = './03_Scripts/EP03_Top_Signal_Script.md';
const NET_COST_PER_LLM_CALL = 0.0005;

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
                    { role: 'system', content: 'You are an AI editorial script writer for Future Desk OS. Respond ONLY with a valid JSON object.' },
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

// --- 1. THE 1-QUESTION RULE ---
async function generateLeadingQuestion(signal) {
    const prompt = `
        Based on the following top B2B signal, generate exactly ONE deep, counter-intuitive leading question.
        Signal Headline: "${signal.headline}"
        Causal Pillar: "${signal.causal_pillar}"

        Respond ONLY with a valid JSON object in this exact format:
        {
          "leadingQuestion": "Your question here..."
        }
    `;
    const fallback = {
        leadingQuestion: `How will recent shifts in ${signal.causal_pillar || 'Intelligence'} impact executive decision systems over the next 90 days?`
    };
    return callGroq(prompt, fallback);
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

        Respond ONLY with a valid JSON object in this exact format:
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
    return callGroq(prompt, fallback);
}

// --- MAIN FUNCTION ---
async function main() {
    console.log('✍️ Starting Editorial Engine (Native Groq API)...');

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

    console.log('Generating 1-Question Rule with Groq...');
    const questionResult = await generateLeadingQuestion(topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    console.log('Generating Multi-Person Dialogue with Groq...');
    const dialogueResult = await generateDialogue(questionResult.leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    const fullScriptData = {
        topSignal,
        leadingQuestion: questionResult.leadingQuestion,
        script: dialogueResult,
        metadata: {
            generationTimestamp: new Date().toISOString(),
            netProcessingCostEur: totalLlmCost,
            topSignalId: topSignal.id,
            aiEngine: 'Groq Cloud Llama-3-70b-8192'
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

    console.log('✅ Editorial Engine completed successfully with Groq Cloud.');
}

main().catch(error => {
    console.error('An unexpected error occurred in Editorial Engine:', error);
});