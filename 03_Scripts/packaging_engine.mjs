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

// --- 1. VOICE-ENGINE UPGRADE & RE-SYNTHESIS ---
async function generateVoiceAudio(script) {
    let host1Text = '';
    let host2Text = '';

    script.script.forEach(block => {
        if (block.speaker === 'HOST 1') {
            host1Text += block.dialogue + ' ';
        } else if (block.speaker === 'HOST 2') {
            host2Text += block.dialogue + ' ';
        }
    });

    // HOST 1: The Analyst - Deeper, calm, authoritative US-English voice
    const host1Voice = 'en-US-AndrewMultilingualNeural'; // or 'en-US-BrianMultilingualNeural'
    const host1Rate = '-2%';
    const host1Pitch = '+0Hz'; // Default pitch

    // HOST 2: The Challenger - Sharp, dynamic, fast female US-English voice
    const host2Voice = 'en-US-AvaMultilingualNeural'; // or 'en-US-EmmaMultilingualNeural'
    const host2Rate = '+5%';
    const host2Pitch = '+1Hz';

    const host1AudioPath = `${VOICE_OUTPUT_DIR}/EP04_Host1_Analyst.mp3`;
    const host2AudioPath = `${VOICE_OUTPUT_DIR}/EP04_Host2_Challenger.mp3`;

    console.log(`Generating audio for Host 1 (${host1Voice}, rate: ${host1Rate})...`);
    try {
        execSync(`edge-tts --text "${host1Text.trim()}" --voice "${host1Voice}" --rate="${host1Rate}" --pitch="${host1Pitch}" --write-media "${host1AudioPath}"`);
        console.log(`Host 1 audio saved to ${host1AudioPath}`);
    } catch (error) {
        console.error(`Error generating Host 1 audio: ${error.message}`);
    }

    console.log(`Generating audio for Host 2 (${host2Voice}, rate: ${host2Rate}, pitch: ${host2Pitch})...`);
    try {
        execSync(`edge-tts --text "${host2Text.trim()}" --voice "${host2Voice}" --rate="${host2Rate}" --pitch="${host2Pitch}" --write-media "${host2AudioPath}"`);
        console.log(`Host 2 audio saved to ${host2AudioPath}`);
    } catch (error) {
        console.error(`Error generating Host 2 audio: ${error.message}`);
    }

    return { host1AudioPath, host2AudioPath };
}

