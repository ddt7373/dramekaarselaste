# Musiek API Instruksies – Gedig na Musiek

Hierdie gids help jou om jou musiek API-sleutel te kry en aan my te gee sodat die gedig wat gegenereer word in musiek omskep kan word.

---

## Suno API (sunoapi.org) – Aanbeveel

### Stap 1: Registreer / Log in

1. Gaan na **https://sunoapi.org/**
2. Klik op **Sign Up** (Registreer) of **Log In** as jy reeds 'n rekening het
3. Voltooi registrasie (e-pos, wagwoord)

### Stap 2: Kry jou API-sleutel

1. Gaan na **https://sunoapi.org/api-key**
2. Log in as nodig
3. Klik op **Create API Key** of **Generate Key**
4. Kopieer jou API-sleutel (dit lyk soos `sk-xxxxxxxxxxxx` of 'n lang string)
5. **Belangrik:** Stoor dit veilig – jy sal dit net een keer sien

### Stap 3: Gee die sleutel aan my

**Moenie die sleutel hier in die dokument tik nie** – dit kan gesteel word.

**Veilige opsies:**

1. **Supabase Edge Function Secret** (aanbeveel):
   - Gaan na jou Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
   - Voeg 'n nuwe secret by: `SUNO_API_KEY` = jou API-sleutel
   - Die app sal dit outomaties gebruik

2. **Stuur aan my in 'n privaat boodskap** (indien jy vertrou):
   - Tik: "Hier is my Suno API-sleutel: [plak jou sleutel hier]"
   - Ek sal dit in die Supabase secret stoor en nooit in kode hardcode nie

### Stap 4: Verifieer jou krediete

- Gaan na **https://sunoapi.org/** → **Dashboard** of **Credits**
- Maak seker jy het krediete vir musiek-generasie
- Elke liedjie kos ongeveer 1–2 krediete (afhangend van plan)

---

## Ander Musiek API's

As jy 'n **ander** musiek API het (bv. Udio, MusicAPI.ai, Beatoven), stuur my:

1. **API-naam** (bv. "Udio API", "MusicAPI.ai")
2. **API Base URL** (bv. `https://api.example.com`)
3. **Hoe om te authentiseer** (Bearer token? API key in header? Query param?)
4. **Endpoint vir musiek-generasie uit lirieke** (dokumentasie-URL of voorbeeld)
5. **Jou API-sleutel** (veilig, soos hierbo)

---

## Wat sal gebeur na integrasie

1. Leerder voltooi 'n les → kry beloning-skerm
2. Klik **Skep Gedig** → KI skep 'n gedig uit die les
3. Klik **Skep Musiek** → Die gedig word na Suno API gestuur
4. Suno genereer 'n liedjie met die gedig as lirieke
5. Leerder kan die liedjie afspeel en aflaai (stream URL binne 30–40 sek, volledige aflaai binne 2–3 min)

---

## Suno API – Tegniese besonderhede (vir implementering)

- **Base URL:** `https://api.sunoapi.org`
- **Endpoint:** `POST /api/v1/generate`
- **Auth:** `Authorization: Bearer YOUR_API_KEY`
- **Vir gedig → musiek:** 
  - `customMode: true`
  - `instrumental: false`
  - `prompt: [die gedig as lirieke]`
  - `style: "Gospel"` of `"Inspirational"` of `"Acoustic"`
  - `title: [les titel of "Geloofsgedig"]`
  - `model: "V4_5ALL"` of `"V5"`
- **Callback:** Asynkroon – ons moet `callBackUrl` gee of poll vir status
- **Limiet:** 20 versoeke per 10 sekondes

---

## Volgende stappe

1. Kry jou Suno API-sleutel (Stap 1–2 hierbo)
2. Voeg dit by Supabase Secrets as `SUNO_API_KEY`
3. Deploy jou funksies:
   - Maak jou terminal oop
   - Tik: `npx supabase functions deploy musiek-ai --no-verify-jwt`
   - Tik: `npx supabase functions deploy geloofsonderrig-ai --no-verify-jwt`

Beide `musiek-ai` (vir die musiek-afdeling) en `geloofsonderrig-ai` (vir die les-beloning) gebruik nou dieselfde **Suno API (sunoapi.org)** en dieselfde `SUNO_API_KEY`.
