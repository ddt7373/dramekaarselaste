-- Jy Is Myne / Sakramentsbeloftes: jy_is_myne_children (create if missing, permissive RLS for custom auth)
CREATE TABLE IF NOT EXISTS public.jy_is_myne_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  gemeente_id uuid,
  name text NOT NULL,
  birth_date date,
  expected_date date,
  baptism_date date,
  phase integer NOT NULL DEFAULT 1,
  profile_image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jy_is_myne_children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Own Children" ON public.jy_is_myne_children;
DROP POLICY IF EXISTS "Allow all jy_is_myne_children" ON public.jy_is_myne_children;
CREATE POLICY "Allow all jy_is_myne_children" ON public.jy_is_myne_children FOR ALL USING (true) WITH CHECK (true);

-- Jy Is Myne toolkit, phase content, journal (for Sakramentsbeloftes)
CREATE TABLE IF NOT EXISTS public.jy_is_myne_toolkit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  description text,
  age_groups text[] DEFAULT '{}',
  liturgical_season text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jy_is_myne_phase_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase integer UNIQUE NOT NULL,
  phase_name text NOT NULL,
  age_range text NOT NULL,
  baptism_focus text,
  communion_focus text,
  development_goals text[] DEFAULT '{}',
  symbolism text,
  worship_integration text,
  conversation_themes text[] DEFAULT '{}',
  family_projects text[] DEFAULT '{}',
  weekly_activities jsonb DEFAULT '{}',
  monthly_activities jsonb DEFAULT '{}',
  parent_reflections text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jy_is_myne_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  child_id uuid REFERENCES public.jy_is_myne_children(id) ON DELETE CASCADE,
  entry_type text DEFAULT 'reflection',
  title text NOT NULL,
  content text,
  image_url text,
  date date DEFAULT CURRENT_DATE,
  phase integer,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jy_is_myne_toolkit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jy_is_myne_phase_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jy_is_myne_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all jy_is_myne_toolkit" ON public.jy_is_myne_toolkit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all jy_is_myne_phase_content" ON public.jy_is_myne_phase_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all jy_is_myne_journal" ON public.jy_is_myne_journal FOR ALL USING (true) WITH CHECK (true);

-- Bedieningsbehoeftes
CREATE TABLE IF NOT EXISTS public.bedieningsbehoeftes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_id uuid,
  gemeente_naam text,
  aanmelder_id uuid,
  aanmelder_naam text,
  tipe text NOT NULL DEFAULT 'preekbeurt',
  ander_beskrywing text,
  beskrywing text,
  datum text,
  tyd text,
  plek text,
  kontaknommer text,
  status text NOT NULL DEFAULT 'oop',
  vervuller_id uuid,
  vervuller_naam text,
  vervuller_kontaknommer text,
  vervul_datum timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bedieningsbehoeftes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all bedieningsbehoeftes" ON public.bedieningsbehoeftes;
CREATE POLICY "Allow all bedieningsbehoeftes" ON public.bedieningsbehoeftes FOR ALL USING (true) WITH CHECK (true);

-- Bedieningsbehoefte registrasies (for predikant notifications)
CREATE TABLE IF NOT EXISTS public.bedieningsbehoefte_registrasies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predikant_id uuid NOT NULL,
  predikant_naam text,
  predikant_email text,
  gemeente_id uuid,
  gemeente_naam text,
  ontvang_kennisgewings boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bedieningsbehoefte_registrasies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all bedieningsbehoefte_registrasies" ON public.bedieningsbehoefte_registrasies;
CREATE POLICY "Allow all bedieningsbehoefte_registrasies" ON public.bedieningsbehoefte_registrasies FOR ALL USING (true) WITH CHECK (true);

-- Kuberkermis produkte
CREATE TABLE IF NOT EXISTS public.kuberkermis_produkte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_id uuid NOT NULL,
  titel text NOT NULL,
  beskrywing text,
  prys numeric DEFAULT 0,
  kategorie text DEFAULT 'algemeen',
  foto_url text,
  voorraad integer DEFAULT -1,
  aktief boolean DEFAULT true,
  is_kaartjie boolean DEFAULT false,
  geskep_deur uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kuberkermis_produkte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all kuberkermis_produkte" ON public.kuberkermis_produkte;
CREATE POLICY "Allow all kuberkermis_produkte" ON public.kuberkermis_produkte FOR ALL USING (true) WITH CHECK (true);

-- Kuberkermis bestellings
CREATE TABLE IF NOT EXISTS public.kuberkermis_bestellings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_id uuid NOT NULL,
  produk_id uuid REFERENCES public.kuberkermis_produkte(id) ON DELETE SET NULL,
  koper_naam text,
  koper_selfoon text,
  koper_epos text,
  hoeveelheid integer DEFAULT 1,
  totaal_bedrag numeric DEFAULT 0,
  betaal_status text DEFAULT 'hangende',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kuberkermis_bestellings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all kuberkermis_bestellings" ON public.kuberkermis_bestellings;
CREATE POLICY "Allow all kuberkermis_bestellings" ON public.kuberkermis_bestellings FOR ALL USING (true) WITH CHECK (true);

-- Kuberkermis kaartjie nommers
CREATE TABLE IF NOT EXISTS public.kuberkermis_kaartjie_nommers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produk_id uuid REFERENCES public.kuberkermis_produkte(id) ON DELETE CASCADE,
  nommer text NOT NULL,
  bestelling_id uuid REFERENCES public.kuberkermis_bestellings(id) ON DELETE SET NULL,
  is_verkoop boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.kuberkermis_kaartjie_nommers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all kuberkermis_kaartjie_nommers" ON public.kuberkermis_kaartjie_nommers;
CREATE POLICY "Allow all kuberkermis_kaartjie_nommers" ON public.kuberkermis_kaartjie_nommers FOR ALL USING (true) WITH CHECK (true);
