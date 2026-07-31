import { promises as fs } from 'fs';
import { existsSync } from 'fs';

const SCORED_SIGNALS_PATH = './02_Signals/scored_signals.json';
const RAW_SIGNALS_PATH = './02_Signals/raw_signals.json';
const MEDIA_REGISTRY_PATH = './08_Media/media_registry.json';
const COMPOSITION_MAP_PATH = './08_Media/composition_map.json';

const DEFAULT_VIDEO_FALLBACK = "fallback_abstract_01";
const DEFAULT_AUDIO_FALLBACK = "fallback_audio_01";

/**
 * Extracts a normalized list of keyword tokens from text or signal metadata.
 * @param {Object} signal - Signal object
 * @returns {Array<string>} List of lowercased keyword tokens
 */
function extractKeywords(signal) {
    const tokens = new Set();

    if (signal.causal_pillar) {
        tokens.add(signal.causal_pillar.toLowerCase());
    }

    if (Array.isArray(signal.keywords)) {
        signal.keywords.forEach(k => tokens.add(String(k).toLowerCase()));
    }

    if (Array.isArray(signal.tags)) {
        signal.tags.forEach(t => tokens.add(String(t).toLowerCase()));
    }

    if (signal.headline) {
        signal.headline.toLowerCase().split(/\W+/).forEach(word => {
            if (word.length > 3) tokens.add(word);
        });
    }

    return Array.from(tokens);
}

/**
 * Matches a signal against the media registry entries by tag overlap.
 * @param {Object} signal - Signal object
 * @param {Array<Object>} mediaRegistry - Registered media snippet entries
 * @returns {Object} Selected videoSnippetId and audioSnippetId
 */
export function matchSnippetsForSignal(signal, mediaRegistry = []) {
    const keywords = extractKeywords(signal);

    let bestVideoMatch = null;
    let bestAudioMatch = null;
    let highestVideoScore = 0;
    let highestAudioScore = 0;

    for (const item of mediaRegistry) {
        const itemTags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];
        const overlapScore = itemTags.filter(tag => keywords.some(kw => kw.includes(tag) || tag.includes(kw))).length;

        if (item.type === 'video' || item.category === 'video') {
            if (overlapScore > highestVideoScore) {
                highestVideoScore = overlapScore;
                bestVideoMatch = item.id;
            }
        } else if (item.type === 'audio' || item.category === 'audio') {
            if (overlapScore > highestAudioScore) {
                highestAudioScore = overlapScore;
                bestAudioMatch = item.id;
            }
        } else if (item.tags) {
            if (overlapScore > highestVideoScore) {
                highestVideoScore = overlapScore;
                bestVideoMatch = item.id || item.videoSnippetId;
            }
            if (overlapScore > highestAudioScore) {
                highestAudioScore = overlapScore;
                bestAudioMatch = item.id || item.audioSnippetId;
            }
        }
    }

    return {
        videoSnippetId: bestVideoMatch || DEFAULT_VIDEO_FALLBACK,
        audioSnippetId: bestAudioMatch || DEFAULT_AUDIO_FALLBACK,
        matchedKeywords: keywords.slice(0, 5)
    };
}

/**
 * Reads signals and media registry, compiles composition map, and writes to composition_map.json.
 */
export async function generateCompositionMap() {
    console.log('🎬 [Snippet Matcher] Initializing silent/no-face media composition matcher...');

    let signalsPath = SCORED_SIGNALS_PATH;
    if (!existsSync(signalsPath)) {
        signalsPath = RAW_SIGNALS_PATH;
    }

    let signals = [];
    if (existsSync(signalsPath)) {
        const rawSignalsData = await fs.readFile(signalsPath, 'utf-8');
        signals = JSON.parse(rawSignalsData);
    } else {
        console.warn(`⚠️ [Snippet Matcher] Signals file missing at ${signalsPath}. Using fallback mock signal.`);
        signals = [{
            id: 'mock_signal_01',
            headline: 'Enterprise AI Decision Workflows',
            causal_pillar: 'Decision_Systems'
        }];
    }

    let mediaRegistry = [];
    if (existsSync(MEDIA_REGISTRY_PATH)) {
        try {
            const rawRegistryData = await fs.readFile(MEDIA_REGISTRY_PATH, 'utf-8');
            mediaRegistry = JSON.parse(rawRegistryData);
        } catch (e) {
            console.warn(`⚠️ [Snippet Matcher] Could not parse ${MEDIA_REGISTRY_PATH}, defaulting to empty registry.`);
        }
    }

    console.log(`🔍 [Snippet Matcher] Processing ${signals.length} signals against ${mediaRegistry.length} registered media assets...`);

    const compositionMap = {
        generatedAt: new Date().toISOString(),
        totalSignals: signals.length,
        registryCount: mediaRegistry.length,
        timeline: signals.map(signal => {
            const matchResult = matchSnippetsForSignal(signal, mediaRegistry);
            return {
                signalId: signal.id || signal.headline,
                headline: signal.headline,
                causalPillar: signal.causal_pillar,
                videoSnippetId: matchResult.videoSnippetId,
                audioSnippetId: matchResult.audioSnippetId,
                matchedKeywords: matchResult.matchedKeywords
            };
        })
    };

    await fs.writeFile(COMPOSITION_MAP_PATH, JSON.stringify(compositionMap, null, 2));
    console.log(`✅ [Snippet Matcher] Composition map successfully generated and saved to ${COMPOSITION_MAP_PATH}!`);
    return compositionMap;
}

// CLI direct execution
if (process.argv[1] && process.argv[1].endsWith('snippet_matcher.mjs')) {
    generateCompositionMap().catch(err => {
        console.error('❌ [Snippet Matcher CLI Failure]:', err.message);
        process.exit(1);
    });
}
