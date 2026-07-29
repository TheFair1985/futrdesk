import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const SCRIPT_MD_PATH = './03_Scripts/EP03_Top_Signal_Script.md';
const NET_COST_PER_LLM_CALL = 0.005; // Estimated cost per LLM call for script generation

// Helper function to call agy with retries and timeout
function callAgy(promptContent) {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000; // 30 seconds timeout for agy command

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        // Escape single quotes within the prompt content, then wrap the whole thing in single quotes
        const escapedPrompt = `'${promptContent.replace(/'/g, "'\\''")}'`;
        const command = `agy -p ${escapedPrompt}`;

        try {
            const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', timeout: TIMEOUT_MS });
            // Attempt to extract JSON from the output, which might contain extra text/markdown
            let jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            
            let parsedOutput;
            try {
                parsedOutput = JSON.parse(jsonString);
            } catch (jsonError) {
                // If direct parse fails, try to clean up common LLM output formats
                jsonString = jsonString.replace(/```json\n?|\n?```/g, '').trim(); // Remove markdown code blocks
                parsedOutput = JSON.parse(jsonString);
            }
            return parsedOutput;
        } catch (error) {
            console.error(`Attempt ${retry + 1} failed for agy call. Error: ${error.message}`);
            if (retry === MAX_RETRIES - 1) {
                throw new Error(`Max retries reached for agy call. Failed to get valid output.`);
            }
        }
    }
}

// --- 1. THE 1-QUESTION RULE ---
async function generateLeadingQuestion(signal) {
    const prompt = `
        Based on the following top B2B signal, generate exactly ONE deep, counter-intuitive leading question.
        The question should be from the perspective of a North American B2B Executive (CEO, COO, Head of Supply Chain) and connect the signal to broader causalities, second-order effects, or financial realities.
        Signal Headline: "${signal.headline}"
        Signal Causal Pillar: "${signal.causal_pillar}"
        Signal Scores: Surprise=${signal.surprise_score}, Scale=${signal.scale_score}, Timeliness=${signal.timeliness_score}, Longevity=${signal.longevity_score}, Actionability=${signal.actionability_score}

        Return ONLY a valid JSON object with the key "question". Do not include any other text or markdown.
    `;
    const response = callAgy(prompt);
    return response.question;
}

// --- 2. THE 2-HOST DYNAMIC SCRIPT ---
async function generateDynamicScript(signal, leadingQuestion) {
    const prompt = `
        Generate a highly dynamic 60-90 second dialogue script between two fixed archetypes for a North American B2B audience.
        The script should be based on the following leading question and signal.
        
        HOST 1 (The Analyst / You): Calm, authoritative, analytical. Explains causalities, second-order effects, and financial realities using hard mental models (First Principles, net margins, capex friction).
        HOST 2 (The Challenger / AI Partner): Represents the skeptical North American B2B audience (CEO/COO). Interrupts sharply, asks tough questions ("Why should a CFO care?", "Where is the net ROI?", "What happens when this breaks in month 6?").

        Include a technical visual instruction (Visual Cue) for our Kling AI / CapCut pipeline for each dialogue block.
        Example Visual Cue: [Visual Cue: 35mm lens, handheld camera push-in on an industrial robotics warehouse, natural lighting, no CGI]

        Leading Question: "${leadingQuestion}"
        Signal Headline: "${signal.headline}"
        Signal Causal Pillar: "${signal.causal_pillar}"
        Signal Scores: Surprise=${signal.surprise_score}, Scale=${signal.scale_score}, Timeliness=${signal.timeliness_score}, Longevity=${signal.longevity_score}, Actionability=${signal.actionability_score}

        Return ONLY a valid JSON object with the following structure:
        {
            "title": "Suggested Title for the Video",
            "script": [
                {"speaker": "HOST 1", "dialogue": "...", "visual_cue": "[...]"},
                {"speaker": "HOST 2", "dialogue": "...", "visual_cue": "[...]"},
                ...
            ]
        }
    `;
    return callAgy(prompt);
}

// --- MAIN EXECUTION ---
async function main() {
    console.log('Starting Editorial Engine...');
    
    let scoredSignals = [];
    try {
        const data = await fs.readFile(SCORED_SIGNALS_PATH, 'utf-8');
        scoredSignals = JSON.parse(data);
    } catch (error) {
        console.error('Error reading scored signals file. Did the gatekeeper run correctly?', error);
        return;
    }

    if (scoredSignals.length === 0) {
        console.log('No approved signals found to generate editorial content.');
        return;
    }

    // Sort by total_editorial_score to get the strongest signal
    scoredSignals.sort((a, b) => b.total_editorial_score - a.total_editorial_score);
    const topSignal = scoredSignals[0];

    let totalLlmCost = 0;

    // Generate Leading Question
    console.log('Generating leading question...');
    const leadingQuestion = await generateLeadingQuestion(topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;
    console.log('Generated Question:', leadingQuestion);

    // Generate Dynamic Script
    console.log('Generating dynamic script...');
    const scriptObject = await generateDynamicScript(topSignal, leadingQuestion);
    totalLlmCost += NET_COST_PER_LLM_CALL;
    console.log('Generated Script (first 4 lines):');
    scriptObject.script.slice(0, 4).forEach(line => console.log(`  ${line.speaker}: ${line.dialogue}`));

    // Prepare script for saving
    const fullScriptObject = {
        metadata: {
            topSignalId: topSignal.id,
            topSignalHeadline: topSignal.headline,
            topSignalPillar: topSignal.causal_pillar,
            topSignalScore: topSignal.total_editorial_score,
            leadingQuestion: leadingQuestion,
            generationTimestamp: new Date().toISOString(),
            netProcessingCostEur: totalLlmCost
        },
        script: scriptObject.script
    };

    // Save JSON version
    await fs.writeFile(SCRIPT_JSON_PATH, JSON.stringify(fullScriptObject, null, 2));
    console.log(`Saved script JSON to ${SCRIPT_JSON_PATH}`);

    // Save Markdown version
    let markdownContent = `# ${scriptObject.title || "Editorial Script"}\n\n`;
    markdownContent += `**Leading Question:** ${leadingQuestion}\n\n`;
    markdownContent += `**Top Signal:** "${topSignal.headline}" (Pillar: ${topSignal.causal_pillar}, Score: ${topSignal.total_editorial_score})\n\n`;
    scriptObject.script.forEach(block => {
        markdownContent += `**${block.speaker}:** ${block.dialogue}\n`;
        if (block.visual_cue) {
            markdownContent += `*${block.visual_cue}*\n`;
        }
        markdownContent += '\n';
    });
    await fs.writeFile(SCRIPT_MD_PATH, markdownContent);
    console.log(`Saved script Markdown to ${SCRIPT_MD_PATH}`);

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- EDITORIAL DASHBOARD ---');
    console.log('1. Generated English "1-Question":');
    console.log(`  "${leadingQuestion}"`);
    console.log('\n2. First 4 Dialogue Lines:');
    scriptObject.script.slice(0, 4).forEach(line => console.log(`  ${line.speaker}: ${line.dialogue}`));
    console.log('\n3. Confirmed Saved Files:');
    console.log(`  - ${SCRIPT_JSON_PATH}`);
    console.log(`  - ${SCRIPT_MD_PATH}`);
    console.log('\n4. Net Processing Costs for this run:');
    console.log(`  - Estimated LLM cost: €${totalLlmCost.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Editorial Engine:', error);
});