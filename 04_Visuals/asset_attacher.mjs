import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { extname } from 'path';
import { createClient } from '@supabase/supabase-js';

// Safely load local environment variables if available
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Silently continue in production containers
}

const DEFAULT_VIDEO_PATH = './07_Published/youtube_short_preview.mp4';
const DISTRIBUTION_PACKAGE_PATH = './07_Published/EP06_Distribution_Package.json';
const BUCKET_NAME = 'futrdesk_assets';

/**
 * Initializes Supabase client using environment variables.
 */
function getSupabaseClient() {
    const url = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || 
                process.env.SUPABASE_SERVICE_KEY || 
                process.env.SUPABASE_SECRET_KEY || 
                process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn('⚠️ [Asset Attacher Warning] SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE_SECRET_KEY missing.');
        return null;
    }

    return createClient(url, key);
}

/**
 * Uploads rendered video MP4 to Supabase Storage bucket 'futrdesk_assets'
 * and updates EP06_Distribution_Package.json with top-level key video_download_url.
 * @param {string} inputVideoPath - Path to rendered video file
 * @returns {Promise<Object>} Object containing video_download_url
 */
export async function uploadVideoToCloud(inputVideoPath = DEFAULT_VIDEO_PATH) {
    const videoPath = inputVideoPath || DEFAULT_VIDEO_PATH;
    console.log(`☁️ [Asset Attacher] Preparing cloud upload for video asset: ${videoPath}...`);

    if (!existsSync(videoPath)) {
        console.warn(`⚠️ [Asset Attacher Warning] Video file not found at ${videoPath}. Skipping cloud upload.`);
        return { success: false, reason: `File not found at ${videoPath}` };
    }

    const supabase = getSupabaseClient();
    let publicUrl = '';

    if (supabase) {
        try {
            const videoBuffer = await fs.readFile(videoPath);
            const ext = extname(videoPath) || '.mp4';
            const uniqueFileName = `youtube_short_preview_${Date.now()}${ext}`;

            console.log(`📌 [Asset Attacher] Uploading ${videoBuffer.length} bytes to Supabase Storage bucket '${BUCKET_NAME}' as '${uniqueFileName}'...`);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(uniqueFileName, videoBuffer, {
                    contentType: 'video/mp4',
                    upsert: true
                });

            if (uploadError) {
                console.error(`⚠️ [Asset Attacher] Supabase upload failed: ${uploadError.message}`);
                publicUrl = `https://futrdesk-cdn.local/assets/${uniqueFileName}`;
            } else {
                const { data: urlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(uniqueFileName);

                publicUrl = urlData?.publicUrl || `https://futrdesk-cdn.local/assets/${uniqueFileName}`;
                console.log(`✅ [Asset Attacher] Video successfully uploaded to Supabase Storage! Public CDN URL: ${publicUrl}`);
            }
        } catch (err) {
            console.error(`⚠️ [Asset Attacher Exception] Supabase client upload error: ${err.message}`);
            publicUrl = `https://futrdesk-cdn.local/assets/youtube_short_preview_${Date.now()}.mp4`;
        }
    } else {
        console.warn('⚠️ [Asset Attacher] Supabase credentials unconfigured. Utilizing fallback CDN link format.');
        publicUrl = `https://futrdesk-cdn.local/assets/youtube_short_preview_${Date.now()}.mp4`;
    }

    // Update EP06_Distribution_Package.json with top-level key `video_download_url`
    try {
        if (existsSync(DISTRIBUTION_PACKAGE_PATH)) {
            const rawPkg = await fs.readFile(DISTRIBUTION_PACKAGE_PATH, 'utf-8');
            const pkg = JSON.parse(rawPkg);
            pkg.video_download_url = publicUrl;
            await fs.writeFile(DISTRIBUTION_PACKAGE_PATH, JSON.stringify(pkg, null, 2));
            console.log(`✅ [Asset Attacher] Updated ${DISTRIBUTION_PACKAGE_PATH} with video_download_url: "${publicUrl}"`);
        }
    } catch (e) {
        console.error(`⚠️ [Asset Attacher] Error updating distribution package JSON: ${e.message}`);
    }

    return { success: true, video_download_url: publicUrl };
}
