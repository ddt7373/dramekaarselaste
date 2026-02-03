# Implementasie-stappe – Dra Mekaar

Hierdie dokument beskryf hoe om die onlangse veranderinge te implementeer.

---

## 1. Plaaslike toets

```bash
npm run dev
```

- Gaan na http://localhost:8080
- Klik op **Inligting** in die header → `/info.html` oop
- Klik **← Terug** → moet terug na die tuisblad gaan
- Log in en kontroleer die Sidebar (kategorieë toe by aanmelding)
- Geloofsonderrig: voltooi 'n les en kontroleer **Skep Gedig** en **Skep Musiek** by die beloning

---

## 2. Databasis-migrasies (indien nodig)

```bash
npx supabase db push
```

**Migrasies wat toegepas word:**
- `jy-is-myne-fotos` storage bucket (Joernaal foto's)
- Kort & Kragtig voorbeeldlesse (indien `kk_lessons` bestaan)

---

## 3. Geloofsonderrig AI-funksie ontplooi

Die Gedig & Musiek beloning gebruik die `geloofsonderrig-ai` Edge Function:

```bash
npm run supabase:deploy-geloofsonderrig
```

**Vereistes:**
- Supabase CLI ingelog (`npx supabase login`)
- Projek gekoppel (`npx supabase link`)
- `GEMINI_API_KEY` in Supabase Edge Function secrets

---

## 4. Produksie-build

```bash
npm run build
```

Dit skep die `dist/`-gids met:
- `index.html` – hoof-app
- `info.html` – inligtingsblad
- Bundels vir die React-app (insluitend Gedig & Musiek beloning)

---

## 5. Ontplooi na FTP

```bash
node scripts/deploy.js
```

**Vereistes:**
- `.env.deploy` met `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_REMOTE_PATH`
- `dist/` moet bestaan (dus eers `npm run build`)

---

## 6. Vinnige opsomming

| Stap | Opdrag |
|------|--------|
| Toets lokaal | `npm run dev` |
| Databasis | `npx supabase db push` |
| Geloofsonderrig AI | `npm run supabase:deploy-geloofsonderrig` |
| Bou vir produksie | `npm run build` |
| Ontplooi na FTP | `node scripts/deploy.js` |

---

## 7. Menu Bestuur (sys_menu_layouts)

Die dinamiese menu gebruik die `sys_menu_layouts`-tabel.

**Menu opstel:**
1. Log in as admin
2. Gaan na **Administrasie** → **Menu Bestuur**
3. Kies rol (bv. lidmaat, groepleier, admin)
4. Klik **Nuwe Kategorie** vir koppe
5. Sleep items onder kategorieë of kies items en klik **Voeg by**
6. Klik **Stoor Veranderinge**
