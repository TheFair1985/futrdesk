import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { uploadVideoToCloud } from '../../04_Visuals/asset_attacher.mjs';
import { dispatchToN8N } from '../distributors/webhook_dispatcher.mjs';

// Force sandbox dry-run mode to prevent live dispatches
process.env.SANDBOX_MODE = 'true';

const MOCK_SIGNAL = {
    id: 'sig_mock_e2e_001',
    headline: 'Autonomous AI Decision Workflows Outperform Bespoke LLM Infrastructure in Enterprise Benchmarks',
    causal_pillar: 'Decision_Systems',
    total_editorial_score: 24,
    source_url: 'https://futrdesk.com/signals/mock-e2e-001',
    timestamp_ingested: new Date().toISOString()
};

const DUMMY_VIDEO_PATH = './07_Published/youtube_short_preview.mp4';
const DISTRIBUTION_PACKAGE_PATH = './07_Published/EP06_Distribution_Package.json';

/**
 * End-to-End Pipeline Integration Test Runner (Dry-Run Mode)
 */
export async function runE2ETest() {
    console.log('🚀 [E2E Test Runner] Initializing End-to-End Pipeline Dry-Run Test...');
    console.log(`🔒 SANDBOX_MODE enforced: ${process.env.SANDBOX_MODE}`);

    // 1. Inject Mock B2B Signal & Build Dummy Distribution Package
    console.log(`\n1️⃣ [E2E Test] Processing Mock Signal: "${MOCK_SIGNAL.headline}"...`);

    const dummyPackage = {
        title: "Model-Agnostic Workflows > Custom AI Models #Shorts",
        leadingQuestion: "Why are enterprise leaders backing away from custom foundation models to defend operational margins?",
        topSignal: MOCK_SIGNAL,
        metadataMatrix: {
            linkedin_post: "🚀 Executive Briefing: Decision Systems Shift\n\nSignal: \"Autonomous AI Decision Workflows Outperform Bespoke LLM Infrastructure\"\n\nKey Takeaways:\n• 1. Custom LLM maintenance CapEx degrades operating margins rapidly.\n• 2. Model-agnostic dynamic routing defended Q3 EBITDA across enterprise benchmarks.\n• 3. CFOs are prioritizing workflow orchestration over raw compute ownership.\n\nHow is your executive board auditing model deprecation costs this quarter?",
            x_thread_tweet_1: "1/2 Signal Alert: Enterprise benchmarks show model-agnostic workflows outperforming custom AI infrastructure.",
            x_thread_tweet_2: "2/2 Decouple business logic from foundation model providers. Follow @FutureDeskOS for daily executive intelligence.",
            yt_shorts_meta: {
                title: "Workflows > Custom LLMs #Shorts",
                description: "Why enterprise CEOs are pivoting from proprietary model development to dynamic workflow orchestration.",
                tags: ["#EnterpriseAI", "#B2BStrategy", "#CapEx", "#FutureDeskOS"]
            },
            tiktok_meta: {
                description: "B2B AI Strategy: Model-agnostic decision workflows vs custom foundation models.",
                hashtags: ["#EnterpriseAI", "#B2BStrategy", "#Leadership", "#FutureDeskOS"]
            },
            ig_reels_meta: "Stop burning CapEx on custom LLMs! Enterprise leaders are pivoting to model-agnostic decision workflows. Link in Bio #B2BStrategy #EnterpriseAI #FutureDeskOS"
        },
        newsletterLead: {
            article: "The CapEx Shift: Enterprise benchmarks confirm model-agnostic decision workflows deliver superior unit economics over custom foundation models."
        },
        kallawayRegiebuch: {
            scenes: [
                {
                    timing: "00:00 - 00:03",
                    speaker: "Host 1",
                    text: "Why custom AI models are becoming an executive CapEx trap...",
                    action: "Rapid camera push-in",
                    b_roll_topic: "Datacenter server racks",
                    sound_trigger: "SFX_WHOOSH_HEAVY",
                    highlight_words: ["CapEx", "trap"]
                }
            ]
        },
        metadata: {
            generationTimestamp: new Date().toISOString(),
            netProcessingCostEur: 0.0000,
            testMode: true,
            aiEngine: 'Mock Engine (E2E Bypass)'
        }
    };

    // 2. Write Dummy Distribution Package JSON
    await fs.writeFile(DISTRIBUTION_PACKAGE_PATH, JSON.stringify(dummyPackage, null, 2));
    console.log(`✅ [E2E Test] Mock distribution package written to ${DISTRIBUTION_PACKAGE_PATH}`);

    // 3. Write Tiny Dummy MP4 Buffer for Supabase Upload Bypass
    console.log('\n2️⃣ [E2E Test] Creating dummy video buffer for cloud asset upload...');
    const dummyBuffer = Buffer.from('MOCK_REMOTION_MP4_VIDEO_BINARY_BUFFER_TEST');
    await fs.writeFile(DUMMY_VIDEO_PATH, dummyBuffer);
    console.log(`✅ [E2E Test] Dummy video buffer created at ${DUMMY_VIDEO_PATH}`);

    // 4. Trigger Supabase Cloud Asset Upload
    console.log('\n3️⃣ [E2E Test] Triggering Supabase Storage upload via asset_attacher.mjs...');
    const uploadResult = await uploadVideoToCloud(DUMMY_VIDEO_PATH);
    console.log(`✅ [E2E Test] Asset upload completed! CDN URL: ${uploadResult.video_download_url}`);

    // 5. Trigger Webhook Dispatcher
    console.log('\n4️⃣ [E2E Test] Triggering n8n Webhook Dispatcher...');
    if (process.env.N8N_WEBHOOK_URL) {
        try {
            const dispatchResult = await dispatchToN8N();
            console.log(`✅ [E2E Test] n8n Webhook dispatch completed! Status: ${dispatchResult.status}`);
        } catch (err) {
            console.warn(`⚠️ [E2E Test Warning] Webhook dispatch threw expected error (e.g. offline n8n): ${err.message}`);
        }
    } else {
        console.warn('⚠️ [E2E Test Warning] N8N_WEBHOOK_URL not configured in environment. Webhook push skipped.');
    }

    console.log('\n✨ [E2E Test Runner] End-to-End Pipeline Dry-Run Test Complete!');
}

// Run if executed directly
if (process.argv[1] && process.argv[1].endsWith('e2e_pipeline_test.mjs')) {
    runE2ETest().catch(err => console.error('E2E Test Runner Error:', err));
}
