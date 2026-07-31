# Future Desk OS: Episodic Execution Plan

This is the exact roadmap to build the "Key-Turn-Machine". Every episode is executed using our robust "Episode Execution Protocol" (Risk Assessment -> Tooling -> Micro-Stepping -> HITL -> Commit).

## Episode 1: The Custom OpusClip Foundation (Dynamic Captions)
**Goal:** Build the FFmpeg + Whisper pipeline to generate Hormozi-style dynamic captions.
*   Setup FFmpeg locally and in Node.js.
*   Route audio through Groq/Whisper for precise word-level timestamps.
*   Generate complex FFmpeg `drawtext` filters to burn dynamic, color-changing captions onto a test video.

## Episode 2: The Avatar Lip-Sync Engine (RunPod)
**Goal:** Erwecke die statischen Avatare zum Leben.
*   Deploy an open-source Avatar model (e.g., SadTalker, MuseTalk) on a RunPod Serverless GPU endpoint.
*   Write the Node.js bridge to send audio + `Host1_Analyst.png` to RunPod and receive a talking video back.

## Episode 3: The Custom Asset & Effect Library
**Goal:** Establish the internal Canva/CapCut repository.
*   Structure the storage logic for transitions, SFX (Layer 1, 2, 3), and visual overlays.
*   Build the compositor script that automatically layers the Avatar video, B-Roll, SFX, and Dynamic Captions together based on the `composition_map.json`.

## Episode 4: The Analytics & Supabase Loop
**Goal:** Close the feedback loop so the machine learns.
*   Build the n8n workflows to scrape YouTube, X, and LinkedIn analytics.
*   Push metrics to Supabase.
*   Update the Editorial Prompts to query Supabase for "winning hooks" before generating new text.

## Episode 5: Automated Distribution & Monetization
**Goal:** The final pipeline connection.
*   Automate the publishing of finished assets via n8n to social platforms.
*   Integrate PartnerStack API to fetch active affiliate links and dynamically insert them into video descriptions and the Sunday Brew newsletter.
