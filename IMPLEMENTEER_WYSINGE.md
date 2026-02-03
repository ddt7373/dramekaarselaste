# Implementeer Alle Wysigings

Hierdie gids beskryf hoe om al die onlangse wysigings (insluitend die geheime demo-knoppie, gedig & musiek, ens.) te implementeer.

---

## Oorsig: Wat moet ge-deploy word?

| Komponent | Wat | Hoe |
|-----------|-----|-----|
| **Frontend** | React-app (demo-knoppie, Geloofsonderrig, ens.) | Build + FTP |
| **Edge Function** | geloofsonderrig-ai (gedig, musiek, prente, KI) | Supabase deploy |
| **Database** | Migrasies (Jy is Myne storage, Kort & Kragtig, ens.) | Supabase migrasies |

---

## Stap 1: Frontend bou en oplaai

### 1.1 Bou die toepassing

```powershell
cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste
npm run build
```

Dit skep die `dist`-gids met die produkcie-weergawe.

### 1.2 Laai op na FTP

Maak seker `.env.deploy` bestaan met jou FTP-gegewens:

```
FTP_HOST=jou-host
FTP_USER=jou-gebruiker
FTP_PASS=jou-wagwoord
FTP_REMOTE_PATH=public_html
```

Dan:

```powershell
node scripts/deploy.js
```

Die `dist`-inhoud word na jou webwerf oorgelaai.

---

## Stap 2: Supabase Edge Function deploy

Die `geloofsonderrig-ai` funksie handel gedig, musiek, prente en KI-gesprekke af.

### Metode A: Via Supabase CLI

**Belangrik:** Gebruik `npx supabase` (nie net `supabase` nie – die CLI is nie globaal geïnstalleer nie).

```powershell
npx supabase login
npx supabase link --project-ref [jou-project-ref]
npx supabase functions deploy geloofsonderrig-ai --no-verify-jwt
```

**Vind jou project-ref:** Supabase Dashboard → Project Settings → General → Reference ID

**As jy "Docker is not running" sien:** Maak Docker Desktop oop en probeer weer.

### Metode B: Via Supabase Dashboard (as CLI nie werk nie)

1. Gaan na https://supabase.com/dashboard
2. Kies jou projek
3. **Edge Functions** → `geloofsonderrig-ai` (of skep dit)
4. **Deploy new version** → plak die kode uit `supabase/functions/geloofsonderrig-ai/index.ts`

### Secrets vir die Edge Function

In Supabase Dashboard → Edge Functions → geloofsonderrig-ai → **Settings** → **Secrets**:

| Naam | Doel |
|------|------|
| `GEMINI_API_KEY` | KI-gesprekke, gedig, prente |
| `SUNO_API_KEY` | Musiek-generasie (opsioneel; val terug na ABC-notasie sonder dit) |

---

## Stap 3: Supabase migrasies toepas

As jy nog nie al die migrasies toegepas het nie:

### Via Supabase Dashboard (SQL Editor)

1. Gaan na **SQL Editor**
2. Voer elke migrasie-lêer in volgorde uit (volgens die datum-voorvoegsel in die naam)

### Via Supabase CLI

```powershell
npx supabase db push
```

Of, as jy lokaal ontwikkel:

```powershell
npx supabase migration up
```

**Belangrike migrasies vir die nuwe funksies:**
- `20250129100014_create_jy_is_myne_storage.sql` – foto-oplaai vir Jy is Myne
- `20250129100015_seed_kort_kragtig_lessons.sql` – Kort & Kragtig voorbeeldlesse

---

## Stap 4: Verifieer

### Frontend

1. Gaan na https://www.dramekaarselaste.co.za
2. Druk **Ctrl+Shift+R** (hard refresh) of gebruik Incognito
3. Gaan na **Geloofsonderrig** → **Ek is 'n Leerder**
4. Klik op die **"demo"**-knoppie (regs onder in die blou vorderingkaart) of druk **Ctrl+Shift+M**
5. Jy moet direk op die voltooiingskerm wees met "Skep Gedig" en "Skep Musiek"

### Edge Function

1. Supabase Dashboard → Edge Functions → geloofsonderrig-ai → **Logs**
2. Kyk vir suksesvolle aanroepe wanneer jy gedig/musiek genereer

---

## Vinnige verwysing: Volledige deploy-volgorde

```powershell
# 1. Frontend
npm run build
node scripts/deploy.js

# 2. Edge Function (as jy Supabase CLI gebruik)
npx supabase functions deploy geloofsonderrig-ai --no-verify-jwt

# 3. Migrasies (as nodig)
npx supabase db push
```

---

## Troubleshooting

| Probleem | Oplossing |
|---------|-----------|
| "dist folder not found" | Voer `npm run build` eers uit |
| FTP-fout | Kontroleer `.env.deploy` en FTP-gegewens |
| "AI fallback triggered" | Deploy die `geloofsonderrig-ai` Edge Function |
| Demo-knoppie werk nie | Hard refresh (Ctrl+Shift+R) of clear cache |
| Musiek genereer nie | Kontroleer `SUNO_API_KEY` in Supabase Secrets (of gebruik ABC-terugval) |
