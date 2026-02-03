# 🎯 Geloofsonderrig Verbeterings - Implementasieplan

## ✅ Status: AI "Gids" Persona Werk!

---

## 📋 Nuwe Verbeterings (9 Items)

### 1. ⭐ Progress Bar vir Vordering
**Beskrywing:** Visuele progress bar wat wys hoeveel van die les voltooi is.

**Implementasie:**
- [ ] Voeg progress bar component by
- [ ] Bereken persentasie gebaseer op:
  - Vrae beantwoord (10 multikeuse)
  - Bybelverse voltooi (5 rondtes)
  - AI interaksies (minimum 10)
  - Visualiserings geskep (minimum 1)

**Kompleksiteit:** 🟢 Maklik (2-3 uur)

---

### 2. ⭐⭐⭐ 10 Multikeuse Kontrole Vrae (AI-gegenereer)
**Beskrywing:** AI genereer 10 multikeuse vrae gebaseer op lesinhoud, random aangebied.

**Implementasie:**
- [ ] Update Edge Function om quiz vrae te genereer
- [ ] Skep quiz component
- [ ] Random volgorde vir vrae
- [ ] Telling uit 10 stoor in database
- [ ] Visuele feedback (korrek/verkeerd)

**AI Prompt Vereistes:**
- Geskik vir kinders 12-17 jaar
- 4 opsies per vraag
- 1 korrekte antwoord
- Fokus op begrip, nie net feite nie

**Kompleksiteit:** 🟡 Medium (4-6 uur)

---

### 3. ⭐ Fix "Vrae" Telling (3/10 → 3/3)
**Beskrywing:** Verander die telling van vrae van uit 10 na uit 3.

**Implementasie:**
- [ ] Soek waar "vrae" telling bereken word
- [ ] Verander maksimum van 10 na 3
- [ ] Update UI om korrek te wys

**Kompleksiteit:** 🟢 Maklik (30 min)

---

### 4. ⭐⭐⭐ Bybelverse met Ontbrekende Woorde (5 Rondtes)
**Beskrywing:** Soos "Bybelkennis" funksie - verse met ontbrekende woorde, 5 rondtes.

**Implementasie:**
- [ ] AI extraheer bybelverse uit lesinhoud
- [ ] Skep "fill-in-the-blank" component (hergebruik Bybelkennis logika)
- [ ] 5 rondtes met verskillende ontbrekende woorde
- [ ] Stoor vordering in database

**Kompleksiteit:** 🟡 Medium (5-7 uur)

---

### 5. ⭐⭐⭐ Visualiserings/Infographics (AI-gegenereer)
**Beskrywing:** Skep mooi grafika gebaseer op AI antwoorde of kind se vrae.

**Implementasie:**
- [ ] Update Edge Function om infographic SVG te genereer
- [ ] Skep visualisering component
- [ ] "Skep Visualisering" knoppie by elke AI antwoord
- [ ] Stoor visualiserings in database
- [ ] Galery van visualiserings

**AI Vereistes:**
- Modern, kleurvolle design
- Geskik vir kinders
- SVG formaat (skaleerbaar)
- Gebruik emojis en ikone

**Kompleksiteit:** 🔴 Moeilik (8-10 uur)

---

### 6. ⭐ Verbeter Layout (Volskerm)
**Beskrywing:** Geloofsonderrig gebruik tans net helfte van bladsy - maak dit volskerm.

**Implementasie:**
- [ ] Soek layout constraints
- [ ] Verander CSS om volskerm te gebruik
- [ ] Responsive design vir mobiel

**Kompleksiteit:** 🟢 Maklik (1-2 uur)

---

### 7. ⭐⭐ KGVW Analise vir Alle Interaksies
**Beskrywing:** Maak seker ALLE interaksies word geanaliseer (nie net chat nie).

**Implementasie:**
- [ ] Kontroleer dat quiz antwoorde geanaliseer word
- [ ] Kontroleer dat bybelvers antwoorde geanaliseer word
- [ ] Kontroleer dat visualisering versoeke geanaliseer word
- [ ] Update database logs

**Kompleksiteit:** 🟡 Medium (3-4 uur)

---

### 8. ⭐⭐⭐⭐ "Beloning" Video na Voltooiing
**Beskrywing:** Skep 'n video/animasie wat alle interaksies, resultate, en prestasies wys.

**Implementasie:**
- [ ] Skep "completion summary" data struktuur
- [ ] Ontwerp video/animasie template
- [ ] Gebruik Canvas API of video library
- [ ] Wys:
  - Totale vrae beantwoord
  - KGVW scores
  - Visualiserings geskep
  - Bybelverse geleer
  - Punte verdien
