# 🎨 Fase 3: Visualiserings/Infographics - Implementasie Plan

## 🎯 Doel:

Skep mooi grafika/infographics wat outomaties gegenereer word gebaseer op:
1. AI se antwoorde op die kind se vrae
2. Die kind se eie vrae
3. Lesinhoud

Die grafika moet:
- ✅ Regtig mooi wees (nie basic nie)
- ✅ Geskik vir kinders
- ✅ Visueel aantreklik
- ✅ Gebruik emojis en ikone
- ✅ SVG formaat (skaleerbaar)

---

## 📋 Implementasie Stappe:

### Stap 1: Update Edge Function vir Infographic Generation

**Lêer:** `supabase/functions/geloofsonderrig-ai/index.ts`

Die Edge Function het reeds 'n `infographic` type, maar kom ons verbeter dit:

**Huidige Kode (lyn 59-70):**
```typescript
} else if (type === 'infographic' || type === 'mindmap') {
    // INFOGRAPHIC / MINDMAP GENERATION
    systemPrompt = `You are a creative designer creating an SVG infographic for a faith lesson...`;
    userMessage = `Create an SVG infographic for this lesson:\n\n${context.substring(0, 4000)}`;
    temperature = 0.4;
}
```

**Nuwe Kode:**
```typescript
} else if (type === 'infographic' || type === 'mindmap') {
    // INFOGRAPHIC / MINDMAP GENERATION - Mooi, kleurvolle grafika
    systemPrompt = `Jy is 'n kreatiewe ontwerper wat 'n pragtige SVG infographic skep vir 'n geloofsles vir kinders (12-17 jaar).
    
    🎨 ONTWERP VEREISTES:
    1. **Kleure**: Gebruik lewendige, harmonieuse kleure (nie basic rooi/blou nie)
       - Gebruik gradients vir diepte
       - Pastel kleure vir agtergrond
       - Helder kleure vir hoofpunte
    
    2. **Ikone & Emojis**: Sluit relevante ikone/emojis in
       - Gebruik SVG shapes vir ikone
       - Maak dit visueel interessant
    
    3. **Layout**: Moderne, skoon ontwerp
       - Gebruik wit spasie effektief
       - Skep visuele hiërargie
       - Balanseer teks en grafika
    
    4. **Tipografie**: Gebruik verskillende font groottes
       - Groot, vet hoofopskrif
       - Medium sub-opskrifte
       - Klein, leesbare teks
    
    5. **Visuele Elemente**:
       - Gebruik sirkels, ronde hoeke
       - Voeg skaduwees by vir diepte
       - Gebruik ikoniese illustrasies
    
    6. **SVG Spesifikasies**:
       - Viewbox: 0 0 800 600
       - Responsive design
       - Skoon, geoptimeerde kode
    
    ✅ GOEIE VOORBEELDE:
    - Moderne infographics met gradients
    - Kleurvolle mind maps
    - Visuele timelines
    - Illustratiewe diagramme
    
    ❌ VERMY:
    - Plain, basic shapes
    - Swart-en-wit ontwerpe
    - Te veel teks
    - Boring layouts
    
    Gee SLEGS die SVG kode terug (geen verduideliking nie).
    `;
    userMessage = `Skep 'n pragtige, kleurvolle SVG infographic vir hierdie inhoud:\n\n${context.substring(0, 4000)}`;
    temperature = 0.7; // Hoër vir meer kreatiwiteit
}
```

---

### Stap 2: Skep Visualisering Trigger

Die visualisering moet outomaties geskep word wanneer:
1. Die AI 'n antwoord gee
2. Die kind 'n vraag vra

**Implementasie:**
- Voeg 'n "Skep Visualisering" knoppie by elke AI antwoord
- Stoor visualiserings in database
- Wys galery van visualiserings

---

### Stap 3: Skep Visualisering Component

**Lêer:** `src/components/nhka/VisualisationGallery.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Sparkles } from 'lucide-react';

interface Visualisation {
  id: string;
  svg: string;
  prompt: string;
  created_at: string;
}

interface VisualisationGalleryProps {
  visualisations: Visualisation[];
  onShare: (vis: Visualisation) => void;
}

