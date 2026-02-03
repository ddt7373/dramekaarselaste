# 🎨 Fase 3: Visualiserings - Implementasie Gids

## ✅ Wat is Reeds Gedoen:

### 1. VisualisationGallery Component Geskep ✓
**Lêer:** `src/components/nhka/VisualisationGallery.tsx`

**Features:**
- Grid view van alle visualiserings
- Full view dialog (klik om te vergroot)
- Download as SVG
- Download as PNG
- Deel funksionaliteit
- Mooi hover effects

---

## 🔄 Wat Nog Gedoen Moet Word:

### Stap 1: Import VisualisationGallery

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 21 (na VerseComponent import):

```typescript
import VisualisationGallery from './VisualisationGallery';
```

---

### Stap 2: Voeg Visualisation State By

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 510 (na verse state):

```typescript
  // Visualisation State
  const [generatingVisualisation, setGeneratingVisualisation] = useState(false);
  const [showVisualisationGallery, setShowVisualisationGallery] = useState(false);
```

---

### Stap 3: Skep generateVisualisation Funksie

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 684 (na generateVerses funksie):

```typescript
  // Generate Visualisation
  const generateVisualisation = async (content: string, prompt: string) => {
    if (!selectedLes) return;
    
    setGeneratingVisualisation(true);
    try {
      const result = await invokeAIWithRetry('infographic', {
        lesInhoud: content,
        prompt: prompt,
        lesId: selectedLes.id,
        leerderId: currentUser?.id
      });

      if (result?.success && result?.data?.svg) {
        // Save to database
        const { error } = await supabase
          .from('geloofsonderrig_les_visualiserings')
          .insert({
            les_id: selectedLes.id,
            leerder_id: currentUser?.id,
            svg_data: result.data.svg,
            prompt: prompt
          });

        if (!error) {
          // Refresh visualisations
          fetchGeneratedImages();
          
          toast({
            title: 'Visualisering Geskep! 🎨',
            description: 'Jou mooi grafika is gereed.',
          });
        }
      }
    } catch (error) {
      console.error('Visualisation error:', error);
      toast({
        title: 'Fout',
        description: 'Kon nie visualisering skep nie.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingVisualisation(false);
    }
  };
```

---

### Stap 4: Voeg "Skep Visualisering" Knoppie By

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Soek na waar AI messages gerender word (rondom lyn 2200-2300) en voeg by:

```typescript
{message.role === 'assistant' && (
  <div className="flex gap-2 mt-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={() => generateVisualisation(
        selectedLes?.inhoud || '', 
        message.content.substring(0, 200)
      )}
      disabled={generatingVisualisation}
      className="text-purple-600 hover:text-purple-700"
    >
      {generatingVisualisation ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Skep...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-1" />
          Skep Visualisering
        </>
      )}
    </Button>
  </div>
)}
```

---

### Stap 5: Voeg "Wys Visualiserings" Knoppie By

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 2158 (na Verse knoppie):

```typescript
          {/* Visualisations Button */}
          <div className="mt-2">
            <Button
              onClick={() => setShowVisualisationGallery(true)}
              disabled={lesVisualiserings.length === 0}
              className="w-full"
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Wys Visualiserings ({lesVisualiserings.length}/3)
            </Button>
          </div>
```

---

### Stap 6: Wys VisualisationGallery Dialog

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

Voeg by na lyn 2410 (na VerseComponent):

```typescript
        {/* Visualisation Gallery Modal */}
        {showVisualisationGallery && (
          <Dialog open={showVisualisationGallery} onOpenChange={setShowVisualisationGallery}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Jou Visualiserings
                </DialogTitle>
              </DialogHeader>
              <VisualisationGallery
                visualisations={lesVisualiserings.map(v => ({
                  id: v.id,
                  svg: v.svg_data,
                  prompt: v.prompt || '',
                  created_at: v.created_at
                }))}
                onShare={(vis) => {
                  // Share to Facebook logic
                  console.log('Share:', vis);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
```

---

## 🗄️ Database Schema:

Die `geloofsonderrig_les_visualiserings` tabel bestaan reeds (volgens jou kode).

**Velde:**
- `id` (uuid)
- `les_id` (uuid)
- `leerder_id` (uuid)
- `svg_data` (text)
- `prompt` (text)
- `created_at` (timestamp)

---

## 🎨 Hoe Dit Werk:

### Gebruiker Ervaring:

1. **Leerder vra 'n vraag** → AI antwoord
2. **Klik "Skep Visualisering"** → AI genereer mooi SVG
3. **Visualisering verskyn in galery**
4. **Klik op visualisering** → Vergroot view
5. **Laai af as SVG of PNG**
6. **Deel op sosiale media**

### Voorbeeld Flow:

```
Vraag: "Hoekom het Jesus na Jerusalem gegaan?"

AI Antwoord: "Jesus het na Jerusalem gegaan om die Pasga fees te vier..."

[Skep Visualisering] ← Klik hierdie knoppie

→ AI genereer mooi infographic met:
  - Sentrale sirkel: "Jesus in Jerusalem"
  - Takke: "Pasga Fees", "Tempel", "Dissipels"
  - Ikone: 🙏 ⛪ ❤️
  - Kleurvolle gradients

→ Visualisering verskyn in galery
→ Leerder kan aflaai/deel
```

---

## 🚀 Deployment:

### Stap 1: Build Frontend
```bash
npm run build
```

### Stap 2: Upload
Upload `dist/` folder

### Stap 3: Toets
1. Gaan na Geloofsonderrig
2. Kies 'n les
3. Vra 'n vraag
4. Klik "Skep Visualisering"
5. Wag vir AI (30-60 sekondes)
6. Kyk of visualisering mooi is
7. Toets download (SVG & PNG)

---

## 📊 Tyd Benodig:

**Totaal:** ~2-3 uur om te voltooi

**Breakdown:**
1. Imports & state: 15 min
2. generateVisualisation funksie: 30 min
3. Knoppies byvoeg: 30 min
4. Dialog setup: 30 min
5. Testing & debugging: 1 uur

---

## 💡 Verbeterings (Opsioneel):

### 1. Meer Kreatiewe Prompts
Update die Edge Function prompt om:
- Meer emojis te gebruik
- Beter kleur palette
- Moderne ontwerpe

### 2. Voorskou
Wys 'n loading state met skeleton

### 3. Filters
Laat leerders filter op datum/onderwerp

### 4. Galery View
Voeg 'n dedicated galery bladsy by

---

## ✨ Samevatting:

**Wat Werk:**
- ✅ VisualisationGallery component
- ✅ Download as SVG
- ✅ Download as PNG
- ✅ Full view dialog
- ✅ Mooi UI

**Wat Nog Nodig Is:**
- ⏳ Integration (6 stappe bo)
- ⏳ Testing
- ⏳ Polish

**Tyd:** ~2-3 uur

---

**Wil jy hê ek moet:**

**A)** Jy voltooi die integration self (volg die 6 stappe)  
**B)** Ek help jou met die res van die stappe  
**C)** Ons skip visualiserings en gaan na Fase 4

Laat my weet! 🚀