- [ ] Download/deel funksionaliteit

**Kompleksiteit:** 🔴 Moeilik (10-12 uur)

---

### 9. ⭐⭐⭐⭐ Reward Stelsel + Kerk-wye Leaderboard
**Beskrywing:** Punte stelsel met anonieme leaderboard (slegs posisie vir kinders, name vir admin).

**Implementasie:**

#### Database:
- [ ] Skep `geloofsonderrig_punte` tabel
- [ ] Skep `geloofsonderrig_leaderboard` view

#### Punte Stelsel:
- [ ] Quiz vraag korrek: 10 punte
- [ ] Bybelvers korrek: 5 punte
- [ ] AI interaksie: 2 punte
- [ ] Visualisering geskep: 15 punte
- [ ] Les voltooi: 50 punte bonus

#### Leaderboard:
- [ ] Kinders sien slegs hulle eie posisie (bv. "Jy is #12 van 45")
- [ ] Hoof admin sien volle leaderboard met name
- [ ] Filter per gemeente/klas
- [ ] Weeklikse/maandelikse/algehele ranglys

#### UI:
- [ ] Punte teller in header
- [ ] Animasie wanneer punte verdien word
- [ ] Badges/achievements vir mylpale
- [ ] Leaderboard bladsy

**Kompleksiteit:** 🔴🔴 Baie Moeilik (15-20 uur)

---

## 📊 Prioriteit en Volgorde

### **Fase 1: Basis Funksionaliteit (Week 1)**
1. ✅ Fix "Vrae" telling (3/3) - 30 min
2. ✅ Verbeter layout (volskerm) - 2 uur
3. ✅ Progress bar - 3 uur
4. ✅ KGVW analise vir alle interaksies - 4 uur

**Totaal:** ~10 uur

---

### **Fase 2: Leer Komponente (Week 2)**
5. ✅ 10 Multikeuse vrae - 6 uur
6. ✅ Bybelverse met ontbrekende woorde - 7 uur

**Totaal:** ~13 uur

---

### **Fase 3: Visuele Verbetering (Week 3)**
7. ✅ Visualiserings/Infographics - 10 uur

**Totaal:** ~10 uur

---

### **Fase 4: Gamification (Week 4)**
8. ✅ Reward stelsel + Leaderboard - 20 uur
9. ✅ Beloning video - 12 uur

**Totaal:** ~32 uur

---

## 🎯 Aanbeveling: Begin met Fase 1

**Rede:**
- Vinnige wins
- Verbeter gebruikerservaring onmiddellik
- Bou fondament vir latere fases

**Volgende Stap:**
Wil jy hê ek moet begin met **Fase 1** (die 4 maklikste items)?

Of wil jy 'n spesifieke item eerste aanpak?

---

## 📝 Tegniese Notas

### Database Skema Veranderinge Nodig:
```sql
-- Vir Fase 2: Quiz
ALTER TABLE geloofsonderrig_vordering 
ADD COLUMN quiz_score INTEGER DEFAULT 0,
ADD COLUMN quiz_total INTEGER DEFAULT 10;

-- Vir Fase 2: Bybelverse
ALTER TABLE geloofsonderrig_vordering
ADD COLUMN verse_completed INTEGER DEFAULT 0,
ADD COLUMN verse_total INTEGER DEFAULT 5;

-- Vir Fase 4: Punte
CREATE TABLE geloofsonderrig_punte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leerder_id UUID REFERENCES gebruikers(id),
  les_id UUID REFERENCES geloofsonderrig_lesse(id),
  punte INTEGER NOT NULL,
  rede TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_punte_leerder ON geloofsonderrig_punte(leerder_id);
CREATE INDEX idx_punte_les ON geloofsonderrig_punte(les_id);
```

### Edge Function Updates Nodig:
- Quiz generation (type: 'quiz')
- Verse extraction (type: 'verses')
- Infographic generation (type: 'infographic')
- KGVW analysis vir alle tipes

---

## ✨ Verwagde Eindresultaat

'n Volledige, interaktiewe geloofsonderrig ervaring met:
- ✅ Gespreksmatige AI mentor ("Gids")
- ✅ Visuele vordering tracking
- ✅ Multikeuse vrae (10)
- ✅ Bybelvers oefeninge (5 rondtes)
- ✅ Mooi visualiserings
- ✅ Punte en leaderboard
- ✅ Beloning video
- ✅ Volledige KGVW analise

**Totale Tyd:** ~65 uur (±2-3 weke vir 1 ontwikkelaar)
