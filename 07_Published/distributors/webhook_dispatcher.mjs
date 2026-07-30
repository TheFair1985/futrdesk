import { promises as fs } from 'fs';

const DISTRIBUTION_PACKAGE_PATH = './07_Published/EP06_Distribution_Package.json';

/**
 * Sanitizes metadata text fields to enforce strict platform character limits and link rules.
 * @param {Object} pkg - Distribution package object
 * @returns {Object} Sanitized package object
 */
export function sanitizeMetadataPayload(pkg) {
    const sanitized = JSON.parse(JSON.stringify(pkg)); // Deep clone

    if (sanitized.metadataMatrix) {
        const matrix = sanitized.metadataMatrix;

        // 1. Enforce max 280 chars for tweets
        if (typeof matrix.x_thread_tweet_1 === 'string') {
            matrix.x_thread_tweet_1 = matrix.x_thread_tweet_1.slice(0, 280);
        }
        if (typeof matrix.x_thread_tweet_2 === 'string') {
            matrix.x_thread_tweet_2 = matrix.x_thread_tweet_2.slice(0, 280);
        }

        // 2. Strip http:// and https:// URLs from linkedin_post
        if (typeof matrix.linkedin_post === 'string') {
            matrix.linkedin_post = matrix.linkedin_post.replace(/https?:\/\/\S+/gi, '').trim();
        }
    }

    // Also sanitize top-level/nested fields if present for backwards compatibility
    if (sanitized.linkedInPost && typeof sanitized.linkedInPost.post === 'string') {
        sanitized.linkedInPost.post = sanitized.linkedInPost.post.replace(/https?:\/\/\S+/gi, '').trim();
    }

    if (sanitized.xThread && Array.isArray(sanitized.xThread.thread)) {
        sanitized.xThread.thread = sanitized.xThread.thread.map(tweet => 
            typeof tweet === 'string' ? tweet.slice(0, 280) : tweet
        );
    }

    return sanitized;
}

/**
 * Reads EP06_Distribution_Package.json, applies strict sanitization, and posts payload to N8N_WEBHOOK_URL.
 * Includes a 3-attempt exponential backoff retry mechanism and a 10-second fetch timeout via AbortController.
 */
export async function dispatchToN8N() {
    console.log('🌐 [N8N Dispatcher] Preparing metadata matrix payload for n8n dispatch...');

    const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
        throw new Error('❌ [N8N Dispatcher Critical Error] N8N_WEBHOOK_URL environment variable is missing in the local environment.');
    }

    let rawPackage;
    try {
        rawPackage = await fs.readFile(DISTRIBUTION_PACKAGE_PATH, 'utf-8');
    } catch (err) {
        throw new Error(`❌ [N8N Dispatcher Error] Failed to read ${DISTRIBUTION_PACKAGE_PATH}: ${err.message}`);
    }

    const parsedPackage = JSON.parse(rawPackage);
    const sanitizedPayload = sanitizeMetadataPayload(parsedPackage);

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`📌 [N8N Dispatcher] Attempt ${attempt}/${maxAttempts}: Sending POST to ${webhookUrl}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FutureDeskOS-Dispatcher/1.0'
                },
                body: JSON.stringify(sanitizedPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            console.log(`✅ [N8N Dispatcher] Payload successfully dispatched to n8n webhook on attempt ${attempt}! Status: ${response.status}`);
            return { success: true, status: response.status, attempt };
        } catch (err) {
            clearTimeout(timeoutId);
            const isAbort = err.name === 'AbortError';
            const reason = isAbort ? 'Request timed out after 10 seconds' : err.message;
            lastError = new Error(`Attempt ${attempt} failed: ${reason}`);

            console.warn(`⚠️ [N8N Dispatcher] Attempt ${attempt}/${maxAttempts} failed (${reason})`);

            if (attempt < maxAttempts) {
                const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                console.log(`⏳ Waiting ${backoffMs}ms before next retry...`);
                await new Promise(res => setTimeout(res, backoffMs));
            }
        }
    }

    throw new Error(`❌ [N8N Dispatcher Error] All ${maxAttempts} attempts to dispatch to n8n failed. Last error: ${lastError.message}`);
}
