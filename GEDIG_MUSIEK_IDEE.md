# Gedig & Musiek Generasie – Idee

**Vraag:** Gaan dit moontlik wees om die inhoud van die les te omskep in 'n gedig en dan daardie gedig te omskep in musiek?

## Kort antwoord: Ja, dit is moontlik

### 1. Les → Gedig

**Hoe dit kan werk:**
- Gebruik Gemini/OpenAI om die lesinhoud te neem en 'n kort gedig te skep wat die kernkonsepte vasvang
- Die gedig kan rym of vry vers wees
- Styl: kindervriendelik, eenvoudig, emosioneel relevant

**Voorbeeld:**
- Les: "Jesus se Liefde" (Johannes 3:16)
- Gedig: "Jesus het ons so lief / Hy het vir ons gegee / Sy Seun aan die kruis / Sodat ons kan lewe"

### 2. Gedig → Musiek

**Opsies:**

| Opsie | Beskrywing | Kompleksiteit |
|-------|------------|---------------|
| **A. Suno / Udio API** | AI-musiekgenerasie – jy stuur lirieke, kry 'n liedjie terug | Medium – vereis API-toegang, koste |
| **B. MusicGen (Meta)** | Oopbron AI vir musiek – kan met teks/lirieke werk | Hoog – self-host of API |
| **C. Eenvoudige melodie** | Gemini kan musieknotasie (ABC of MIDI) genereer – speel af met 'n speler | Medium – beperkte kwaliteit |
| **D. Bestaande melodieë** | Koppel gedigte aan bekende kerkliedere of kindermelodieë | Laag – geen AI-musiek nie |

### 3. Aanbevole implementasie (Fase 1)

1. **Les → Gedig:** Voeg 'n "Skep Gedig" knoppie by Geloofsonderrig
   - Roep geloofsonderrig-ai Edge Function aan met `type: 'generate_poem'`
   - Gemini genereer 'n kort gedig (4–8 reëls) gebaseer op lesinhoud
   - Vertoon die gedig en bied "Laai af" / "Deel" aan

2. **Gedig → Musiek (later):**
   - Integreer Suno/Udio API indien beskikbaar
   - Of: genereer ABC-notasie en gebruik 'n web-gebaseerde ABC-speler (bv. abcjs)
   - Of: koppel aan 'n lys van bekende melodieë wat by die gedig pas

### 4. Tegniese vereistes

- **Gediggenerasie:** Bestaande geloofsonderrig-ai Edge Function – net 'n nuwe `type` en prompt
- **Musiekgenerasie:** Nuwe integrasie – Suno/Udio het betaalde API's; MusicGen vereis self-hosting
- **ABC-notasie:** Gemini kan eenvoudige melodieë in ABC-formaat genereer – gratis, maar beperkte musiek

### 5. Volgende stappe

1. Implementeer "Skep Gedig" in Geloofsonderrig (vinnig om te doen)
2. Evalueer Suno/Udio API-koste en -toegang
3. Eksperimenteer met ABC-notasie vir eenvoudige melodieë
4. Besluit watter musiekopsie die beste by die projek pas
