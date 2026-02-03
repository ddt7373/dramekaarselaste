# 📋 Bybelverse Implementasie Gids

## ✅ Wat is Reeds Gedoen:

### 1. VerseComponent Geskep ✓
**Lêer:** `src/components/nhka/VerseComponent.tsx`

**Features:**
- 5 rondtes van verse oefeninge
- 3 ontbrekende woorde per rondte
- Multikeuse opsies
- Visuele feedback (✅/❌)
- Progress tracking
- Telling systeem
- "Probeer Weer" funksionaliteit

---

## 🔄 Wat Nog Gedoen Moet Word:

### Stap 1: Update Edge Function vir Verse Extraction

**Lêer:** `supabase/functions/geloofsonderrig-ai/index.ts`

Vervang lyn 85-90 met:

```typescript
        } else if (type === 'verses') {
            // VERSE EXTRACTION - Afrikaans
            systemPrompt = `Jy is 'n teologie-assistent. Extraheer 5 sleutel Bybelverse wat in hierdie les genoem word of relevant is.
            
            Reëls:
            1. Gee die VOLLEDIGE vers teks in Afrikaans (1933/1953 vertaling)
            2. Sluit die verwysing in (bv. "Johannes 3:16")
            3. Gee SLEGS 'n geldige JSON array terug:
               [{ "reference": "Johannes 3:16", "text": "Want so lief het God die wêreld gehad..." }]
            4. As daar minder as 5 verse in die teks is, soek relevante verse
            `;
            userMessage = `Extraheer 5 bybelverse vir hierdie les:\n\n${context.substring(0, 4000)}`;
        } else if (type === 'prompts') {
```

---

### Stap 2: Update Edge Function Response Handling

**Lêer:** `supabase/functions/geloofsonderrig-ai/index.ts`

Voeg by na lyn 379 (na quiz handling):

```typescript
        // Handle verse extraction
        if (type === 'verses') {
            try {
                responseData.data.verses = JSON.parse(reply); // Verses go in verses field
            } catch (e) {
                responseData.data.verses = [];
            }
        }
```

---

### Stap 3: Import VerseComponent in Geloofsonderrig

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 19 (na QuizComponent import):

```typescript
import VerseComponent from './VerseComponent';
```

---

### Stap 4: Voeg Verse State By

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 503 (na quizLoading state):

```typescript
  // Verse State
  const [showVerses, setShowVerses] = useState(false);
  const [versesLoading, setVersesLoading] = useState(false);
  const [lessonVerses, setLessonVerses] = useState<{ reference: string, text: string }[]>([]);
```

---

### Stap 5: Skep generateVerses Funksie

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 648 (na generateQuiz funksie):

```typescript
  // Generate Verses
  const generateVerses = async () => {
    if (!selectedLes || lessonVerses.length > 0) return; // Already generated
    
    setVersesLoading(true);
    try {
      const result = await invokeAIWithRetry('verses', {
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        lesId: selectedLes.id,
        leerderId: currentUser?.id
      });

      if (result?.success && result?.data?.verses) {
        setLessonVerses(result.data.verses);
      }
    } catch (error) {
      console.error('Verse generation error:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie bybelverse genereer nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setVersesLoading(false);
    }
  };
```

---

### Stap 6: Update useEffect om Verse te Genereer

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Update die useEffect op lyn 781-786:

```typescript
  // Generate quiz and verses when lesson is selected
  useEffect(() => {
    if (selectedLes && leerderView === 'verken') {
      generateQuiz();
      generateVerses(); // ← Voeg hierdie by
    }
  }, [selectedLes, leerderView]);
```

---

### Stap 7: Voeg "Begin Verse" Knoppie By

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 2103 (na Quiz knoppie):

```typescript
          {/* Verse Button */}
          <div className="mt-2">
            <Button
              onClick={() => setShowVerses(true)}
              disabled={versesLoading || lessonVerses.length === 0}
              className="w-full"
              variant="outline"
            >
              {versesLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereer Verse...
                </>
              ) : (
                <>
                  📖 Begin Verse Oefening ({completedVersesCount}/5)
                </>
              )}
            </Button>
          </div>
```

---

