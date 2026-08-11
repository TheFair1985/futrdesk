# WhatsApp Meta Setup Guide

Dies ist die idiotensichere Anleitung, um unsere Next.js-Webhook-Bridge mit der Meta WhatsApp Business API zu verbinden.

1. **Öffne dein App Dashboard** auf [developers.facebook.com](https://developers.facebook.com).
2. Wähle deine App (Futrdesk) aus.
3. Scrolle im linken Menü nach unten und klicke auf **"WhatsApp"** > **"Configuration"** (oder **"Webhooks"** unter WhatsApp).
4. Unter der Sektion *Webhook* klicke auf **Edit**.
5. Fülle das Popup-Fenster exakt wie folgt aus:
   - **Callback URL**: `https://<deine-vercel-domain>/api/webhooks/whatsapp`
     *(Wichtig: Nutze exakt diese Route, auf der wir den Next.js-Endpunkt gebaut haben!)*
   - **Verify Token**: Das `WHATSAPP_VERIFY_TOKEN` aus deiner `.env.local` (z.B. `futrdesk_secure_verify_2026`).
6. Klicke auf **Verify and save**. (Next.js wird den GET-Request sofort abfangen und den Token zurückspielen).
7. **Webhook Fields abonnieren**: 
   Klicke nach der Bestätigung auf "Manage" (oder "Webhook fields") und abonniere zwingend:
   - `messages` (Klicke auf "Subscribe")

Dein WhatsApp Business Account leitet nun jede eingehende Nachricht an dein Vercel-Gateway weiter, welches die Payload sicher an Runpod (n8n) durchreicht.
