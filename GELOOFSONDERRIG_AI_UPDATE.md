# Geloofsonderrig AI Update - "Gids" Persona

## Wat is Verander? 🎯

Die AI-mentor vir die geloofsonderrig-funksionaliteit is opgegradeer met 'n nuwe "Gids" persona wat:

### Kernveranderinge:

1. **Geen Copy-Paste** ❌
   - Die AI sal NOOIT meer direk uit die lesteks kopieer nie
   - Alle antwoorde word herformuleer in eenvoudige, gespreksmatige Afrikaans
   - Dit praat soos 'n mentor wat 'n storie vertel, nie 'n leerboek wat voorgelees word nie

2. **Gesprek, Nie Lesing Nie** 💬
   - Kort, kragtige antwoorde (maksimum 3 sinne)
   - Eindig ALTYD met 'n opvolgvraag
   - Hou die gesprek interaktief en dinamies

3. **Sokratiese Metode** 🤔
   - Vra terug eerder as om net te vertel
   - Help kinders om self die antwoord te ontdek
   - Gebruik vrae soos: "Wat dink jy het gebeur?" of "Hoe sou jy gevoel het?"

4. **Vermy Herhaling** 🔄
   - Elke antwoord is vars en kreatief
   - Fokus op verskillende aspekte van die les
   - Verander bewoording as soortgelyke vrae gevra word

5. **Emosionele Konneksie** ❤️
   - Fokus op waardes: liefde, vergifnis, moed, geloof
   - Maak dit persoonlik en relevant vir kinders se lewens
   - Gebruik voorbeelde uit hulle wêreld (skool, vriende, sport, games)

6. **Vriendelike Toon** 🌟
   - Gebruik emojis waar gepas
   - Entoesiasties en warm
   - Praat soos 'n groot boetie/sussie, nie 'n onderwyser nie

### Voorbeelde:

**Voor (Ou Styl):**
> "Jesus het na Jerusalem gegaan en die mense het takke geswaai."

**Na (Nuwe "Gids" Styl):**
> "Dit was 'n reuse fees! 🎉 Verbeel jou jy staan langs die pad en almal juig vir Jesus. Hulle het palmtakke gewaai soos vlae! 👋 As jy daar was, wat sou jy vir Jesus geskree het?"

---

## Hoe om die Opdatering te Implementeer

Die kode is reeds opgedateer in die volgende lêer:
- `supabase/functions/geloofsonderrig-ai/index.ts`

### Stap 1: Deploy die Funksie na Supabase

Jy moet die opgedateerde funksie na Supabase deploy. Gebruik die volgende opdrag:

```bash
supabase functions deploy geloofsonderrig-ai --no-verify-jwt
```

**Let wel:** As jy nie die Supabase CLI geïnstalleer het nie, kan jy dit installeer met:

```bash
npm install -g supabase
```

Dan moet jy inlog:

```bash
supabase login
```

En jou projek koppel:

```bash
supabase link --project-ref [jou-project-ref]
```

### Stap 2: Toets die Nuwe Gedrag

1. Gaan na die Geloofsonderrig-module
2. Kies 'n les
3. Begin 'n gesprek met die AI
4. Let op dat die AI:
   - Kort, gespreksmatige antwoorde gee
   - Altyd met 'n vraag eindig
   - Emojis gebruik
   - NIE direk uit die teks kopieer nie
   - Fokus op emosionele konneksie en waardes

### Stap 3: Verifieer die Vrae

Die voorgestelde vrae wat die AI genereer moet ook meer natuurlik klink:

**Voor:**
- "Wat is die hoofteologiese beginsel?"
- "Verduidelik die historiese konteks"

**Na:**
- "Hoekom is dit belangrik vir my lewe vandag? 🤔"
- "Hoe help dit my met my vriende? 👥"
- "Wat as ek sukkel om dit te glo? 💭"

---

## Tegniese Details

### Veranderde Lêers:
1. `supabase/functions/geloofsonderrig-ai/index.ts`
   - Chat system prompt (reëls 118-176)
   - Prompt generation system prompt (reëls 90-120)

### AI Model:
- Steeds: `gemini-2.0-flash-lite-001`
- Temperature: 0.7 (vir gesprekke)

### Sleutel Instruksies aan die AI:

Die AI ontvang nou hierdie kernreëls:

1. **GEEN COPY-PASTE**: Moet NOOIT sinne direk uit die bronteks kopieer nie
2. **GESPREK, NIE LESING NIE**: Kort antwoorde (max 3 sinne) + opvolgvraag
3. **SOKRATIESE METODE**: Vra terug, help die kind om self te ontdek
4. **VERMY HERHALING**: Wees kreatief en vars in elke antwoord
5. **EMOSIONELE KONNEKSIE**: Fokus op waardes, nie net feite nie

---

## Troubleshooting

### As die AI steeds te formeel klink:
- Maak seker die funksie is suksesvol ge-deploy
- Kontroleer dat die `type: 'chat'` parameter korrek gestuur word

### As die AI steeds uit die teks kopieer:
- Dit kan gebeur as die lesinhoud self baie kort is
- Die AI sal probeer om te herformuleer, maar as daar min inhoud is, kan dit soortgelyk klink

### As die AI nie vrae vra nie:
- Kontroleer die `systemPrompt` in die deployed funksie
- Maak seker die "Eindig ALTYD met 'n vraag" instruksie is ingesluit

---

## Volgende Stappe (Opsioneel)

As jy die ervaring verder wil verbeter:

1. **Voeg meer emojis by** in die frontend UI
2. **Wys die "Gids" naam** prominent in die chat interface
3. **Voeg 'n avatar by** vir "Gids" om dit meer persoonlik te maak
4. **Implementeer 'n welkomsboodskap** wanneer die kind die eerste keer 'n les begin

---

## Kontak vir Ondersteuning

As jy enige probleme ondervind met die deployment of die nuwe gedrag, laat weet asseblief.

**Belangrik:** Die veranderinge sal eers sigbaar wees nadat die funksie suksesvol na Supabase ge-deploy is.
