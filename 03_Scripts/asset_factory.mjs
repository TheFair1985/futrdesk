
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { statSync } from 'fs';

const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const VOICE_OUTPUT_DIR = './04_Voice';
const GRAPHICS_OUTPUT_DIR = './06_Graphics';

const CAPCUT_MASTER_PLAN_PATH = `${GRAPHICS_OUTPUT_DIR}/EP05_CapCut_Master_Plan.md`;

// Ensure output directories exist
async function ensureDirs() {
    await fs.mkdir(VOICE_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(GRAPHICS_OUTPUT_DIR, { recursive: true });
}

// Helper function to download files
async function downloadFile(url, path) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(path, Buffer.from(buffer));
}

// Helper function to process text into SSML
function processTextToSsml(text, hostType) {
    let processedText = text;
    let rate, pitch;

    if (hostType === 'HOST 1') {
        // HOST 1: The Analyst - Mirroring Real Voice Gravitas
        // Replace specific punctuation with SSML breaks
        processedText = processedText.replace(/—|--|:/g, '<break time="380ms"/>');
        processedText = processedText.replace(/,/g, '<break time="180ms"/>');
        rate = '-6%';
        pitch = '-4Hz';
    } else if (hostType === 'HOST 2') {
        // HOST 2: The Challenger - Tier-1 VC Analyst Vibe
        // Replace specific punctuation with SSML breaks
        processedText = processedText.replace(/—|--/g, '<break time="150ms"/>');
        rate = '+6%';
        pitch = '+2Hz';
    }

    // Wrap with prosody tags
    return `<speak><prosody rate="${rate}" pitch="${pitch}">${processedText.trim()}</prosody></speak>`;
}

// --- 1. ZERO-COST VOICE SYNTHESIS ---
async function generateVoiceAudio(script) {
    let host1RawText = '';
    let host2RawText = '';

    script.script.forEach(block => {
        if (block.speaker === 'HOST 1') {
            host1RawText += block.dialogue + ' ';
        } else if (block.speaker === 'HOST 2') {
            host2RawText += block.dialogue + ' ';
        }
    });

    // HOST 1: The Analyst - Deeper, calm, authoritative US-English voice
    const host1Voice = 'en-US-BrianMultilingualNeural'; // Fallback 'en-US-AndrewMultilingualNeural'
    const host1Ssml = processTextToSsml(host1RawText, 'HOST 1');

    // HOST 2: The Challenger - Sharp, dynamic, fast female US-English voice
    const host2Voice = 'en-US-AvaMultilingualNeural'; // Fallback 'en-US-EmmaMultilingualNeural'
    const host2Ssml = processTextToSsml(host2RawText, 'HOST 2');

    const host1AudioPath = `${VOICE_OUTPUT_DIR}/EP04_Host1_Analyst.mp3`;
    const host2AudioPath = `${VOICE_OUTPUT_DIR}/EP04_Host2_Challenger.mp3`;

    console.log(`Generating audio for Host 1 (${host1Voice})...`);
    try {
        execSync(`edge-tts --ssml "${host1Ssml.replace(/"/g, '\\"')}" --voice "${host1Voice}" --write-media "${host1AudioPath}"`);
        console.log(`Host 1 audio saved to ${host1AudioPath}`);
    } catch (error) {
        console.error(`Error generating Host 1 audio: ${error.message}`);
    }

    console.log(`Generating audio for Host 2 (${host2Voice})...`);
    try {
        execSync(`edge-tts --ssml "${host2Ssml.replace(/"/g, '\\"')}" --voice "${host2Voice}" --write-media "${host2AudioPath}"`);
        console.log(`Host 2 audio saved to ${host2AudioPath}`);
    } catch (error) {
        console.error(`Error generating Host 2 audio: ${error.message}`);
    }

    return { host1AudioPath, host2AudioPath, host1Voice, host2Voice, host1Ssml, host2Ssml };
}

