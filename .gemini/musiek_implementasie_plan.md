# Kerkliedere Musiek - Implementasieplan

## Oorsig
'n Funksie waar die hoofadmin kerkliedere (PPT/PPTX/PDF bladmusiek) kan oplaai,
lirieke kan verskaf, en AI-gegenereerde musiek kan skep. Gepubliseerde liedere
word deur alle gebruikers geluister via 'n "Musiek" navigasie-item.

## Databasis

### Tabel: `musiek_liedere`
| Kolomme | Tipe | Beskrywing |
|---------|------|------------|
| id | uuid PK | |
| titel | text NOT NULL | Lied titel |
| lirieke | text | Lirieke teks |
| bladmusiek_url | text | Storage pad na oorspronklike PPT/PDF |
| oudio_url | text | Storage pad na gegenereerde MP3 |
| styl_prompt | text | bv. "Koormusiek, stadig, orrel" |
| tempo | integer | BPM |
| status | text | 'konsep' / 'genereer' / 'gereed' / 'gepubliseer' / 'fout' |
| ai_diens | text | 'suno' / 'replicate' |
| suno_taak_id | text | Suno API taak ID |
| replicate_taak_id | text | Replicate voorspelling ID  |
| fout_boodskap | text | |
| opgelaai_deur | uuid FK → gebruikers.id | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Storage Bucket: `musiek-liedere`
- Oorspronklike PPT/PDF/PPTX lêers
- Gegenereerde MP3/WAV oudio

## Edge Functions

### `musiek-ai` (nuwe funksie)
- `type: 'genereer_suno'` → Stuur lirieke + styl prompt na Suno API
- `type: 'genereer_replicate'` → Stuur na Replicate (MusicGen)
- `type: 'kyk_status'` → Polling vir Suno/Replicate voltooiing

## Frontend Komponente

### 1. Admin: `MusiekAdmin.tsx` (in HoofAdminDashboard)
- Laai PPT/PPTX/PDF op
- Tik/plak lirieke
- Kies styl (dropdown + vrye teks)
- Kies tempo (slider)
- Kies AI diens (Suno / MusicGen)
- Genereer knoppie
- Voorbeeldluister (audio speler)
- Publiseer / Skrap knoppies
- Lys alle liedere met status

### 2. Publiek: `Musiek.tsx` (nuwe navigasie-item)
- Lys gepubliseerde liedere
- Soek funksie
- Audio speler met beheerknoppies
- Lirieke vertoon

## Integrasie Punte
1. `nhka.ts` → voeg `'musiek'` by AppView
2. `Sidebar.tsx` → voeg Musiek navigasie-item by
3. `AppLayout.tsx` → voeg `case 'musiek'` by
4. `HoofAdminDashboard.tsx` → voeg Musiek Admin tab by

## API Sleutels Benodig
- `SUNO_API_KEY` (Supabase Edge Function secrets)
- `REPLICATE_API_TOKEN` (Supabase Edge Function secrets)
