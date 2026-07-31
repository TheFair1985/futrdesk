import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

// Safely load environment variables
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Continue in production
}

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const MEDIA_REGISTRY_PATH = './08_Media/media_registry.json';
const VIDEO_SNIPPETS_DIR = './08_Media/video_snippets';

/**
 * Uses Groq API to generate a highly targeted 2-4 word visual Pexels search query per signal.
 * @param {Object} signal - Signal metadata object
 * @returns {Promise<string>} Search query string
 */
async function generateVisualSearchQuery(signal) {
    const apiKey = process.env.GROQ_API_KEY?.replace(/['"]/g, '').trim();
    if (!apiKey) {
        console.warn('⚠️ [Autonomous Fetcher] GROQ_API_KEY missing. Using fallback visual keywords.');
        return `${signal.causal_pillar || 'technology'} dark tech abstract`;
    }

    const prompt = `
        You are a visual creative director for Future Desk OS (Obsidian Dark Mode Tech Briefing).
        Given this B2B macro signal:
        Headline: "${signal.headline}"
        Pillar: "${signal.causal_pillar || 'Tech'}"

        Generate a 2-4 word Pexels stock video search query focused on modern dark tech aesthetics, data centers, AI infrastructure, glowing server racks, cybernetic circuits, or high-tech abstract visuals.
        Respond ONLY with a valid JSON object:
        { "query": "2-4 word search query" }
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
                temperature: 0.6,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API HTTP ${response.status}`);
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return parsed.query || `${signal.causal_pillar} dark tech`;
    } catch (err) {
        console.warn(`⚠️ [Groq Query Error] ${err.message}. Using fallback query.`);
        return `${signal.causal_pillar || 'technology'} dark tech abstract`;
    }
}

/**
 * Searches Pexels API for video stock snippets matching query.
 * @param {string} query - Search query string
 * @returns {Promise<Object|null>} Pexels video object or null
 */
async function fetchPexelsVideo(query) {
    const pexelsKey = process.env.PEXELS_API_KEY?.replace(/['"]/g, '').trim();
    if (!pexelsKey) {
        console.warn('⚠️ [Pexels API] PEXELS_API_KEY is missing.');
        return null;
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.pexels.com/videos/search?query=${encodedQuery}&per_page=5`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': pexelsKey
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Pexels API HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        if (!data.videos || data.videos.length === 0) {
            console.warn(`⚠️ [Pexels API] No videos found for '${query}', retrying fallback search 'technology server'`);
            const fallbackRes = await fetch(`https://api.pexels.com/videos/search?query=technology+server&per_page=5`, {
                headers: { 'Authorization': pexelsKey }
            });
            const fallbackData = await fallbackRes.json();
            if (!fallbackData.videos || fallbackData.videos.length === 0) return null;
            return fallbackData.videos[0];
        }

        return data.videos[0];
    } catch (err) {
        console.error(`❌ [Pexels API Error] Fetch failed: ${err.message}`);
        return null;
    }
}

/**
 * Downloads a video file stream locally to 08_Media/video_snippets/ and registers metadata.
 * @param {Object} videoObj - Pexels video API object
 * @param {Object} signal - Source signal object
 * @param {string} query - Search query string used
 * @returns {Promise<Object|null>} Registry entry metadata object
 */
