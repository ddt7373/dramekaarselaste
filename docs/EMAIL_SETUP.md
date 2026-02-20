# E-pos Kennisgewings Opstelling (Resend)

Die app gebruik **Resend** (via Supabase Edge Functions) om e-pos kennisgewings te stuur.

## DNS Instellings (Axxess / Hosting)

U het die volgende DNS rekords nodig (wat u reeds bygevoeg het):

- **MX:** `send.dramekaarselaste.co.za` -> `feedback-smtp.us-east-1.amazonses.com`
- **TXT:** `resend._domainkey.dramekaarselaste.co.za` (DKIM)
- **TXT:** `dramekaarselaste.co.za` (SPF sluit `amazonses.com` in)

## Stap 1: Supabase Edge Function Secrets

Om e-posse te laat werk, moet die `RESEND_API_KEY` in Supabase gestel word.

1. Gaan na jou Supabase Dashboard
2. Klik **Edge Functions** → **Secrets**
3. Voeg die volgende by:
   - `RESEND_API_KEY` = `<jou resend api key>`
   - `EMAIL_FROM` = `Dra Mekaar <gereedskap@dramekaarselaste.co.za>` (of u geverifieerde sender e-pos)

*(Die ou SMTP instellings soos `SMTP_HOST` word nie meer gebruik nie)*

## Stap 2: Deploy Funksies

Indien u veranderinge maak aan die funksies:

```bash
supabase functions deploy send-email
supabase functions deploy send-push-notification
```

## Hoe om te Toets

1. **Maak seker u profiel het e-pos kennisgewings aan:**
   - Gaan na `Profiel` -> `Kennisgewing Voorkeure`
   - Skakel "E-pos kennisgewings" AAN.

2. **Stuur 'n toets kennisgewing:**
   - Gaan na die **Admin Dashboard** -> **Kennisgewings**
   - Kies "Administrateurs" as die gehoor (sodat dit net na u kom)
   - Tik 'n titel en boodskap en klik "Stuur"
   - U behoort 'n e-pos te ontvang. If successful, you will see a success toaster message saying how many emails were sent.

**Nota:** As u 'n foutboodskap kry, gaan na Supabase -> Edge Functions -> Logs om te sien wat die probleem is (dikwels API key of sender domein verification kwessies).
