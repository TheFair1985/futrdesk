
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

const SCRIPT_JSON_PATH = './03_Scripts/EP03_Top_Signal_Script.json';
const DISTRIBUTION_PACKAGE_JSON_PATH = './07_Published/EP06_Distribution_Package.json';
const DISTRIBUTION_PACKAGE_MD_PATH = './07_Published/EP06_Distribution_Package.md';

const NET_COST_PER_LLM_CALL = 0.005; // Estimated cost per LLM call for content generation

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

// --- 1. YOUTUBE SHORTS / TIKTOK / REELS METADATA ---
async function generateVideoMetadata(leadingQuestion, topSignal) {
    const prompt = `
        Generate metadata for a YouTube Short/TikTok/Reel video based on the following leading question and top signal.
        The target audience is North American B2B Executives.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Return ONLY a valid JSON object with the following structure:
        {
            "titles": ["Title 1 (max 50 chars)", "Title 2 (max 50 chars)", "Title 3 (max 50 chars)"],
            "description": "Algorithm-optimized video description including 3 precise B2B hashtags.",
            "hashtags": ["#SupplyChain", "#EnterpriseAI", "#FirstPrinciples"]
        }
    `;
    return callAgy(prompt);
}

// --- 2. LINKEDIN EXECUTIVE BRIEFING ---
async function generateLinkedInPost(leadingQuestion, topSignal) {
    const prompt = `
        Generate a professional, data-enriched LinkedIn post for North American B2B Executives (CEOs, COOs, CFOs) based on the following leading question and top signal.
        
        Structure:
        - Hard counter-intuitive hook.
        - Short analysis of second-order effects.
        - Clear derivation of the net ROI problem.
        - Open closing question to foster discussion in the comments.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Return ONLY a valid JSON object with the key "post" containing the full LinkedIn post text.
    `;
    return callAgy(prompt);
}

// --- 3. X (TWITTER) THREAD ---
async function generateXThread(leadingQuestion, topSignal) {
    const prompt = `
        Generate a 5-part X (Twitter) thread that quickly and concisely breaks down the causality cascade from technology to operational decision, based on the following leading question and top signal.
        Each tweet should be concise and impactful.

        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Return ONLY a valid JSON object with the key "thread" containing an array of 5 tweet strings.
    `;
    return callAgy(prompt);
}

// --- 4. NEWSLETTER LEAD SECTION ---
async function generateNewsletterLead(leadingQuestion, topSignal) {
    const prompt = `
        Generate an editorially crafted article component (approx. 250 words) for a weekly B2B email newsletter ("The Future Desk Brief").
        Focus: Why this trend will change companies' operational net margins in the next quarter.
        
        Leading Question: "${leadingQuestion}"
        Top Signal Headline: "${topSignal.headline}"
        Top Signal Causal Pillar: "${topSignal.causal_pillar}"

        Return ONLY a valid JSON object with the key "article" containing the full article text.
    `;
    return callAgy(prompt);
}

// --- MAIN EXECUTION ---
async function main() {
    console.log('Starting Distribution Engine...');
    
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

    const leadingQuestion = scriptJson.metadata.leadingQuestion;
    const topSignal = {
        headline: scriptJson.metadata.topSignalHeadline,
        causal_pillar: scriptJson.metadata.topSignalPillar
    };

    let totalLlmCost = 0;
    const distributionPackage = {};

    // Generate YouTube/TikTok/Reels Metadata
    console.log('Generating video metadata...');
    distributionPackage.videoMetadata = await generateVideoMetadata(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    // Generate LinkedIn Post
    console.log('Generating LinkedIn post...');
    distributionPackage.linkedInPost = await generateLinkedInPost(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    // Generate X (Twitter) Thread
    console.log('Generating X (Twitter) thread...');
    distributionPackage.xThread = await generateXThread(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    // Generate Newsletter Lead Section
    console.log('Generating Newsletter lead section...');
    distributionPackage.newsletterLead = await generateNewsletterLead(leadingQuestion, topSignal);
    totalLlmCost += NET_COST_PER_LLM_CALL;

    // Add metadata to the package
    distributionPackage.metadata = {
        generationTimestamp: new Date().toISOString(),
        netProcessingCostEur: totalLlmCost,
        sourceScriptId: scriptJson.metadata.topSignalId
    };

    // Save JSON version
    await fs.writeFile(DISTRIBUTION_PACKAGE_JSON_PATH, JSON.stringify(distributionPackage, null, 2));
    console.log(`Saved distribution package JSON to ${DISTRIBUTION_PACKAGE_JSON_PATH}`);

    // Save Markdown version
    let markdownContent = `# EP06 Distribution Package\n\n`;
    markdownContent += `## Leading Question:\n${leadingQuestion}\n\n`;
    markdownContent += `## Top Signal:\n"${topSignal.headline}" (Pillar: ${topSignal.causal_pillar})\n\n`;

    markdownContent += `### YouTube Shorts / TikTok / Reels Metadata\n`;
    markdownContent += `**Titles:**\n`;
    distributionPackage.videoMetadata.titles.forEach(title => markdownContent += `- ${title}\n`);
    markdownContent += `**Description:**\n${distributionPackage.videoMetadata.description}\n\n`;
    markdownContent += `**Hashtags:** ${distributionPackage.videoMetadata.hashtags.join(', ')}\n\n`;

    markdownContent += `### LinkedIn Executive Briefing\n`;
    markdownContent += `${distributionPackage.linkedInPost.post}\n\n`;

    markdownContent += `### X (Twitter) Thread\n`;
    distributionPackage.xThread.thread.forEach((tweet, index) => markdownContent += `${index + 1}. ${tweet}\n`);
    markdownContent += '\n';

    markdownContent += `### Newsletter Lead Section\n`;
    markdownContent += `${distributionPackage.newsletterLead.article}\n\n`;

    await fs.writeFile(DISTRIBUTION_PACKAGE_MD_PATH, markdownContent);
    console.log(`Saved distribution package Markdown to ${DISTRIBUTION_PACKAGE_MD_PATH}`);

    // --- ABSCHLUSS-REPORT ---
    console.log('\n--- PUBLISHING DASHBOARD ---');
    console.log('1. Strongest LinkedIn Executive Hook Preview:');
    console.log(`  "${distributionPackage.linkedInPost.post.split('\n')[0]}"`); // First line of the post
    console.log('\n2. SEO Titles for Hero Video:');
    distributionPackage.videoMetadata.titles.forEach(title => console.log(`  - "${title}"`));
    console.log('\n3. Confirmed Saved Multiplier Files:');
    console.log(`  - ${DISTRIBUTION_PACKAGE_JSON_PATH}`);
    console.log(`  - ${DISTRIBUTION_PACKAGE_MD_PATH}`);
    console.log('\n4. Net Processing Costs for this 10-fold Content Multiplication:');
    console.log(`  - Estimated LLM cost: €${totalLlmCost.toFixed(4)}`);
    console.log('----------------------------\n');
}

main().catch(error => {
    console.error('An unexpected error occurred in the Distribution Engine:', error);
});