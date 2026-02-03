# 📋 Fase 2 - Voltooiing Gids

## ✅ Wat is Reeds Gedoen:

### 1. Edge Function Opgedateer ✓
- **Lêer:** `supabase/functions/geloofsonderrig-ai/index.ts`
- Quiz genereer nou 10 vrae in Afrikaans
- Geskik vir kinders 12-17 jaar
- **Deploy nodig:** Ja, moet na Supabase ge-deploy word

### 2. Quiz Component Geskep ✓
- **Lêer:** `src/components/nhka/QuizComponent.tsx`
- Volledige quiz UI met feedback
- Progress tracking
- Scoring systeem

### 3. Import Bygevoeg ✓
- **Lêer:** `src/components/nhka/Geloofsonderrig.tsx`
- QuizComponent is geïmporteer

---

## 🔄 Wat Nog Gedoen Moet Word:

### Stap 1: Voeg Quiz State By
**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 499 (na `generatedImageUrl` state):

```typescript
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
```

---

### Stap 2: Skep Funksie om Quiz te Genereer
**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na die `invokeAIWithRetry` funksie (rondom lyn 615):

```typescript
  const generateQuiz = async () => {
    if (!selectedLes || quizQuestions.length > 0) return; // Already generated
    
    setQuizLoading(true);
    try {
      const result = await invokeAIWithRetry('quiz', {
        lesInhoud: selectedLes.inhoud,
        lesTitel: selectedLes.titel,
        lesId: selectedLes.id,
        leerderId: currentUser?.id
      });

      if (result?.success && result?.data?.prompts) {
        // The quiz questions are in result.data.prompts
        setQuizQuestions(result.data.prompts);
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie quiz genereer nie. Probeer asseblief weer.',
        variant: 'destructive'
      });
    } finally {
      setQuizLoading(false);
    }
  };
```

---

### Stap 3: Roep `generateQuiz` wanneer Les Begin
**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by in die `useEffect` wat `selectedLes` monitor (rondom lyn 560):

```typescript
  useEffect(() => {
    if (selectedLes) {
      fetchVrae(selectedLes.id);
      setCurrentVraagIndex(0);
      setAntwoorde({});
      setKiTerugvoer({});
      
      // Generate quiz questions
      generateQuiz(); // ← Voeg hierdie by
    }
  }, [selectedLes]);
```

---

### Stap 4: Voeg "Begin Quiz" Knoppie By
**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Soek na die progress display area (rondom lyn 2035) en voeg 'n knoppie by:

```typescript
          </div>
          
          {/* Quiz Button */}
          <div className="mt-4">
            <Button
              onClick={() => setShowQuiz(true)}
              disabled={quizLoading || quizQuestions.length === 0}
              className="w-full"
              variant="outline"
            >
              {quizLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereer Quiz...
                </>
              ) : (
                <>
                  📝 Begin Quiz ({answeredQuizCount}/5)
                </>
              )}
            </Button>
          </div>
          
          {!canComplete && (
```

---

### Stap 5: Wys Quiz Component
**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by aan die einde van die `renderLesVerken` funksie, voor die sluit `</div>`:

```typescript
        {/* Quiz Modal */}
        {showQuiz && quizQuestions.length > 0 && (
          <QuizComponent
            questions={quizQuestions}
            onComplete={(score) => {
              setAnsweredQuizCount(score);
              setShowQuiz(false);
              toast({
                title: 'Quiz Voltooi!',
                description: `Jy het ${score} uit ${quizQuestions.length} korrek!`,
              });
            }}
            onClose={() => setShowQuiz(false)}
          />
        )}
      </div>
    );
  };
```

---

### Stap 6: Update Edge Function Response Formaat
**Lêer:** `supabase/functions/geloofsonderrig-ai/index.ts`

Die quiz response moet in die korrekte formaat wees. Soek na die response construction (rondom lyn 356) en maak seker:

```typescript
        if (type === 'prompts') {
            try {
                responseData.data.prompts = JSON.parse(reply);
            } catch (e) {
                responseData.data.prompts = [];
            }
        }
        
        // Add this for quiz
        if (type === 'quiz') {
            try {
                responseData.data.prompts = JSON.parse(reply); // Quiz questions go in prompts
            } catch (e) {
                responseData.data.prompts = [];
            }
        }
```

---

## 🚀 Deployment Instruksies:

### 1. Deploy Edge Function
```bash
# Via Supabase Dashboard:
# 1. Gaan na Edge Functions → geloofsonderrig-ai
# 2. Kopieer die inhoud van supabase/functions/geloofsonderrig-ai/index.ts
# 3. Plak in die editor
# 4. Klik "Deploy"
```

### 2. Build Frontend
```bash
cd c:\Users\ddt\OneDrive\Documents\Websites\DraMekaarSeLaste
npm run build
```

### 3. Upload Dist
Upload die `dist/` folder na jou hosting.

---

## ✅ Toets die Quiz:

1. Gaan na Geloofsonderrig
2. Kies 'n les
3. Wag vir "Genereer Quiz..." om klaar te maak
4. Klik "Begin Quiz"
5. Beantwoord die 10 vrae
6. Kyk of telling korrek is (X/5 in progress)

---

## 📊 Verwagde Resultaat:

```
Progress:
AI Vrae 🤖: 5/10
Eie Vrae 💭: 2/3
Quiz 📝: 4/5  ← Moet update na die telling
Verse 📖: 0/5
Prente 🎨: 0/3
```

---

## 🎯 Volgende: Bybelverse

Na die quiz werk, kan ons begin met Bybelverse met ontbrekende woorde.

Dit sal soortgelyk wees:
1. Edge Function genereer verse
2. VerseComponent (hergebruik Bybelkennis logika)
3. Integreer in Geloofsonderrig

---

## 💡 Hulp Nodig?

As jy enige probleme ondervind:
1. Kyk na die console vir errors
2. Maak seker Edge Function is ge-deploy
3. Kontroleer dat quiz vrae genereer word
4. Toets die QuizComponent afsonderlik

---

**Tyd Benodig:** ~2-3 uur om hierdie stappe te voltooi
**Moeilikheidsgraad:** Medium 🟡

Laat my weet as jy hulp nodig het met enige van hierdie stappe! 🚀
