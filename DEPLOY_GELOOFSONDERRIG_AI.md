# 🚀 Hoe om die Geloofsonderrig AI te Deploy

## Wat moet jy Deploy?

**Edge Function:** `supabase/functions/geloofsonderrig-ai/index.ts`

**Tipe:** Supabase Edge Function (Deno/TypeScript)

**Nota:** Die `GELOOFSONDERRIG_AI_UPDATE.md` lêer is net dokumentasie - jy hoef dit nie te deploy nie! 📖

---

## Metode 1: Via Supabase CLI (Aanbeveel) ⚡

### Stap 1: Installeer Supabase CLI

```bash
npm install -g supabase
```

### Stap 2: Login by Supabase

```bash
supabase login
```

Dit sal 'n browser-venster oopmaak. Log in met jou Supabase-rekening.

### Stap 3: Link jou Projek

Eers, kry jou project reference:
1. Gaan na: https://supabase.com/dashboard
2. Kies jou projek
3. Die URL sal lyk soos: `https://supabase.com/dashboard/project/xxxxxxxxxxxxx`
4. Die `xxxxxxxxxxxxx` deel is jou project-ref

Dan, link die projek:

```bash
supabase link --project-ref xxxxxxxxxxxxx
```

Vervang `xxxxxxxxxxxxx` met jou werklike project-ref.

### Stap 4: Deploy die Funksie

```bash
supabase functions deploy geloofsonderrig-ai --no-verify-jwt
```

**Verduideliking van flags:**
- `geloofsonderrig-ai` - Die naam van die funksie
- `--no-verify-jwt` - Skakel JWT-verifikasie af (makliker vir testing)

### Stap 5: Verifieer Deployment

Jy sal 'n boodskap sien soos:

```
✓ Deployed Function geloofsonderrig-ai
  URL: https://xxxxxxxxxxxxx.supabase.co/functions/v1/geloofsonderrig-ai
```

---

## Metode 2: Via Supabase Dashboard (Handmatig) 🖱️

As jy nie die CLI wil gebruik nie:

### Stap 1: Gaan na Supabase Dashboard

1. Gaan na: https://supabase.com/dashboard
2. Kies jou projek

### Stap 2: Navigeer na Edge Functions

1. Klik op **"Edge Functions"** in die linker menu
2. Soek vir die `geloofsonderrig-ai` funksie

### Stap 3: Update die Kode

1. Klik op die `geloofsonderrig-ai` funksie
2. Klik op **"Deploy new version"** of **"Edit"**
3. Open die lêer: `supabase/functions/geloofsonderrig-ai/index.ts`
4. Kopieer die VOLLEDIGE inhoud
5. Plak dit in die Supabase editor
6. Klik **"Deploy"**

---

## ✅ Toets die Deployment

### Metode 1: Via die App

1. Gaan na die Geloofsonderrig-module in jou app
2. Kies 'n les
3. Begin 'n gesprek met die AI
4. Kyk of die AI:
   - ✅ Kort, gespreksmatige antwoorde gee (max 3 sinne)
   - ✅ Altyd met 'n vraag eindig
   - ✅ Emojis gebruik 🌟
   - ✅ NIE direk uit die teks kopieer nie
   - ✅ Fokus op emosionele konneksie

### Metode 2: Via Supabase Dashboard

1. Gaan na **Edge Functions** in Supabase Dashboard
2. Klik op `geloofsonderrig-ai`
3. Klik op **"Invoke"** of **"Test"**
4. Gebruik hierdie test payload:

```json
{
  "type": "chat",
  "prompt": "Vertel my van Jesus",
  "context": "Jesus het na Jerusalem gegaan. Die mense het Hom verwelkom met palmtakke. Dit was 'n groot fees.",
  "leerderId": "test-123",
  "lesId": "test-les-456",
  "chatHistory": []
}
```

5. Kyk of die response:
   - Kort en gespreksmatig is
   - Met 'n vraag eindig
   - Emojis bevat
   - NIE die teks direk kopieer nie

**Voorbeeld van 'n goeie response:**

```json
{
  "reply": "Dit was 'n reuse fees! 🎉 Verbeel jou jy staan langs die pad en almal juig vir Jesus. Hulle het palmtakke gewaai soos vlae! 👋 As jy daar was, wat sou jy vir Jesus geskree het?"
}
```

---

## 🔧 Troubleshooting

### Probleem: "supabase: command not found"

**Oplossing:**
```bash
npm install -g supabase
```

As dit steeds nie werk nie, probeer:
```bash
npx supabase login
npx supabase functions deploy geloofsonderrig-ai --no-verify-jwt
```

### Probleem: "Project not linked"

**Oplossing:**
```bash
supabase link --project-ref [jou-project-ref]
```

Kry jou project-ref van die Supabase Dashboard URL.

### Probleem: "Invalid API key"

**Oplossing:**
1. Gaan na Supabase Dashboard
2. Gaan na **Settings** → **API**
3. Kopieer die **service_role** key
4. Gaan na **Edge Functions** → **geloofsonderrig-ai** → **Settings**
5. Maak seker die `GEMINI_API_KEY` environment variable is gestel

### Probleem: AI gee steeds formele antwoorde

**Oplossing:**
1. Maak seker die deployment was suksesvol
2. Wag 1-2 minute vir die funksie om te "warm up"
3. Clear jou browser cache
4. Probeer weer

### Probleem: "500 Internal Server Error"

**Oplossing:**
1. Gaan na Supabase Dashboard
2. Klik op **Edge Functions** → **geloofsonderrig-ai**
3. Klik op **"Logs"**
4. Kyk vir error messages
5. Maak seker die `GEMINI_API_KEY` is korrek gestel

---

## 📊 Environment Variables

Maak seker hierdie environment variables is gestel in Supabase:

1. Gaan na **Edge Functions** → **geloofsonderrig-ai** → **Settings**
2. Voeg by (as dit nie reeds daar is nie):

| Variable | Value | Beskrywing |
|----------|-------|------------|
| `GEMINI_API_KEY` | [jou-gemini-key] | Google Gemini API sleutel |
| `SUPABASE_URL` | Auto-gestel | Jou Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-gestel | Service role key |

**Hoe kry jy 'n Gemini API key?**
1. Gaan na: https://makersuite.google.com/app/apikey
2. Klik **"Create API Key"**
3. Kopieer die key
4. Plak dit in Supabase

---

## 🎯 Volgende Stappe na Deployment

1. **Toets die nuwe gedrag** met verskillende vrae
2. **Monitor die logs** vir enige errors
3. **Kry terugvoer** van gebruikers
4. **Verfyn die prompts** indien nodig

---

## 📞 Hulp Nodig?

As jy enige probleme ondervind:
1. Kyk na die **Logs** in Supabase Dashboard
2. Kontroleer dat alle environment variables korrek is
3. Maak seker die deployment was suksesvol
4. Probeer die funksie direk in die Dashboard toets

**Belangrik:** Die veranderinge sal eers sigbaar wees nadat die funksie suksesvol ge-deploy is! ✨
