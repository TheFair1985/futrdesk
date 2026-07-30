import { promises as fs } from 'fs';
import { join } from 'path';

// Safely load local environment variables if available
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Silently ignore if running in production container or GitHub Actions
}

const REQUIRED_ENV_VARS = [
    'GROQ_API_KEY',
    'NOTION_API_KEY',
    'NOTION_DATABASE_ID',
    'PLUNK_SECRET_API_KEY'
];

const PUBLISHED_DIR = './07_Published';

/**
 * Verifies system health, presence of required environment variables,
 * and filesystem write permissions before starting production run.
 */
export async function runHealthCheck() {
    console.log('🩺 [Health Check] Running pre-flight environment & permission checks...');

    // 1. Verify required environment variables
    const missingVars = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]?.trim());

    if (missingVars.length > 0) {
        throw new Error(`[Health Check Failed] Missing required environment variable(s): ${missingVars.join(', ')}`);
    }
    console.log('✅ [Health Check] Environment variables verified (GROQ, NOTION, PLUNK).');

    // 2. Verify disk write & delete access in 07_Published directory
    const testFilePath = join(PUBLISHED_DIR, `.health_check_${Date.now()}.tmp`);
    try {
        await fs.writeFile(testFilePath, 'HEALTH_CHECK_OK');
        await fs.unlink(testFilePath);
        console.log(`✅ [Health Check] Disk write permission verified in ${PUBLISHED_DIR}`);
    } catch (err) {
        throw new Error(`[Health Check Failed] Disk write permission failure in ${PUBLISHED_DIR}: ${err.message}`);
    }
}
