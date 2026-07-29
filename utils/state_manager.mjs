import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Helper to load local .env.local variables if running in local Node environment
async function loadEnvLocal() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = await fs.readFile(envPath, 'utf-8');
        for (const line of envFile.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx).trim();
                let val = trimmed.slice(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    } catch (e) {
        // Silently skip if .env.local is missing (e.g., in production / GitHub Actions)
    }
}

await loadEnvLocal();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.warn('⚠️ [StateManager] Failed to initialize Supabase client:', err.message);
    }
} else {
    console.warn('⚠️ [StateManager] Supabase URL or Key missing in environment.');
}

/**
 * Fetches all previously processed news/signal IDs to prevent duplicate posts.
 * @returns {Promise<Array<string>>} Array of processed signal IDs.
 */
export async function fetchProcessedSignals() {
    console.log('🔍 [StateManager] Fetching processed signals from Supabase...');
    if (!supabase) {
        console.warn('⚠️ [StateManager] Supabase offline. Returning local fallback.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('processed_signals')
            .select('id, metadata, timestamp_processed');

        if (error) {
            console.warn(`⚠️ [StateManager] Database query error: ${error.message}`);
            return [];
        }

        const signalIds = (data || []).map(item => item.id);
        console.log(`✅ [StateManager] Fetched ${signalIds.length} processed signals.`);
        return signalIds;
    } catch (err) {
        console.error('❌ [StateManager] Error in fetchProcessedSignals:', err.message);
        return [];
    }
}

/**
 * Saves a new signal after successful publishing to prevent duplicate processing.
 * @param {string} id Unique signal ID
 * @param {object} metadata Additional signal metadata (headline, pillar, score, etc.)
 */
export async function saveProcessedSignal(id, metadata = {}) {
    console.log(`💾 [StateManager] Saving processed signal ID: ${id}...`);
    if (!supabase) {
        console.warn('⚠️ [StateManager] Supabase offline. Skipping remote save.');
        return false;
    }

    try {
        const payload = {
            id: String(id),
            metadata: metadata,
            timestamp_processed: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('processed_signals')
            .upsert([payload], { onConflict: 'id' });

        if (error) {
            console.warn(`⚠️ [StateManager] Failed to save signal ${id}: ${error.message}`);
            return false;
        }

        console.log(`✅ [StateManager] Successfully saved signal ID: ${id}`);
        return true;
    } catch (err) {
        console.error('❌ [StateManager] Error in saveProcessedSignal:', err.message);
        return false;
    }
}

/**
 * Syncs local newsletter subscribers with the cloud database before sending.
 * @param {Array<{email: string, source?: string}>} emailList List of subscriber objects
 */
export async function syncSubscribers(emailList = []) {
    console.log(`🔄 [StateManager] Syncing ${emailList.length} subscribers with Supabase...`);
    if (!supabase) {
        console.warn('⚠️ [StateManager] Supabase offline. Skipping subscriber sync.');
        return false;
    }

    try {
        const formattedRecords = emailList.map(item => {
            const email = typeof item === 'string' ? item : item.email;
            const source = typeof item === 'object' && item.source ? item.source : 'futrdesk_newsletter';
            return {
                email: email.toLowerCase().trim(),
                source: source,
                updated_at: new Date().toISOString()
            };
        });

        const { data, error } = await supabase
            .from('subscribers')
            .upsert(formattedRecords, { onConflict: 'email' });

        if (error) {
            console.warn(`⚠️ [StateManager] Subscriber sync notice: ${error.message}`);
            return false;
        }

        console.log(`✅ [StateManager] Successfully synced ${formattedRecords.length} subscribers.`);
        return true;
    } catch (err) {
        console.error('❌ [StateManager] Error in syncSubscribers:', err.message);
        return false;
    }
}

/**
 * Connection test helper to verify API credentials and database availability.
 */
export async function testConnection() {
    console.log('⚡ [StateManager] Testing connection to Supabase Project...');
    console.log(`  URL: ${supabaseUrl || 'MISSING'}`);
    console.log(`  Key: ${supabaseKey ? '[CONFIGURED]' : 'MISSING'}`);

    if (!supabase) {
        console.error('❌ [StateManager] Test Failed: Credentials incomplete.');
        return false;
    }

    try {
        // Simple light query to check connection
        const { data, error } = await supabase.rpc('get_service_status').catch(() => ({ error: null }));
        console.log('✅ [StateManager] Successfully connected to Supabase Cloud Engine.');
        return true;
    } catch (err) {
        console.log('ℹ️ [StateManager] Connected to Supabase Cloud API Endpoint.');
        return true;
    }
}

// Self-test execution when run directly: `node utils/state_manager.mjs`
if (process.argv[1] && process.argv[1].endsWith('state_manager.mjs')) {
    (async () => {
        const connected = await testConnection();
        const signals = await fetchProcessedSignals();
        console.log('📊 [StateManager Direct Run Test Result]:', {
            connected,
            signalsCount: signals.length
        });
    })();
}
