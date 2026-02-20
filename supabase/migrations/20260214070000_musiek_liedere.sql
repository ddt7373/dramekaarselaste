-- =============================================================================
-- MUSIEK LIEDERE: Tabel en Storage vir kerklied-musiekgenerasie
-- =============================================================================

-- Tabel vir musiek liedere
CREATE TABLE IF NOT EXISTS public.musiek_liedere (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titel text NOT NULL,
  lirieke text,
  bladmusiek_pad text,          -- Storage pad na oorspronklike PPT/PDF
  oudio_pad text,               -- Storage pad na gegenereerde oudio
  oudio_url text,               -- Publieke URL na oudio (vir afspeel)
  styl_prompt text,             -- bv. "Koormusiek, stadig, orrel"
  tempo integer DEFAULT 80,     -- BPM
  status text NOT NULL DEFAULT 'konsep'
    CHECK (status IN ('konsep', 'genereer', 'gereed', 'gepubliseer', 'fout')),
  ai_diens text
    CHECK (ai_diens IN ('suno', 'replicate')),
  suno_taak_id text,
  replicate_taak_id text,
  fout_boodskap text,
  opgelaai_deur uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indekse
CREATE INDEX IF NOT EXISTS idx_musiek_liedere_status ON public.musiek_liedere(status);
CREATE INDEX IF NOT EXISTS idx_musiek_liedere_created ON public.musiek_liedere(created_at DESC);

-- RLS
ALTER TABLE public.musiek_liedere ENABLE ROW LEVEL SECURITY;

-- Die app gebruik aangepaste verifikasie (nie Supabase Auth nie),
-- daarom is auth.uid() altyd NULL. Ons maak die RLS eenvoudig:
-- alle geoutentiseerde gebruikers mag lees, en die app self beheer roltoegank.

-- Almal kan gepubliseerde liedere sien
CREATE POLICY "Almal kan gepubliseerde liedere sien"
  ON public.musiek_liedere FOR SELECT
  TO authenticated
  USING (true);

-- Admin kan invoeg (app-vlak rolbeheer hanteer toestemming)
CREATE POLICY "Admin kan invoeg"
  ON public.musiek_liedere FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin kan opdateer
CREATE POLICY "Admin kan opdateer"
  ON public.musiek_liedere FOR UPDATE
  TO authenticated
  USING (true);

-- Admin kan skrap
CREATE POLICY "Admin kan skrap"
  ON public.musiek_liedere FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket vir musiek lêers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'musiek-liedere',
  'musiek-liedere',
  true,
  104857600,  -- 100MB limiet (oudio kan groot wees)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- Storage RLS beleide
CREATE POLICY "Musiek lees vir almal"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'musiek-liedere');

CREATE POLICY "Musiek oplaai vir admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'musiek-liedere');

CREATE POLICY "Musiek skrap vir admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'musiek-liedere');

CREATE POLICY "Musiek opdateer vir admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'musiek-liedere');
