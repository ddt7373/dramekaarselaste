-- Seed sample/example data across the app
-- Uses Demo Gemeente ID: 7789c1c7-4087-43b1-a07f-43614a5d176e

-- =============================================================================
-- JY IS MYNE / SAKRAMENTSBELOFTES - Phase content (phases 1-8)
-- =============================================================================
INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (1, 'Voorgeboorte', 'Swangerskap', 'Bid vir die ongebore kind', 'Voorbereiding vir die sakramente', ARRAY['Bind met jou baba deur te praat en sing', 'Lees Bybelverhale hardop'], 'Water en lig as simbole van lewe', 'Deel in erediens wanneer moontlik', ARRAY['Wat beteken doop vir ons?', 'Hoe sal ons kind God leer ken?'], ARRAY['Skep gebedsruimte in die huis', 'Kies peetouers'], ARRAY['Bid daagliks vir jou kind', 'Lees Psalm 139'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (2, 'Eerste Jaar', '0-1 jaar', 'Doopviering en betekenis', 'Nagmaal as familie-gebeure', ARRAY['Woon erediens by met baba', 'Bid by bedtyd'], 'Doopwater, kaars, wit kleed', 'Baba in erediens - eerste ervarings', ARRAY['Vertel van jou kind se doop', 'Wat beteken die peetouers?'], ARRAY['Neem foto''s by erediens', 'Begin gebedsritueel'], ARRAY['Wees geduldig met jouself', 'Vra om hulp'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (3, 'Peuter', '1-3 jaar', 'Herinner aan doop deur stories', 'Nagmaal as "Jesus se tafel"', ARRAY['Eenvoudige Bybelstories', 'Sing kerkliedere saam'], 'Brood en wyn as geskenke', 'Peuter-vriendelike momente in erediens', ARRAY['Wie is Jesus?', 'Wat gebeur by die kerk?'], ARRAY['Maak ''n Bybelstorie-boek', 'Gebedsritueel by ete'], ARRAY['Geniet die klein oomblikke', 'Wees konsekwent'])
ON CONFLICT (phase) DO NOTHING;

-- Phases 4-8 (abbreviated for migration - can expand)
INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (4, 'Voorskool', '3-6 jaar', 'Doop as God se ja-woord', 'Nagmaal as dankbaarheid', ARRAY['Memoriseer kort verse', 'Deel in kindermoment'], 'Simboliek van water, brood, wyn', 'Aktiewe deelname in erediens', ARRAY['Wat is doop?', 'Hoekom gaan ons kerk toe?'], ARRAY['Bybelverhaal tyd', 'Gebed by ete'], ARRAY['Antwoord eerlik op vrae', 'Model geloof'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (5, 'Junior Laerskool', '6-10 jaar', 'Belydenis van geloof voorbereiding', 'Nagmaal betekenis verdiep', ARRAY['Lees Bybel self', 'Deel in kategese'], 'Verband tussen doop en nagmaal', 'Groei in begrip', ARRAY['Wat beteken belydenis?', 'Hoekom brood en wyn?'], ARRAY['Gesinsbybelstudie', 'Kerkdiens'], ARRAY['Wees oop vir vrae', 'Deel jou geloof'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (6, 'Senior Laerskool', '10-13 jaar', 'Belydenisklas voorbereiding', 'Eerste nagmaal nader', ARRAY['Kritiese denke oor geloof', 'Eie gebedslewe'], 'Volwasse geloof groei', 'Mentorskap', ARRAY['Wat glo ek werklik?', 'Wat beteken nagmaal vir my?'], ARRAY['Gesprekke oor geloof', 'Sertifikaat voorbereiding'], ARRAY['Respekteer groei', 'Wees beskikbaar'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (7, 'Tiener Junior', '13-16 jaar', 'Belydenis van geloof', 'Volwaardige nagmaaldeelname', ARRAY['Eie geloofsbesluit', 'Bediening in kerk'], 'Volwasse sakramentsdeelname', 'Dissipelwees', ARRAY['Wat is my roeping?', 'Hoe dien ek in die kerk?'], ARRAY['Belydenis vier', 'Nagmaal voorbereiding'], ARRAY['Los los met liefde', 'Vertrou op God'])
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.jy_is_myne_phase_content (phase, phase_name, age_range, baptism_focus, communion_focus, development_goals, symbolism, worship_integration, conversation_themes, family_projects, parent_reflections)
VALUES
  (8, 'Tiener Senior', '16-18 jaar', 'Volwasse geloof', 'Nagmaal as sentrum van geloof', ARRAY['Leierskap', 'Eie geloofspad'], 'Volle lidmaatskap', 'Toekoms in kerk', ARRAY['Wat is my plek in die kerk?', 'Hoe leef ek my geloof?'], ARRAY['Mentorskap van jonger kinders', 'Kerkbediening'], ARRAY['Vier die reis', 'Bid vir wysheid'])
ON CONFLICT (phase) DO NOTHING;

-- =============================================================================
-- JY IS MYNE - Toolkit items (sample)
-- =============================================================================
INSERT INTO public.jy_is_myne_toolkit (category, title, content, description, age_groups, sort_order)
SELECT * FROM (VALUES
  ('prayer'::text, 'Gebed vir Baba'::text, 'Here, dankie vir hierdie geskenk. Beskerm en seen hierdie kind. Amen.'::text, 'Eenvoudige gebed vir swanger mamas'::text, ARRAY['0-1', '1-3']::text[], 1::integer),
  ('bible_story'::text, 'Jesus en die kindertjies'::text, 'Jesus het die kindertjies geseën. "Laat die kindertjies na My kom."'::text, 'Markus 10:13-16'::text, ARRAY['1-3', '3-6']::text[], 2::integer),
  ('communion'::text, 'Nagmaal Verklaar'::text, 'Nagmaal is Jesus se tafel. Ons onthou Hom met brood en wyn.'::text, 'Eenvoudige verduideliking'::text, ARRAY['3-6', '6-10']::text[], 3::integer)
) AS v(category, title, content, description, age_groups, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.jy_is_myne_toolkit LIMIT 1);

-- =============================================================================
-- BEDIENINGSBEOEFTES - Sample (only if Demo Gemeente exists)
-- =============================================================================
INSERT INTO public.bedieningsbehoeftes (gemeente_id, gemeente_naam, aanmelder_naam, tipe, beskrywing, datum, tyd, plek, kontaknommer, status)
SELECT 
  '7789c1c7-4087-43b1-a07f-43614a5d176e',
  'DEMO GEMEENTE',
  'Demo Admin',
  'preekbeurt',
  'Voorbeeld behoefte: Ons soek ''n predikant vir Sondag 15 Feb.',
  '2025-02-15',
  '09:00',
  'Demo Kerk',
  '+27000000001',
  'oop'
WHERE EXISTS (SELECT 1 FROM public.gemeentes WHERE id = '7789c1c7-4087-43b1-a07f-43614a5d176e');

-- =============================================================================
-- KUBERKERMIS - Sample products (only if Demo Gemeente exists)
-- =============================================================================
INSERT INTO public.kuberkermis_produkte (gemeente_id, titel, beskrywing, prys, kategorie, voorraad, aktief, is_kaartjie)
SELECT 
  '7789c1c7-4087-43b1-a07f-43614a5d176e',
  'Voorbeeld Koek',
  'Heerlike tuisgebak koek vir die kermis',
  25.00,
  'gebak',
  20,
  true,
  false
WHERE EXISTS (SELECT 1 FROM public.gemeentes WHERE id = '7789c1c7-4087-43b1-a07f-43614a5d176e');

INSERT INTO public.kuberkermis_produkte (gemeente_id, titel, beskrywing, prys, kategorie, voorraad, aktief, is_kaartjie)
SELECT 
  '7789c1c7-4087-43b1-a07f-43614a5d176e',
  'Kermis Kaartjie',
  'Toegang tot die kermis',
  50.00,
  'kaartjies',
  100,
  true,
  true
WHERE EXISTS (SELECT 1 FROM public.gemeentes WHERE id = '7789c1c7-4087-43b1-a07f-43614a5d176e');