const VisualisationGallery: React.FC<VisualisationGalleryProps> = ({ 
  visualisations, 
  onShare 
}) => {
  const handleDownload = (vis: Visualisation) => {
    const blob = new Blob([vis.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualisering-${vis.id}.svg`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visualisations.map((vis) => (
        <Card key={vis.id} className="p-4">
          <div 
            className="w-full h-48 mb-3 rounded-lg overflow-hidden border-2 border-gray-200"
            dangerouslySetInnerHTML={{ __html: vis.svg }}
          />
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {vis.prompt}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(vis)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-1" />
              Laai Af
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShare(vis)}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Deel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default VisualisationGallery;
```

---

### Stap 4: Integreer in Geloofsonderrig

**Lêer:** `src/components/nhka/Geloofsonderrig.tsx`

**4.1 Voeg State By:**
```typescript
// Visualisation State
const [generatingVisualisation, setGeneratingVisualisation] = useState(false);
const [currentVisualisations, setCurrentVisualisations] = useState<any[]>([]);
const [showVisualisationGallery, setShowVisualisationGallery] = useState(false);
```

**4.2 Skep generateVisualisation Funksie:**
```typescript
const generateVisualisation = async (content: string, prompt: string) => {
  setGeneratingVisualisation(true);
  try {
    const result = await invokeAIWithRetry('infographic', {
      lesInhoud: content,
      prompt: prompt,
      lesId: selectedLes?.id,
      leerderId: currentUser?.id
    });

    if (result?.success && result?.data?.svg) {
      const newVis = {
        id: Date.now().toString(),
        svg: result.data.svg,
        prompt: prompt,
        created_at: new Date().toISOString()
      };
      
      setCurrentVisualisations([...currentVisualisations, newVis]);
      setVisualiseringCount(visualiseringCount + 1);
      
      toast({
        title: 'Visualisering Geskep!',
        description: 'Jou mooi grafika is gereed.',
      });
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

**4.3 Voeg "Skep Visualisering" Knoppie by AI Antwoorde:**

In die chat message rendering, voeg by:
```typescript
{message.role === 'assistant' && (
  <Button
    size="sm"
    variant="ghost"
    onClick={() => generateVisualisation(message.content, message.content)}
    disabled={generatingVisualisation}
  >
    <Sparkles className="w-4 h-4 mr-1" />
    Skep Visualisering
  </Button>
)}
```

---

### Stap 5: Wys Visualisering Galery

Voeg 'n tab of section by om alle visualiserings te wys:

```typescript
{showVisualisationGallery && (
  <Dialog open={showVisualisationGallery} onOpenChange={setShowVisualisationGallery}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Jou Visualiserings 🎨</DialogTitle>
      </DialogHeader>
      <VisualisationGallery
        visualisations={currentVisualisations}
        onShare={(vis) => {
          // Share logic
        }}
      />
    </DialogContent>
  </Dialog>
)}
```

---

## 🎨 Voorbeeld Visualisering:

Die AI sal iets soos hierdie genereer:

```svg
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient Background -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.1" />
    </linearGradient>
  </defs>
  
  <rect width="800" height="600" fill="url(#bg)"/>
  
  <!-- Main Title -->
  <text x="400" y="80" text-anchor="middle" 
        font-size="48" font-weight="bold" fill="#2d3748">
    Jesus se Liefde ❤️
  </text>
  
  <!-- Circles with Icons -->
  <circle cx="200" cy="300" r="80" fill="#667eea" opacity="0.2"/>
  <text x="200" y="310" text-anchor="middle" font-size="60">🙏</text>
  
  <circle cx="400" cy="300" r="80" fill="#f093fb" opacity="0.2"/>
  <text x="400" y="310" text-anchor="middle" font-size="60">❤️</text>
  
  <circle cx="600" cy="300" r="80" fill="#4facfe" opacity="0.2"/>
  <text x="600" y="310" text-anchor="middle" font-size="60">✨</text>
  
  <!-- Labels -->
  <text x="200" y="420" text-anchor="middle" font-size="24" fill="#4a5568">
    Bid
  </text>
  <text x="400" y="420" text-anchor="middle" font-size="24" fill="#4a5568">
    Liefde
  </text>
  <text x="600" y="420" text-anchor="middle" font-size="24" fill="#4a5568">
    Geloof
  </text>
</svg>
```

---

## 📊 Tyd Skatting:

**Totaal:** ~6-8 uur

**Breakdown:**
1. Edge Function update: 1 uur
2. VisualisationGallery component: 2 uur
3. Integration in Geloofsonderrig: 2 uur
4. Testing & refinement: 2 uur
5. UI polish: 1 uur

---

## 🎯 Volgende Stappe:

**Opsie A:** Ek implementeer alles nou (6-8 uur)  
**Opsie B:** Ek skep net die basis, jy verfyn later  
**Opsie C:** Ons skip visualiserings en gaan na Fase 4 (Rewards)

Laat my weet! 🚀
