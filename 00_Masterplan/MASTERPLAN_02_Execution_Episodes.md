# Future Desk: Episodic Execution Plan

This is the exact roadmap to build the "Key-Turn-Machine". Every episode is executed using our robust "Episode Execution Protocol" (Risk Assessment -> Tooling -> Micro-Stepping -> HITL -> Commit).

## Episode 1: The Proprietary Video Engine (Remotion & Whisper)
**Goal:** Build the React-based Remotion pipeline to generate hyper-realistic, dynamic video captions and programmatic animations.
*   Setup Remotion locally and initialize a React-based video project inside `04_Visuals`.
*   Route audio through Groq/Whisper for precise word-level timestamps.
*   Build custom React components (`<AnimatedCaption />`, `<AudioLayer />`) to perfectly sync text and SFX to the Whisper JSON data.

## Episode 2: The Avatar Lip-Sync Engine (RunPod)
**Goal:** Erwecke die statischen Avatare zum Leben (100% human-like).
*   Deploy an open-source Avatar model (e.g., SadTalker, MuseTalk) on a RunPod Serverless GPU endpoint.
*   Write the Node.js bridge to send audio + `Host1_Analyst.png` to RunPod and receive a highly realistic talking video back.

## Episode 3: The Custom Asset & Effect Library
**Goal:** Establish our proprietary internal asset repository.
*   Structure the storage logic for transitions, SFX (Layer 1 Room Tone, Layer 2 Foley, Layer 3 Accents), and visual overlays.
*   Build the Remotion Composition that automatically layers the Avatar video, B-Roll, SFX, and dynamic text together based on the `composition_map.json`.

## Episode 4: The Analytics & Supabase Loop
**Goal:** Close the feedback loop so the machine learns.
*   Build the n8n workflows to scrape YouTube, X, and LinkedIn analytics.
*   Push metrics to Supabase.
*   Update the Editorial Prompts to query Supabase for "winning hooks" before generating new text.

## Episode 5: Automated Distribution & Monetization
**Goal:** The final pipeline connection.
*   Automate the publishing of finished assets via n8n to social platforms.
*   Integrate PartnerStack API to fetch active affiliate links and dynamically insert them into video descriptions and the Sunday Brew newsletter.