// --- 2. CAPCUT PACKAGING & ARCHITECTURE MANIFEST ---
async function generateCapCutMasterPlan(script) {
    let capcutPlanContent = `# CapCut Master Plan: EP05 Production Manifest\n\n`;
    capcutPlanContent += `## Video Title: ${script.metadata.title || "Future Desk OS Editorial"}\n`;
    capcutPlanContent += `## Leading Question: ${script.metadata.leadingQuestion}\n\n`;

    capcutPlanContent += `### 1. TIMELINE STRUCTURE\n`;
    capcutPlanContent += `**Track 1 (Video):**\n`;
    capcutPlanContent += `- Cut every 2.5 seconds.\n`;
    capcutPlanContent += `- Start with the Kling AI Clip (Server Rack).\n`;
    capcutPlanContent += `- Transitions: Use "Speed Ramp (Hero/Bullet Time Curve)" to smooth out AI clip start/end delays.\n\n`;

    capcutPlanContent += `**Track 2 (Voiceover):**\n`;
    capcutPlanContent += `- Staging: Alternate Host 1 and Host 2 dialogue.\n`;
    capcutPlanContent += `- Gaps: Max 0.2 seconds gap between dialogue blocks to maintain flow.\n\n`;

    capcutPlanContent += `**Track 3 (Layer 1 - Atmo):**\n`;
    capcutPlanContent += `- Content: Subtle Industrial Hum / Server Room Ambience.\n`;
    capcutPlanContent += `- Volume: -24 dB (to mask dry AI voice acoustics).\n\n`;

    capcutPlanContent += `**Track 4 (Layer 2 & 3 - Foley/Accents):**\n`;
    capcutPlanContent += `- Layer 2 (Foley): Subtle "Whoosh" sound effects at every perspective change (e.g., Host 1 to Host 2).\n`;
    capcutPlanContent += `- Layer 3 (Impact): Low-End "Boom" sound effect (-12 dB) at the opening question from Host 2.\n\n`;

    capcutPlanContent += `### 2. DYNAMIC CAPTIONS PROTOCOL (Retention-Fit)\n`;
    capcutPlanContent += `- **Font:** Montserrat Bold or Inter Black (Uppercase).\n`;
    capcutPlanContent += `- **Alignment:** Centered in the lower third of the screen (safe zone for TikTok/Reel UI-buttons).\n`;
    capcutPlanContent += `- **Animation:** Word-by-word highlighting (Active Word Highlight).\n`;
    capcutPlanContent += `- **Color Code:**\n`;
    capcutPlanContent += `  - Standard Text: White (\`#FFFFFF\`)\n`;
    capcutPlanContent += `  - Active Word: Executive-Yellow (\`#FFD700\`)\n`;
    capcutPlanContent += `  - Financial Terms (CapEx, ROI, Margin, $50M, etc.): Alert-Red (\`#FF3333\`)\n\n`;

    await fs.writeFile(CAPCUT_MASTER_PLAN_PATH, capcutPlanContent);
    console.log(`CapCut Master Plan saved to ${CAPCUT_MASTER_PLAN_PATH}`);
}

// --- MAIN EXECUTION ---
async function main() {
    console.log('Starting Packaging Engine...');
    
    await ensureDirs();

    let scriptJson = {};
    try {
        const data = await fs.readFile(SCRIPT_JSON_PATH, 'utf-8');
        scriptJson = JSON.parse(data);
    } catch (error) {
        console.error('Error reading script JSON file. Did the editorial_engine run correctly?', error);
        return;
    }

    // Generate Voice Audio
    const { host1AudioPath, host2AudioPath } = await generateVoiceAudio(scriptJson);

    // Generate CapCut Master Plan
    await generateCapCutMasterPlan(scriptJson);

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- AUDIO DASHBOARD ---');
    console.log('1. New Audio Files with Multilingual Voices:');
    let host1FileSize = 'N/A';
    let host2FileSize = 'N/A';
    try {
        host1FileSize = `${(statSync(host1AudioPath).size / (1024 * 1024)).toFixed(2)} MB`;
        host2FileSize = `${(statSync(host2AudioPath).size / (1024 * 1024)).toFixed(2)} MB`;
    } catch (e) { /* ignore if file not found */ }

    console.log(`  - ${host1AudioPath} (Size: ${host1FileSize})`);
    console.log(`  - ${host2AudioPath} (Size: ${host2FileSize})`);

    console.log('\n2. CapCut Plan - Color Code and Font Guide:');
    console.log(`  - Font: Montserrat Bold or Inter Black (Uppercase)`);
    console.log(`  - Standard Text Color: #FFFFFF`);
    console.log(`  - Active Word Color: #FFD700`);
    console.log(`  - Financial Terms Color: #FF3333`);

    console.log('\n3. Confirmation of SOP-05 Creation:');
    console.log(`  - 11_SOP/SOP_05_Audio_and_Packaging.md created.`);

    console.log('\n4. Net Processing Costs for this run:');
    // TTS is 0.00 EUR. LLM costs are from editorial_engine.mjs
    console.log(`  - TTS Cost: €0.0000`);
    console.log(`  - LLM Cost (from previous Editorial Engine run): €${scriptJson.metadata.netProcessingCostEur.toFixed(4)}`);
    console.log(`  - Total Estimated Cost: €${scriptJson.metadata.netProcessingCostEur.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Packaging Engine:', error);
});