# Futrdesk — Stabilization & Ship-Plan

> Stand: 21.08.2026 · Erstellt nach Voll-Audit des Codesystems.
> Dieses Dokument ist die Arbeitsgrundlage zur Weiterarbeit. Abgehakte Punkte sind erledigt.

## Produkt-Kontext

Futrdesk = "Zero-UI B2B-Middleware": Unternehmen senden Rechnungen per WhatsApp,
Telegram oder E-Mail. KI extrahiert die Daten, das System erzeugt ZUGFeRD-/EN-16931-
konforme E-Rechnungen (PDF/A-3), Freigabe erfolgt im Chat, Export an Steuerberater/Kunde.
Dashboard für Analytics, Archiv, Kanäle, Billing. Zielmarkt: Deutschland
(E-Rechnungspflicht B2B).

Stack: Next.js 16 (App Router, `proxy.ts` statt Middleware!), React 19, Supabase,
Groq (KI-Extraktion), pdf-lib, Plunk (E-Mail), Lemon Squeezy (Billing), Vercel.

---

## Phase 1 — Setup & Hygiene ✅ ERLEDIGT

- [x] Tote Code-Pfade gelöscht: `services/invoicePipeline.ts`, `utils/{groq,pdf,database,plunk,whatsapp,supabase}`,
      `app/api/webhook/` (singular, enthielt hardcoded Secret `'04.07.1985'`),
      `app/api/approve` (kaputter Flow — wird in Phase 3 neu gebaut), `proxy.ts.disabled`,
      alte Ad-hoc-Tests, Scratch-Dateien im Root
- [x] `logo.png` 3,6 MB → 157 KB; Favicon `app/icon.png`
- [x] `.gitignore` (tsconfig.tsbuildinfo, Logs); `.env.example` mit allen Variablen
- [x] Tooling: ESLint 9 Flat Config (`eslint.config.mjs`, umgeht typescript-eslint/TS7-Inkompatibilität),
      Vitest (`vitest.config.ts`), Scripts: `npm run lint | typecheck | test`
- [x] **E-Mail komplett auf Plunk** (Resend entfernt): neuer zentraler Client
      `lib/email/plunk.ts` (aktuelle API: `next-api.useplunk.com`, Attachments korrekt),
      `lib/email/sendMessage.ts` + `lib/export/sendExportEmail.ts` darauf umgebaut
      → kaputter Buchhaltungs-Export-Mailversend funktioniert jetzt wieder
      (vorher: `api.api.resend.com` Typo)
- [x] Env-Konsolidierung: `lib/supabase/admin.ts` als einzige Service-Role-Quelle
      (veraltet alle Namensvarianten ab); `LEMON_SQUEEZY_PRODUCT_PRO_ID`,
      `APP_URL` statt hardcodierter Domains

## Phase 2 — Datenschicht ✅ WEITGEHEND ERLEDIGT

- [x] `supabase/migrations/00008_reconcile_and_harden.sql` — idempotente Konsolidierung
      beider Schema-Generationen: tier int→text, kanonisch `channels.phone_number`,
      voller Status-Enum (`failed|payment_required|archived`), RLS, Storage-Buckets
      inkl. Delete-Policies, atomare RPC `consume_invoice_quota()`, reparierter
      Signup-Trigger `handle_new_user()`
- [x] Alle Call-Sites auf `phone_number` umgestellt (`lib/billing/usage.ts`,
      `lib/ai/processAndDeliverInvoice.ts`)
- [x] Quota-Verbrauch atomar via RPC mit Fallback auf alte Logik
- [x] Cron-Routes repariert: Auth jetzt PFLICHT (CRON_SECRET), Reminder-Fenster
      statt Exact-Day-Bug + einmal-Marker in user_metadata, Monatsfilter im
      Export + Status→`archived` (vorher: komplette Historie jeden Monat erneut)
- [ ] ⚠️ **MANUELL NÖTIG**: Migration in Supabase SQL Editor ausführen, dann
      `npm run update-types` (types/supabase.ts ist veraltet)

## Phase 3 — Pipeline-Fixes 🔜 OFFEN

1. **Webhook-Sicherheit**: Signaturprüfung einbauen —
   WhatsApp `X-Hub-Signature-256` (App Secret nötig), Telegram
   `X-Telegram-Bot-Api-Secret-Token`, Postmark-Signatur, Lemon Squeezy HMAC
   hart failen bei leerem Secret (`app/api/webhooks/*/route.ts`)
2. **Eine Pipeline**: `lib/ai/processAndDeliverInvoice.ts` ist geschrieben, aber
   unerreichbar; alle 3 Webhooks duplicieren ~60 Zeilen inline → konsolidieren
3. **Groq-Modelle**: `llama-3.2-90b-vision-preview` (`lib/ai/extractInvoice.ts:68`)
   und `llava-v1.5-7b-4096-preview` sind eingemottet → aktuelles Vision-Model
4. **ZUGFeRD-Compliance-Entscheidung** ⚠️ offen: TS-Generator
   (`lib/zugferd/generatePdf.ts`) ist eine "PDF/A-3-Simulation" ohne XMP-Metadaten
   → rechtlich riskant. Optionen: (a) XMP in TS ergänzen + Validierung per
   FNFE/Mustangproject in CI, oder (b) Python `factur-x` als Microservice
   (`api/zugferd.py` liegt noch da, ist aber nicht deployt)
