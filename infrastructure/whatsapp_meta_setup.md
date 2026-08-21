# WhatsApp Cloud API Setup (Meta) — für Futrdesk

Stand: August 2026. Diese Anleitung verbindet die Meta WhatsApp Cloud API mit dem
Futrdesk-Webhook (`app/api/webhooks/whatsapp/route.ts`). Dauer: ca. 20–30 Minuten.

## Voraussetzungen

- Facebook-Konto + Zugangs zu [developers.facebook.com](https://developers.facebook.com)
- Firmendaten (für Business Verification)
- Eine Telefonnummer, die **nicht** bereits als normaler WhatsApp/WhatsApp-Business-Account
  aktiv ist (falls doch: erst im WhatsApp-App abmelden, einige Minuten warten)
- Kreditkarte/Zahlungsmethode (Meta verlangt sie zur Aktivierung, es wird nichts abgebucht
  solange im Gratis-Kontingent)

## Schritt 1 — Meta App anlegen

1. [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App**
2. Use Case: **Business messaging → "Connect with customers with WhatsApp"**
3. Business Portfolio auswählen → **Go to Dashboard**
4. Unter **App Settings → Basic** ausfüllen (Pflicht vor Live-Schaltung):
   - Privacy Policy URL (`https://futrdesk.com/datenschutz`)
   - Terms of Service URL (`https://futrdesk.com/agb`)
   - App Icon (1024×1024)

## Schritt 2 — Testnummer (Development)

Im **API Setup**-Panel liegt eine kostenlose Testnummer bereit (max. 5 Empfänger).
Unter **To** deine private Handynummer als Test-Empfänger hinzufügen und eine Testnachricht
senden. So lässt sich der kompletten Pipeline-Flow testen, bevor eine echte Nummer
registriert wird.

Notiere dir von diesem Panel:
- **Phone Number ID**
- **WhatsApp Business Account ID (WABA ID)**

## Schritt 3 — Echte Nummer registrieren (Production)

1. Im API Setup Panel → **Add Phone Number**
2. Nummer im internationalen Format eingeben, Verifikation per SMS oder Anruf
3. Zahlungsmethode hinterlegen (**Add Payment Method**) — Pflicht seit 2024
4. Display Name einreichen (muss zur Marke passen; wird von Meta geprüft)

Nach der Verifikation erscheint die neue **Phone Number ID** im Panel.

## Schritt 4 — Permanenten Access Token erzeugen

Der Token im API-Setup-Panel läuft nach 24 h ab. Für Produktion:

1. [business.facebook.com/settings](https://business.facebook.com/settings) → **System Users**
2. System User anlegen (Rolle: Admin)
3. **Generate new token**:
   - App: Futrdesk
   - Expiration: **Never**
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
4. Token sofort kopieren (wird nur einmal angezeigt!)

→ `.env.local` / Vercel: `WHATSAPP_ACCESS_TOKEN`

## Schritt 5 — Webhook verbinden

1. App Dashboard → **WhatsApp → Configuration → Edit Webhook**
2. Eintragen:
   - **Callback URL**: `https://<deine-domain>/api/webhooks/whatsapp`
   - **Verify Token**: exakt der Wert aus `WHATSAPP_VERIFY_TOKEN`
3. **Verify and save** — die Futrdesk-Route beantwortet Metas `hub.challenge` automatisch
4. **Webhook fields**: `messages` abonnieren (Subscribe)

## Schritt 6 — Signatur-Verifikation aktivieren (Sicherheit)

Unter **App Settings → Basic → App Secret** den Secret kopieren →

```
WHATSAPP_APP_SECRET=<app-secret>
```

> Hinweis: Die Prüfung von `X-Hub-Signature-256` ist als To-do in Phase 3 des
> Ship-Plans vorgesehen (aktuell prüft der Webhook noch keine Signaturen).

## Schritt 7 — Environment-Variablen (Vercel + .env.local)

| Variable | Wert |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Permanenter System-User-Token (Schritt 4) |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID der echten Nummer (Schritt 3) |
| `WHATSAPP_VERIFY_TOKEN` | Selbst gewählter String (Schritt 5) |
| `WHATSAPP_APP_SECRET` | App Secret (Schritt 6) |

Danach Redeploy, damit die Variablen greifen.

## Schritt 8 — End-to-End-Test

1. Mit privater Nummer an die Futrdesk-Nummer schreiben: `START <magic_code>`
   (Magic Code aus Dashboard → Channels)
2. Foto/PDF einer Rechnung senden
3. Erwartung: Bestätigungsnachricht → ZUGFeRD-PDF als Antwort
4. In Supabase Tabelle `invoices`: neuer Eintrag mit Status `completed`/`needs_fix`

## Troubleshooting

| Fehler | Ursache / Fix |
|---|---|
| Webhook-Verifikation schlägt fehl | Verify-Token stimmt nicht überein; HTTPS nötig; falsche URL |
| `Recipient not allowed` | Empfänger fehlt in Test-Empfängern (Dev-Nummer) |
| `Invalid OAuth token` | 24h-Token benutzt statt System-User-Token |
| Keine Nachrichten am Webhook | Field `messages` nicht abonniert |
| Nummer lässt sich nicht registrieren | Noch in normalem WhatsApp aktiv → dort Account löschen |

## Business Verification

Für Produktionsbetrieb (>250 Nachrichten/Tag, unbegrenzte Empfänger) verlangt Meta die
**Business Verification** (Business Portfolio → Security Center). Handelsregister-/Gewerbe-
Nachweise bereithalten; Prüfung dauert i. d. R. wenige Tage.
