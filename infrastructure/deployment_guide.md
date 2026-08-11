# Futrdesk Deployment Guide

Dieses Dokument enthält die komprimierte Checkliste für den manuellen Go-Live-Prozess des Futrdesk-Systems.

## 1. Vercel Deployment

Das Deployment der Next.js App auf Vercel erfolgt entweder manuell über die CLI oder über die automatische GitHub-Integration.

### Option A: GitHub-Integration (Empfohlen)
1. Repository auf GitHub pushen.
2. Im Vercel-Dashboard "Add New Project" wählen und das GitHub-Repository importieren.
3. Framework Preset auf **Next.js** belassen.

### Option B: Vercel CLI
1. Stelle sicher, dass die Vercel CLI installiert ist (`npm i -g vercel`).
2. Führe den Befehl `vercel` im Root-Verzeichnis (`Futrdesk/`) aus und folge den Anweisungen für den Production-Build (`vercel --prod`).

### ⚠️ WICHTIG: Environment Variables
**Alle** Variablen aus der lokalen `.env.local` Datei müssen zwingend im Vercel-Dashboard unter **Settings -> Environment Variables** als Production-Keys eingetragen werden, bevor das erste Deployment erfolgreich sein kann.

---

## 2. Supabase Production Check

Bevor das Backend einsatzbereit ist, muss die Datenbank in der Supabase-Produktionsumgebung korrekt initialisiert werden.
- Führe das Schema **`00001_init_schema.sql`** im Supabase SQL-Editor aus.
- Führe das Schema **`00002_storage_setup.sql`** im Supabase SQL-Editor aus, um die benötigten Storage-Buckets zu erstellen.

---

## 3. Webhook Activations

Nachdem die App auf Vercel deployt wurde, erhältst du eine Production-Domain (z.B. `https://deine-vercel-domain.vercel.app`).
Die finalen Callback-URLs müssen nun in den jeweiligen Drittanbieter-Diensten hinterlegt werden:

- **Meta (WhatsApp):** 
  Konfiguriere den Webhook im Meta for Developers Dashboard mit der URL:
  `https://<vercel-domain>/api/webhooks/whatsapp`
  
- **Telegram:** 
  Setze den Webhook über die Telegram Bot API (via BotFather oder SetWebhook API) mit der URL:
  `https://api.telegram.org/bot<DEIN_BOT_TOKEN>/setWebhook?url=https://<vercel-domain>/api/webhooks/telegram`

- **Email (Plunk / etc):**
  Falls zutreffend, hinterlege den Webhook für eingehende E-Mails:
  `https://<vercel-domain>/api/webhooks/email`
