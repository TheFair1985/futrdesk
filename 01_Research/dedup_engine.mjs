import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { dirname } from 'path';

const HASH_REGISTRY_PATH = './05_Database/signal_hash_registry.json';

/**
 * Computes a SHA-256 hash from a signal's headline and source_url/url.
 * @param {Object} signal - Signal object containing headline and source_url or url
 * @returns {string} SHA-256 hash hex string
 */
export function generateSignalHash(signal) {
    const headline = (signal.headline || '').trim().toLowerCase();
    const url = (signal.source_url || signal.url || '').trim().toLowerCase();
    const concatenated = `${headline}||${url}`;
    return createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Filters out duplicate signals using persistent SHA-256 hash registry.
 * Appends new unique signal hashes to 05_Database/signal_hash_registry.json.
 * @param {Array} signalsArray - Array of raw/structured signal objects
 * @returns {Promise<Array>} Deduplicated array of signals
 */
export async function filterDuplicateSignals(signalsArray = []) {
    if (!Array.isArray(signalsArray) || signalsArray.length === 0) {
        return [];
    }

    console.log(`🔍 [Dedup Engine] Filtering ${signalsArray.length} incoming signals for duplicates...`);

    let registry = {};
    try {
        const rawRegistry = await fs.readFile(HASH_REGISTRY_PATH, 'utf-8');
        registry = JSON.parse(rawRegistry);
    } catch (e) {
        console.log(`ℹ️ [Dedup Engine] Hash registry not found at ${HASH_REGISTRY_PATH}, initializing new registry.`);
        registry = {};
    }

    const uniqueSignals = [];
    let duplicateCount = 0;
    const nowIso = new Date().toISOString();

    for (const signal of signalsArray) {
        const hash = generateSignalHash(signal);
        if (registry[hash]) {
            duplicateCount++;
        } else {
            registry[hash] = {
                added_at: nowIso,
                headline: signal.headline || '',
                source_url: signal.source_url || signal.url || ''
            };
            uniqueSignals.push(signal);
        }
    }

    if (uniqueSignals.length > 0) {
        try {
            await fs.mkdir(dirname(HASH_REGISTRY_PATH), { recursive: true });
            await fs.writeFile(HASH_REGISTRY_PATH, JSON.stringify(registry, null, 2));
            console.log(`✅ [Dedup Engine] Filtered out ${duplicateCount} duplicate(s). Added ${uniqueSignals.length} new hash(es) to registry.`);
        } catch (err) {
            console.error(`⚠️ [Dedup Engine] Error writing hash registry: ${err.message}`);
        }
    } else {
        console.log(`ℹ️ [Dedup Engine] All ${signalsArray.length} incoming signals were duplicates. 0 new signals.`);
    }

    return uniqueSignals;
}
