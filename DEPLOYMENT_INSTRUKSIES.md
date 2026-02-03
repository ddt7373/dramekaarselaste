# ⚠️ BELANGRIK: Deployment Instruksies

## 🔴 Die Probleem wat Jy Ondervind Het:

Jy het die **frontend (dist)** opgelaai, maar die **Edge Function** is **NIE** ge-deploy nie!

**Console error:** `AI fallback triggered` - dit beteken die Edge Function werk nie.

---

## ✅ Oplossing: Deploy die Edge Function

### **Metode 1: Via Supabase Dashboard (MAKLIKSTE)**

#### Stap 1: Kopieer die Kode

1. Open hierdie lêer: `supabase/functions/geloofsonderrig-ai/index.ts`
2. Druk **Ctrl+A** (selekteer alles)
3. Druk **Ctrl+C** (kopieer)

#### Stap 2: Gaan na Supabase Dashboard

1. Gaan na: https://supabase.com/dashboard
2. Log in met jou rekening
3. Kies jou projek

#### Stap 3: Navigeer na Edge Functions

1. Klik op **"Edge Functions"** in die linker menu
2. Soek vir `geloofsonderrig-ai` in die lys

**As die funksie NIE bestaan nie:**
- Klik **"Create a new function"**
- Naam: `geloofsonderrig-ai`
- Klik **"Create function"**

#### Stap 4: Deploy die Kode

1. Klik op die `geloofsonderrig-ai` funksie
2. Klik op **"Deploy new version"** of **"Edit"**
3. **Verwyder** alle bestaande kode in die editor
4. Druk **Ctrl+V** om die nuwe kode te plak
5. Klik **"Deploy"** of **"Save"**

#### Stap 5: Wag vir Deployment

- Dit sal 10-30 sekondes neem
- Jy sal 'n sukses-boodskap sien: ✅ "Function deployed successfully"

---

### **Metode 2: Via Supabase CLI**

**Slegs as jy die CLI wil gebruik:**

#### Stap 1: Los PowerShell Execution Policy Op

Open PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Stap 2: Login en Deploy

```bash
npx supabase login
npx supabase link --project-ref [jou-project-ref]
npx supabase functions deploy geloofsonderrig-ai --no-verify-jwt
```

---

## ✅ Verifieer die Deployment

### Stap 1: Kontroleer in Supabase Dashboard

1. Gaan na **Edge Functions** → **geloofsonderrig-ai**
2. Klik op **"Logs"** tab
3. Jy moet sien: "Function deployed successfully"

### Stap 2: Toets die Funksie Direk

1. Bly in die **geloofsonderrig-ai** funksie
2. Klik op **"Invoke"** of **"Test"** tab
3. Gebruik hierdie test payload:

```json
{
  "type": "chat",
  "prompt": "Vertel my van Jesus",
  "context": "Jesus het na Jerusalem gegaan. Die mense het Hom verwelkom met palmtakke. Dit was 'n groot fees.",
  "leerderId": "test-123",
  "lesId": "test-456",
  "chatHistory": []
}
```

4. Klik **"Invoke"** of **"Run"**

### Stap 3: Kyk na die Response

Jy moet 'n response sien soos hierdie:

```json
{
  "success": true,
  "data": {
    "message": "Dit was 'n reuse fees! 🎉 Verbeel jou jy staan langs die pad en almal juig vir Jesus. Hulle het palmtakke gewaai soos vlae! 👋 As jy daar was, wat sou jy vir Jesus geskree het?",
    "suggestedImagePrompt": null,
    "nextPrompts": []
  }
}
```

**Kyk vir:**
- ✅ `"success": true`
- ✅ Kort, gespreksmatige antwoord (2-3 sinne)
- ✅ Emojis 🎉👋
- ✅ Eindig met 'n vraag
- ✅ NIE direk uit die teks gekopieer nie

---

## 🎯 Toets in die App

### Stap 1: Clear Browser Cache

1. Druk **Ctrl+Shift+Delete**
2. Kies "Cached images and files"
3. Klik **"Clear data"**

### Stap 2: Herlaai die App

1. Gaan na jou app
2. Druk **Ctrl+F5** (hard refresh)
3. Of gebruik **Incognito mode** (Ctrl+Shift+N)

### Stap 3: Toets die Geloofsonderrig

1. Gaan na **Geloofsonderrig**
2. Kies **"Ek is 'n Leerder"**
3. Kies 'n onderwerp en les
4. Klik **"Begin Verkenning"**
5. Vra 'n vraag

### Stap 4: Kontroleer die Console

1. Druk **F12** om Developer Tools oop te maak
2. Klik op **"Console"** tab
3. Jy moet **NIE** meer sien nie: ❌ `AI fallback triggered`
4. Jy moet sien: ✅ Normale AI responses

---

## 🔧 Troubleshooting

### Probleem: Steeds "AI fallback triggered"

**Oplossing:**
1. Maak seker die deployment was suksesvol
2. Wag 1-2 minute vir die funksie om "warm up"
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh (Ctrl+F5)
5. Probeer Incognito mode

### Probleem: "Function not found"

**Oplossing:**
1. Gaan na Supabase Dashboard → Edge Functions
2. Maak seker `geloofsonderrig-ai` bestaan
3. As dit nie bestaan nie, skep dit (sien Metode 1, Stap 3)

### Probleem: "500 Internal Server Error"

**Oplossing:**
1. Gaan na Edge Functions → geloofsonderrig-ai → **Logs**
2. Kyk vir error messages
3. Maak seker **Environment Variables** is gestel:
   - `GEMINI_API_KEY` - Jou Google Gemini API sleutel
   - `SUPABASE_URL` - (Auto-gestel)
   - `SUPABASE_SERVICE_ROLE_KEY` - (Auto-gestel)

### Hoe om Environment Variables te stel:

1. Supabase Dashboard → Edge Functions → geloofsonderrig-ai
2. Klik op **"Settings"** tab
3. Scroll af na **"Environment Variables"**
4. Voeg by:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** [Jou Gemini API sleutel]
5. Klik **"Save"**

**Hoe kry jy 'n Gemini API key?**
1. Gaan na: https://makersuite.google.com/app/apikey
2. Klik **"Create API Key"**
3. Kopieer die key
4. Plak dit in Supabase

---

## 📊 Verwagde Resultate

### Voor (Met Fallback):

Console:
```
AI fallback triggered
```

AI Response:
```
Jesus het na Jerusalem gegaan. Die mense het takke geswaai.
```
(Droog, formeel, direk uit teks)

### Na (Met Edge Function):

Console:
```
(Geen "fallback" boodskap)
```

AI Response:
```
Dit was 'n reuse fees! 🎉 Verbeel jou jy staan langs die pad en almal juig vir Jesus. 
Hulle het palmtakke gewaai soos vlae! 👋 As jy daar was, wat sou jy vir Jesus geskree het?
```
(Gespreksmatig, emojis, vraag aan die einde)

---

## ✨ Opsomming

**Wat jy MOET doen:**

1. ✅ **Deploy die Edge Function** (Metode 1 - Supabase Dashboard)
2. ✅ **Toets die funksie** direk in Supabase
3. ✅ **Clear browser cache** en herlaai die app
4. ✅ **Toets in die app** en kyk vir die nuwe "Gids" persona

**Tyd:** ±10 minute

**Moeilikheidsgraad:** Maklik ⭐

---

## 🎯 Volgende Stap

**Begin met Metode 1, Stap 1** - kopieer die kode en plak dit in Supabase Dashboard!

Laat my weet sodra jy dit ge-deploy het! 🚀
