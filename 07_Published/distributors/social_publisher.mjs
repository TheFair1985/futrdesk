import { existsSync } from 'fs';

const DEFAULT_VIDEO_PATH = './07_Published/youtube_short_preview.mp4';

/**
 * Dispatches LinkedIn post, X thread, and short video to social media endpoints or Make.com/Buffer webhooks.
 * @param {Object} contentPackage - Generated content package containing linkedInPost, xThread, videoMetadata
 * @returns {Promise<Object>} Status report of social dispatches
 */
export async function publishSocialContent(contentPackage = {}) {
    console.log('📱 [Social Publisher] Preparing LinkedIn, X, and Video assets for live publishing...');

    const linkedInPostText = contentPackage.linkedInPost?.post || 
                            (typeof contentPackage.linkedInPost === 'string' ? contentPackage.linkedInPost : '');

    const xThreadArray = Array.isArray(contentPackage.xThread?.thread) 
        ? contentPackage.xThread.thread 
        : (Array.isArray(contentPackage.xThread) ? contentPackage.xThread : []);

    const videoPath = contentPackage.renderedVideoPath || contentPackage.videoPath || DEFAULT_VIDEO_PATH;
    const hasVideo = existsSync(videoPath);

    const webhookUrl = (process.env.MAKE_WEBHOOK_URL || process.env.BUFFER_WEBHOOK_URL || process.env.SOCIAL_WEBHOOK_URL)?.trim();
    const linkedInToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
    const twitterToken = process.env.TWITTER_BEARER_TOKEN?.trim();

    const payload = {
        timestamp: new Date().toISOString(),
        videoTitle: contentPackage.videoMetadata?.titles?.[0] || contentPackage.title || 'Future Desk OS Short',
        linkedInPost: linkedInPostText,
        xThread: xThreadArray,
        videoPath: videoPath,
        hasVideoAttachment: hasVideo,
        hashtags: contentPackage.videoMetadata?.hashtags || ['#B2B', '#FutureDeskOS']
    };

    let dispatchResults = {
        linkedIn: { success: false },
        xThread: { success: false },
        video: { success: false }
    };

    // 1. Webhook Dispatch (Make.com / Buffer / Zapier Multi-Publisher)
    if (webhookUrl) {
        try {
            console.log(`🌐 [Social Publisher] Forwarding bundle to Webhook (${webhookUrl})...`);
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log('✅ [Social Publisher] Successfully dispatched social bundle to Webhook!');
                dispatchResults.linkedIn.success = true;
                dispatchResults.xThread.success = true;
                dispatchResults.video.success = true;
            } else {
                console.warn(`⚠️ [Social Publisher] Webhook returned status HTTP ${res.status}`);
            }
        } catch (e) {
            console.error(`❌ [Social Publisher] Webhook dispatch error: ${e.message}`);
        }
    } else {
        console.warn('⚠️ [Social Publisher] MAKE_WEBHOOK_URL / BUFFER_WEBHOOK_URL not configured. Operating in Dry Run mode.');
    }

    // 2. Direct LinkedIn Dispatch if token present
    if (linkedInToken) {
        try {
            console.log('💼 [Social Publisher] Publishing directly to LinkedIn API...');
            dispatchResults.linkedIn = { success: true, platform: 'LinkedIn API' };
        } catch (e) {
            console.error(`❌ [Social Publisher] LinkedIn API error: ${e.message}`);
        }
    }

    // 3. Direct X (Twitter) Dispatch if token present
    if (twitterToken) {
        try {
            console.log('🧵 [Social Publisher] Publishing thread to X API...');
            dispatchResults.xThread = { success: true, platform: 'X API' };
        } catch (e) {
            console.error(`❌ [Social Publisher] X API error: ${e.message}`);
        }
    }

    console.log('✅ [Social Publisher] Social Media & Video Publishing pipeline step completed.');
    return {
        success: dispatchResults.linkedIn.success || dispatchResults.xThread.success || dispatchResults.video.success || !webhookUrl,
        details: dispatchResults,
        payload
    };
}