async function downloadAndRegisterVideo(videoObj, signal, query) {
    if (!videoObj || !videoObj.video_files || videoObj.video_files.length === 0) {
        return null;
    }

    // Select suitable MP4 video file (prefer SD/HD 720p or 1080p, or first mp4)
    const mp4Files = videoObj.video_files.filter(f => f.file_type === 'video/mp4');
    const selectedFile = mp4Files.find(f => f.width >= 720 && f.width <= 1920) || mp4Files[0] || videoObj.video_files[0];

    const videoId = `pexels_vid_${videoObj.id}`;
    const filename = `${videoId}.mp4`;
    const localFilePath = path.join(VIDEO_SNIPPETS_DIR, filename);

    // Download video binary stream
    console.log(`📥 [Autonomous Fetcher] Downloading ${selectedFile.link} -> ${localFilePath}...`);
    const fileRes = await fetch(selectedFile.link);
    if (!fileRes.ok) {
        throw new Error(`Failed to download video binary HTTP ${fileRes.status}`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fsPromises.writeFile(localFilePath, buffer);
    console.log(`✅ [Autonomous Fetcher] Downloaded ${buffer.length} bytes to ${localFilePath}`);

    // Create Registry Entry
    const registryEntry = {
        id: videoId,
        type: 'video',
        category: 'video',
        title: `Pexels Video #${videoObj.id} (${query})`,
        localPath: localFilePath,
        downloadUrl: selectedFile.link,
        source: 'Pexels',
        pexelsId: videoObj.id,
        durationSeconds: videoObj.duration,
        resolution: `${selectedFile.width}x${selectedFile.height}`,
        tags: [
            signal.causal_pillar?.toLowerCase() || 'tech',
            ...query.toLowerCase().split(/\s+/),
            'pexels',
            'dark_mode'
        ].filter(Boolean),
        signalId: signal.id,
        timestampIngested: new Date().toISOString()
    };

    return registryEntry;
}

/**
 * Main Autonomous Asset Fetcher workflow
 */
export async function runAutonomousFetcher() {
    console.log('🚀 [Autonomous Asset Fetcher] Starting AI-driven media acquisition...');

    // 1. Read Signals
    let signalsPath = fs.existsSync(SCORED_SIGNALS_PATH) ? SCORED_SIGNALS_PATH : RAW_SIGNALS_PATH;
    if (!fs.existsSync(signalsPath)) {
        throw new Error(`❌ [Autonomous Fetcher Error] No signals file found at ${signalsPath}`);
    }

    const rawSignals = await fsPromises.readFile(signalsPath, 'utf-8');
    const signals = JSON.parse(rawSignals).slice(0, 4); // Process top 4 signals

    // 2. Read Existing Media Registry
    let mediaRegistry = [];
    if (fs.existsSync(MEDIA_REGISTRY_PATH)) {
        try {
            const rawReg = await fsPromises.readFile(MEDIA_REGISTRY_PATH, 'utf-8');
            mediaRegistry = JSON.parse(rawReg);
        } catch (e) {
            mediaRegistry = [];
        }
    }

    // Ensure VIDEO_SNIPPETS_DIR exists
    await fsPromises.mkdir(VIDEO_SNIPPETS_DIR, { recursive: true });

    let newAssetsCount = 0;

    for (const signal of signals) {
        console.log(`\n🔍 Processing signal: "${signal.headline.substring(0, 50)}..."`);

        // Generate Visual Query via Groq AI
        const searchQuery = await generateVisualSearchQuery(signal);
        console.log(`🤖 [Groq AI Query] Created query: "${searchQuery}"`);

        // Fetch from Pexels
        const videoObj = await fetchPexelsVideo(searchQuery);
        if (videoObj) {
            // Check if already in registry
            const existing = mediaRegistry.find(r => r.pexelsId === videoObj.id);
            if (existing) {
                console.log(`ℹ️ [Autonomous Fetcher] Video #${videoObj.id} already exists in media_registry.json`);
                continue;
            }

            const newEntry = await downloadAndRegisterVideo(videoObj, signal, searchQuery);
            if (newEntry) {
                mediaRegistry.push(newEntry);
                newAssetsCount++;
            }
        }
    }

    // Write updated media registry
    await fsPromises.writeFile(MEDIA_REGISTRY_PATH, JSON.stringify(mediaRegistry, null, 2));
    console.log(`\n🎉 [Autonomous Fetcher] Completed! ${newAssetsCount} new video snippets downloaded and registered in ${MEDIA_REGISTRY_PATH}.`);

    // Re-run snippet_matcher to update composition_map.json!
    try {
        const { generateCompositionMap } = await import('./snippet_matcher.mjs');
        await generateCompositionMap();
    } catch (e) {
        console.warn(`⚠️ Could not trigger snippet matcher update: ${e.message}`);
    }

    return { success: true, newAssetsCount, totalRegistryCount: mediaRegistry.length };
}

// CLI Trigger
if (process.argv[1] && process.argv[1].endsWith('autonomous_fetcher.mjs')) {
    runAutonomousFetcher().catch(err => {
        console.error('❌ [Autonomous Fetcher Failure]:', err.message);
        process.exit(1);
    });
}
