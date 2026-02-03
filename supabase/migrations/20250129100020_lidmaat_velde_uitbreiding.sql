-- =============================================================================
-- LIDMATE/GEBRUIKERS VELDE UITBREIDING
-- =============================================================================
-- Voeg alle benodigde velde by vir lidmate/gebruikers volgens CSV bulk upload
-- spesifikasie. Ondersteun meervoudige rolle (app_roles).
-- =============================================================================

-- Persoonlike inligting
ALTER TABLE public.gebruikers
  ADD COLUMN IF NOT EXISTS geslag TEXT CHECK (geslag IN ('man', 'vrou', 'ander')),
  ADD COLUMN IF NOT EXISTS titel TEXT,
  ADD COLUMN IF NOT EXISTS nooiensvan TEXT,
  ADD COLUMN IF NOT EXISTS voornaam_1 TEXT,
  ADD COLUMN IF NOT EXISTS voornaam_2 TEXT,
  ADD COLUMN IF NOT EXISTS voornaam_3 TEXT,
  ADD COLUMN IF NOT EXISTS noemnaam TEXT;

-- Kontak (selfoon word na +xx formaat omskakel by import)
ALTER TABLE public.gebruikers
  ADD COLUMN IF NOT EXISTS landlyn TEXT,
  ADD COLUMN IF NOT EXISTS epos_2 TEXT;

-- Datums
ALTER TABLE public.gebruikers
  ADD COLUMN IF NOT EXISTS doop_datum DATE,
  ADD COLUMN IF NOT EXISTS belydenis_van_geloof_datum DATE;
-- sterf_datum: gebruik bestaande datum_oorlede of voeg by
ALTER TABLE public.gebruikers ADD COLUMN IF NOT EXISTS sterf_datum DATE;

-- Adres (gedetailleerd)
ALTER TABLE public.gebruikers
  ADD COLUMN IF NOT EXISTS straat_naam TEXT,
  ADD COLUMN IF NOT EXISTS adres TEXT,
  ADD COLUMN IF NOT EXISTS straat_nommer TEXT,
  ADD COLUMN IF NOT EXISTS woonkompleks_naam TEXT,
  ADD COLUMN IF NOT EXISTS woonkompleks_nommer TEXT,
  ADD COLUMN IF NOT EXISTS voorstad TEXT,
  ADD COLUMN IF NOT EXISTS stad_dorp TEXT,
  ADD COLUMN IF NOT EXISTS poskode TEXT;

-- Rolle en portefeuljes (meervoudige rolle)
ALTER TABLE public.gebruikers
  ADD COLUMN IF NOT EXISTS app_roles TEXT[] DEFAULT ARRAY['lidmaat']::TEXT[],
  ADD COLUMN IF NOT EXISTS portefeulje_1 TEXT,
  ADD COLUMN IF NOT EXISTS portefeulje_2 TEXT,
  ADD COLUMN IF NOT EXISTS portefeulje_3 TEXT;

-- Migreer bestaande rol na app_roles indien app_roles leeg is
UPDATE public.gebruikers
SET app_roles = ARRAY[rol]::TEXT[]
WHERE (app_roles IS NULL OR array_length(app_roles, 1) IS NULL)
  AND rol IS NOT NULL;

-- Ouderdom (outomaties bereken uit geboortedatum)
ALTER TABLE public.gebruikers ADD COLUMN IF NOT EXISTS geboortedatum DATE;
ALTER TABLE public.gebruikers ADD COLUMN IF NOT EXISTS ouderdom INTEGER;

-- Triggerfunksie: bereken ouderdom by INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.set_ouderdom_from_geboortedatum()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geboortedatum IS NOT NULL THEN
    NEW.ouderdom := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.geboortedatum))::INTEGER;
  ELSE
    NEW.ouderdom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: voer berekening uit by insert of update (slegs as geboortedatum bestaan)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gebruikers' AND column_name = 'geboortedatum') THEN
    DROP TRIGGER IF EXISTS tr_set_ouderdom ON public.gebruikers;
    CREATE TRIGGER tr_set_ouderdom
      BEFORE INSERT OR UPDATE OF geboortedatum ON public.gebruikers
      FOR EACH ROW EXECUTE FUNCTION public.set_ouderdom_from_geboortedatum();
  END IF;
END $$;

-- Vul ouderdom vir bestaande rye (slegs as kolomme bestaan)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gebruikers' AND column_name = 'geboortedatum') THEN
    UPDATE public.gebruikers
    SET ouderdom = EXTRACT(YEAR FROM AGE(CURRENT_DATE, geboortedatum))::INTEGER
    WHERE geboortedatum IS NOT NULL AND (ouderdom IS NULL OR ouderdom != EXTRACT(YEAR FROM AGE(CURRENT_DATE, geboortedatum))::INTEGER);
  END IF;
END $$;

-- Indeks vir soektog
CREATE INDEX IF NOT EXISTS idx_gebruikers_app_roles ON public.gebruikers USING GIN(app_roles);
CREATE INDEX IF NOT EXISTS idx_gebruikers_voorstad ON public.gebruikers(voorstad);
CREATE INDEX IF NOT EXISTS idx_gebruikers_poskode ON public.gebruikers(poskode);
CREATE INDEX IF NOT EXISTS idx_gebruikers_ouderdom ON public.gebruikers(ouderdom);