### Stap 8: Wys VerseComponent

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 2338 (na QuizComponent):

```typescript
        {/* Verse Modal */}
        {showVerses && lessonVerses.length > 0 && (
          <VerseComponent
            verses={lessonVerses}
            onComplete={(score) => {
              setCompletedVersesCount(5); // All 5 rounds completed
              setShowVerses(false);
              toast({
                title: 'Verse Voltooi!',
                description: `Jy het ${score} woorde korrek ingevul!`,
              });
            }}
            onClose={() => setShowVerses(false)}
          />
        )}
```

---

## 🚀 Deployment Instruksies:

### Stap 1: Deploy Edge Function
1. Gaan na Supabase Dashboard
2. Edge Functions → geloofsonderrig-ai
3. Deploy new version
4. Plak opgedateerde kode

### Stap 2: Build Frontend
```bash
npm run build
```

### Stap 3: Upload Dist
Upload die `dist/` folder

### Stap 4: Toets
1. Clear cache
2. Kies 'n les
3. Wag vir "Genereer Verse..."
4. Klik "Begin Verse Oefening"
5. Voltooi 5 rondtes
6. Kyk of telling korrek is

---

## ✅ Verwagde Resultaat:

### Progress Display:
```
AI Vrae 🤖: 5/10
Eie Vrae 💭: 2/3
Quiz 📝: 4/5
Verse 📖: 5/5  ← Moet update na verse voltooi
Prente 🎨: 0/3

[📝 Begin Quiz (4/5)]
[📖 Begin Verse Oefening (5/5)]  ← Nuwe knoppie
```

### Verse UI:
```
┌─────────────────────────────────────┐
│ 📖 Bybelverse Oefening              │
│ Rondte 1 van 5                      │
│ [████░░░░░░░░░░░░░░░░]              │
├─────────────────────────────────────┤
│                                     │
│  Johannes 3:16                      │
│                                     │
│  Want so lief het God die ______    │
│  gehad dat Hy sy ______ Seun        │
│  gegee het, sodat elkeen wat in     │
│  Hom ______, nie verlore mag gaan   │
│  nie, maar die ewige lewe kan hê.   │
│                                     │
│  [wêreld] [eniggebore] [glo] [lewe] │
│                                     │
│  Rondte Telling: 0/3                │
│  Totaal Korrek: 0                   │
└─────────────────────────────────────┘
```

---

## 📊 Lêers Verander:

### Nuut:
- `src/components/nhka/VerseComponent.tsx` ✓

### Moet Nog Update:
- `supabase/functions/geloofsonderrig-ai/index.ts`
  - Lyn 85-90: Verse extraction prompt
  - Na lyn 379: Verse response handling

- `src/components/nhka/Geloofsonderrig.tsx`
  - Lyn 19: Import VerseComponent
  - Na lyn 503: Verse state
  - Na lyn 648: generateVerses funksie
  - Lyn 781-786: Update useEffect
  - Na lyn 2103: Verse knoppie
  - Na lyn 2338: VerseComponent rendering

---

## 🎯 Tyd Benodig:

**Totaal:** ~2-3 uur om al die stappe te voltooi

**Breakdown:**
- Edge Function updates: 30 min
- Frontend integration: 1.5 uur
- Testing & debugging: 1 uur

---

## 💡 Belangrike Notas:

1. **Verse Kwaliteit:** Die AI moet volledige verse in Afrikaans gee
2. **Ontbrekende Woorde:** Die component kies outomaties 3 woorde per rondte
3. **5 Rondtes:** Elke rondte gebruik dieselfde verse maar verskillende ontbrekende woorde
4. **Telling:** Totale korrekte woorde word gestoor

---

## ✨ Volgende Stap:

Na verse implementasie is voltooi, is Fase 2 KLAAR! 🎉

Dan kan ons begin met:
- Fase 3: Visualiserings/Infographics
- Fase 4: Reward stelsel + Leaderboard

---

**Wil jy hê ek moet:**

**A)** Jy voltooi die verse implementasie self (volg die gids)  
**B)** Ek help jou met die res van die stappe  
**C)** Ons skip verse vir nou en gaan aan na Fase 3

Laat my weet! 🚀