// --- 3. CAPCUT TIMELINE & SOUND DESIGN PARTITUR ---
async function generateCapCutTimeline(script) {
    let capcutTimelineContent = `# CapCut Timeline & Sound Design Partitur\n\n`;
    capcutTimelineContent += `## Video Title: ${script.metadata.title || "Future Desk OS Editorial"}\n`;
    capcutTimelineContent += `## Leading Question: ${script.metadata.leadingQuestion}\n\n`;
    capcutTimelineContent += `**Cut Interval:** Every 2.5 seconds\n\n`;
    capcutTimelineContent += `### Sound Design Layers:\n`;
    capcutTimelineContent += `- **Layer 1 (Atmo):** Subtle Serverroom/Office Atmo-Rauschen throughout.\n`;
    capcutTimelineContent += `- **Layer 2 (Foley):** Whooshes at every perspective change (e.g., HOST 1 to HOST 2).\n`;
    capcutTimelineContent += `- **Layer 3 (Impact):** Low-End Impact sound effect during hard questions from HOST 2.\n\n`;

    capcutTimelineContent += `### Timeline:\n`;
    let currentTime = 0;
    script.script.forEach((block, index) => {
        capcutTimelineContent += `--- Block ${index + 1} ---\n`;
        capcutTimelineContent += `**Time:** ${currentTime.toFixed(1)}s\n`;
        capcutTimelineContent += `**Speaker:** ${block.speaker}\n`;
        capcutTimelineContent += `**Dialogue:** "${block.dialogue}"\n`;
        if (block.visual_cue) {
            capcutTimelineContent += `**Visual Cue:** ${block.visual_cue}\n`;
        }
        capcutTimelineContent += `**Sound Notes:** `;
        if (block.speaker === 'HOST 2' && block.dialogue.includes('?')) { // Simple heuristic for hard questions
            capcutTimelineContent += `Layer 3 (Low-End Impact) + Layer 2 (Whoosh)\n`;
        } else if (index > 0 && script.script[index - 1].speaker !== block.speaker) {
            capcutTimelineContent += `Layer 2 (Whoosh)\n`;
        } else {
            capcutTimelineContent += `Layer 1 (Atmo)\n`;
        }
        capcutTimelineContent += '\n';
        currentTime += 2.5; // Advance time by 2.5 seconds for next cut
    });
    await fs.writeFile(CAPCUT_TIMELINE_PATH, capcutTimelineContent);
    console.log(`CapCut Timeline saved to ${CAPCUT_TIMELINE_PATH}`);
}

// --- MAIN EXECUTION ---
async function main() {
    console.log('Starting Asset Factory Engine...');
    
    await ensureDirs();

    let scriptJson = {};
    try {
        let data = await fs.readFile(SCRIPT_JSON_PATH, 'utf-8');
        // Robust JSON & Line Sanitizer
        data = data.split('\n')
                   .filter(line => line.trim() !== '' && line.trim() !== ',') // Remove empty lines or lines with only commas
                   .join('\n');
        data = data.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
        data = data.replace(/```json\n?|\n?```/g, '').trim(); // Remove markdown code blocks

        scriptJson = JSON.parse(data);
    } catch (error) {
        console.error('Error reading script JSON file. Did the editorial_engine run correctly?', error);
        console.error('Parsing error details:', error.message);
        return;
    }

    // Generate Voice Audio
    const { host1AudioPath, host2AudioPath } = await generateVoiceAudio(scriptJson);

    // Generate Kling Prompts
    await generateKlingPrompts(scriptJson);

    // Generate CapCut Timeline
    await generateCapCutTimeline(scriptJson);

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- PRODUCTION DASHBOARD ---');
    console.log('1. Generated Audio Files:');
    let host1FileSize = 'N/A';
    let host2FileSize = 'N/A';
    try {
        host1FileSize = `${(statSync(host1AudioPath).size / (1024 * 1024)).toFixed(2)} MB`;
        host2FileSize = `${(statSync(host2AudioPath).size / (1024 * 1024)).toFixed(2)} MB`;
    } catch (e) { /* ignore if file not found */ }

    console.log(`  - ${host1AudioPath} (Size: ${host1FileSize})`);
    console.log(`  - ${host2AudioPath} (Size: ${host2FileSize})`);

    console.log('\n2. First Kling AI Prompt Preview:');
    try {
        const klingPromptsContent = await fs.readFile(KLING_PROMPTS_PATH, 'utf-8');
        // More robust regex to capture the content of the first "Prompt:" line
        const firstPromptMatch = klingPromptsContent.match(/(?:^|\n)\*\*Prompt:\*\* "([\s\S]*?)"/m);
        if (firstPromptMatch && firstPromptMatch[1]) {
            console.log(`  "${firstPromptMatch[1].trim()}"`);
        } else {
            console.log('  (No prompts found or unable to extract first prompt)');
        }
    } catch (e) {
        console.log('  (Error reading Kling Prompts file)');
    }

    console.log('\n3. Net Processing Costs for this Asset Production:');
    // TTS is 0.00 EUR. LLM costs are from editorial_engine.mjs
    console.log(`  - TTS Cost: €0.0000`);
    console.log(`  - LLM Cost (from previous Editorial Engine run): €${scriptJson.metadata.netProcessingCostEur.toFixed(4)}`);
    console.log(`  - Total Estimated Cost: €${scriptJson.metadata.netProcessingCostEur.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Asset Factory Engine:', error);
});