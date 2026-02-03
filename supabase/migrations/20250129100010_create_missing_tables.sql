-- Create oordrag_versoeke (transfer requests)
CREATE TABLE IF NOT EXISTS public.oordrag_versoeke (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_id uuid REFERENCES public.gemeentes(id),
  lidmaat_id uuid REFERENCES public.gebruikers(id),
  oordrag_tipe text NOT NULL DEFAULT 'gemeente',
  bestemming_gemeente_id uuid REFERENCES public.gemeentes(id),
  bestemming_gemeente_naam text,
  ander_kerk_naam text,
  ander_kerk_adres text,
  rede text,
  status text NOT NULL DEFAULT 'hangende',
  verwerk_deur uuid REFERENCES public.gebruikers(id),
  verwerk_datum timestamptz,
  admin_notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gawes_en_talente (gifts and talents)
CREATE TABLE IF NOT EXISTS public.gawes_en_talente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gebruiker_id uuid NOT NULL REFERENCES public.gebruikers(id),
  gemeente_id uuid REFERENCES public.gemeentes(id),
  titel text NOT NULL,
  beskrywing text,
  is_betaald boolean DEFAULT false,
  is_vrywillig boolean DEFAULT true,
  kontak_metode text,
  aktief boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lms_sertifikate (LMS certificates)
CREATE TABLE IF NOT EXISTS public.lms_sertifikate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gebruiker_id uuid NOT NULL REFERENCES public.gebruikers(id),
  kursus_id uuid,
  kursus_titel text,
  sertifikaat_nommer text UNIQUE,
  voltooiing_datum timestamptz,
  pdf_url text,
  is_geldig boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.oordrag_versoeke ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gawes_en_talente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_sertifikate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all oordrag_versoeke" ON public.oordrag_versoeke FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all gawes_en_talente" ON public.gawes_en_talente FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all lms_sertifikate" ON public.lms_sertifikate FOR ALL USING (true) WITH CHECK (true);
