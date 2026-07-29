# SOP 04: Visual Factory

## Purpose
This Standard Operating Procedure (SOP) outlines the process for generating visual assets and production manifests for the Future Desk OS video content. It ensures adherence to our Zero-Budget Protocol and maintains a high standard of visual quality and strategic alignment.

## Core Directives

### 1. Zero-Cost Tooling Protocol
All visual asset generation and manifest creation must strictly adhere to the Zero-Budget Protocol. This means:
-   **AI Image/Video Generation:** Utilize free tiers and available credits exclusively (e.g., Kling AI free tier, Minimax Web free tier).
-   **Video Editing:** Use free versions of software (e.g., CapCut Desktop Free Version).
-   **No Paid Subscriptions:** Avoid any tools or services requiring paid subscriptions beyond our existing CLI Pro-Subscription.

### 2. Image-First Verification for AI Assets
Before animating any visual assets into video, a critical verification step must be performed:
-   **Static Anchor Images:** Generate the visual assets first as static, 100% photorealistic anchor images using Kling AI (or equivalent).
-   **Human Review:** These static images must be meticulously reviewed by a human Co-Founder for:
    *   **Photorealism:** Ensure the image is indistinguishable from a real photograph.
    *   **Accuracy:** Verify that the visual content accurately represents the intended scene or concept from the `[Visual Cue]`.
    *   **Texture & Detail:** Check for authentic industrial/executive textures, natural lighting, and shallow depth of field as per our visual metadata requirements.
    *   **Absence of AI Artifacts:** Crucially, inspect for any "AI tells" or artificial smoothness that would betray its generative origin.
-   **Approval for Animation:** Only upon successful human review and approval of the static anchor images can they proceed to be animated into video sequences. This prevents wasted computational resources and ensures brand integrity.

### 3. Production Manifest Precision
All generated manifests (`EP04_Kling_Prompts.md`, `EP04_CapCut_Timeline.md`) must be:
-   **Highly Precise:** Contain all necessary technical details for direct input into the respective tools.
-   **Immediately Usable:** Require no further manual interpretation or modification by the production team.

## Visual Metadata Requirements
All image-to-video prompts must include the following mandatory visual metadata to ensure a consistent and high-quality aesthetic:
`"Shot on 35mm lens, natural lighting, shallow depth of field, authentic industrial/executive textures, natural motion blur, NO CGI, no artificial smoothness"`

By following this SOP, we ensure that our visual assets are not only cost-effective but also meet the highest standards of quality and strategic communication for the Future Desk OS.