5. **Approval-Flow Neudesign**: pro-Rechnung signierter Token, POST statt GET,
   WhatsApp-Button-Replies + Telegram `callback_query` behandeln — ODER
   Product-Decision: Approval ganz streichen zugunsten Auto-Send
6. **Cron registrieren** in `vercel.json` (crons fehlen!):
   `/api/cron/reminders` täglich, `/api/cron/export` monatlich
7. Channel-Kopplung: INSERT-Pfad fehlt (Zeilen müssen aktuell manuell geseedet werden)

## Phase 4 — Dashboard: echte Daten + UX 🔜 OFFEN

- Dashboard/Archiv zeigen 100% Mock-Daten (`DashboardClient.tsx:26-97`,
  `archive/page.tsx`) obwohl Server real lädt → wiren
- Downloads: Signed-URL-API-Route für PDF/XML, ZIP-Export wirklich implementieren
  (aktuell 4× `alert()`-Stubs in `ArchiveClient.tsx`)
- Channels-Seite: echter Magic-Code + QR (aktuell hardcoded Mock)
- Tote Controls: Passwort vergessen, "Abo kündigen", Logo-Upload persistieren
- Toast + Dialog Primitives statt alert()/confirm()
- Mobile: Sidebar-Drawer, Archiv-Inspector als Bottom-Sheet (auf Phone unsichtbar!)
- `error.tsx`, `loading.tsx`, `not-found.tsx`

## Phase 5 — Ship-Checkliste 🔜 OFFEN

- Rechtliches (DE-Pflicht): Impressum, Datenschutz, AGB, Cookie-Consent;
  Map-Attribution reaktivieren; DSGVO-Data-Export echt machen
  (`securityActions.ts:55` ist fake)
- Billing: einzelner LS-Webhook, Variant-ID-Map als Shared Source of Truth
  (Checkout-Links ↔ Webhook divergieren!), Storno-Handling
- Ops: Sentry, Vercel Region `fra1`
- Qualität: Vitest-Smoke-Tests (Pipeline, Quota, Signaturen) + GitHub Actions CI;
  `strict: true` schrittweise aktivieren
- i18n: Deutsch-Sweep (Pricing sagt "Monthly/Yearly", Login "Secure Login" etc.)

---

## Design-Architektur (Planung, nutzt bestehendes Dashboard als Basis)

**Tokens** (tailwind.config erweitern): `core #2d3142`, `action #ef8354`,
`shading #bfc0c0` behalten; Rogue-Orange `#F48F65` (16×!) eliminieren;
Radius-Scale (Card 32px / Control 12px), Type-Scale, Mono-Micro-Label als Utility.

**Primitives extrahieren** (`components/ui/`): Button, Card (7× copy-pasted),
Input, Tabs (framer-motion Pill-Toggle existiert 4×), Dialog, Toast, Accordion (2×),
Progress (5 Varianten!), StatusBadge, EmptyState, Sheet.

**Seiten-Architektur**:
```
Marketing:  /  /impressum  /datenschutz  /agb
Auth:       /login  /reset-password
App-Shell:  /dashboard  /archive  /channels  /settings (+billing mergen?)
```

**Popups**: Rechnungs-Detail (Mobile-Ersatz für Split-View), Limit-reached-Upsell
(Checkout existiert schon), destructive Confirms, Kanal-Kopplungs-QR.

**E-Mail-Design-System**: Ein gebrandetes HTML-Template (Header/Logo, Content-Slot,
Legal-Footer) für 6 transaktionelle Typen: Rechnung zugestellt, Approval-Anfrage,
Export-ZIP, Reminder ×2, Quota-Warnung. Basis: `lib/email/plunk.ts`.

---

## Offene Produkt-Entscheidungen ⚠️

1. **WhatsApp-Kanal**: Setup über Meta Cloud API macht Schwierigkeiten
   (Business Verification, Nummern-Registrierung, Token-Marathon).
   Alternative prüfen und entscheiden. Optionen:
   - Telegram-first launch (funktioniert bereits im Code, kein Meta-Gate)
   - E-Mail-only MVP (Postmark Inbound, funktioniert bereits im Code)
   - BSP-Anbieter statt direkt Meta (z. B. 360dialog, Twilio, Vonage)
2. ZUGFeRD-Generierung: TS-only (a) oder Python-Microservice (b)? → Phase 3.4
3. Approval-Flow behalten oder Auto-Send als Default? → Phase 3.5
4. PartnerStack & Paved: für Zukunft reserviert (Env-Variablen stehen in .env.example)

## Nächste Session — empfohlene Reihenfolge

1. Migration 00008 in Supabare anwenden + Types regenerieren (5 Min, Nutzer)
2. Env-Vars in Vercel setzen: CRON_SECRET, APP_URL, PLUNK_SECRET_API_KEY (+ MAIL_FROM_*)
3. Phase 3: Signaturen (3.1) + Pipeline-Konsolidierung (3.2) + Cron-Registrierung (3.6)
4. Groq-Modell-Swap (3.3) — danach Live-Test mit echter Rechnung
5. Phase 4 parallel möglich (UI-unabhängig von 3.)
