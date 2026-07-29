# SOP-09: Autonomous Cloud Deployment & Zero-Touch Architecture

**System Name:** Future Desk OS  
**Version:** 1.0.0-cloud  
**Architecture Type:** Serverless Gateway (Vercel) + Autonomous Compute & Orchestration (GitHub Actions)

---

## 1. Architectural Overview

Future Desk OS operates in a zero-touch, human-in-the-loop autonomous loop:

```
[06:00 UTC Cron / GitHub Actions]
         │
         ▼
 1. Morning Dispatch (Job A)
    ├── sensor_engine.mjs (Ingestion)
    └── editorial_engine.mjs (Scoring & Scripting)
         │
         ▼
 [Telegram Preview Message Sent to Co-Founder]
         │
         ▼
 [Co-Founder replies "/approve" in Telegram]
         │
         ▼
 [Vercel Serverless Webhook: /api/webhook.mjs]
         │ (Fires repository_dispatch: telegram_approve)
         ▼
 2. Production Run (Job B on GitHub Actions)
    ├── asset_factory.mjs (Voice & Video Blueprinting)
    ├── distribution_engine.mjs (Social & Newsletter Packaging)
    └── monetization_engine.mjs (Affiliate & Sponsor Linking)
         │
         ▼
 [Telegram Completion Confirmation]
```

---

## 2. Infrastructure Components & Configuration

### Component A: GitHub Actions Heartbeat (`.github/workflows/daily_production.yml`)
- **Job A (`morning_dispatch`):**
  - **Triggers:** Cron schedule `0 6 * * *` (06:00 UTC) or manual `workflow_dispatch`.
  - **Actions:** Ingests raw news/market signals, runs the gatekeeper scoring, generates dual-host scripts, and transmits an editorial preview to the Telegram chat.
- **Job B (`production_run`):**
  - **Trigger:** `repository_dispatch` with event action `telegram_approve`.
  - **Actions:** Generates full media assets, packages multi-channel distribution content, links affiliate monetization streams, and notifies the team.

### Component B: Vercel Telegram Bridge (`api/webhook.mjs` & `vercel.json`)
- Serves as the high-availability serverless API gateway listening for incoming webhooks from Telegram.
- **Security:** Verifies incoming requests against the verified `TELEGRAM_CHAT_ID`.
- **Orchestration:** Translates `/approve` commands into GitHub REST API `repository_dispatch` calls using a secure GitHub Personal Access Token (`GH_PAT`).

---

## 3. Required Environment Variables

### 3.1 Vercel Environment Variables (Gateway Configuration)
To enable Vercel to communicate securely with GitHub and Telegram, the following environment variables must be defined in the **Vercel Project Settings**:

| Variable Name | Description | Example / Required Format |
|---|---|---|
| `GH_PAT` (or `GITHUB_PAT`) | GitHub Personal Access Token (classic with `repo` scope or fine-grained token with `Contents: Read and write` & `Workflows: Read and write` permissions). | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_REPO` | Owner and Repository name for repository dispatch target. | `TheFair1985/futrdesk` |
| `TELEGRAM_BOT_TOKEN` | Token provided by Telegram @BotFather. | `8707626369:AAFRdo...` |
| `TELEGRAM_CHAT_ID` | Verified Chat ID or bot handle allowed to trigger production. | `FutrDesk_Ops_Bot` or numeric chat ID |

### 3.2 GitHub Repository Secrets (Compute Container Environment)
The following secrets must be defined in **GitHub Repo Settings -> Secrets and variables -> Actions**:

- `NEWS_API_KEY`
- `PEXELS_API_KEY`
- `PLUNK_PUBLIC_API_KEY` & `PLUNK_SECRET_API_KEY`
- `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`
- `PAVED_API_KEY`
- `LEMON_SQUEEZY_API_KEY` & `LEMON_SQUEEZY_SHOP_ID`
- `PARTNERSTACK_API_KEY`
- `VERCEL_PROJECT_ID`
- `SUPABASE_PROJECT_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET_KEY`, `SUPABASE_SECRET_KEY`
- `FINANCIAL_MODE`, `MIN_EDITORIAL_SCORE_THRESHOLD`, `MAX_DAILY_NET_COMPUTE_LIMIT_EUR`

---

## 4. Setup & Webhook Registration Instructions

1. **Deploy to Vercel:** Push codebase to GitHub repository `TheFair1985/futrdesk` and connect to Vercel.
2. **Register Telegram Webhook:** Once deployed to Vercel (e.g. `https://futrdesk.vercel.app`), register the webhook endpoint with Telegram:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://<your-vercel-domain>.vercel.app/api/webhook"}'
   ```
3. **Verify Connection:** Send `/status` or `/start` to the Telegram bot.
