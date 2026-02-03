-- =============================================================================
-- LMS Registrasies & Vordering: Add missing columns for NHKA app
-- =============================================================================
-- Only run when tables exist; safe for shadow DB.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_registrasies') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_registrasies ADD COLUMN IF NOT EXISTS betaling_status text DEFAULT 'gratis';
  ALTER TABLE public.lms_registrasies ADD COLUMN IF NOT EXISTS betaling_bedrag numeric DEFAULT 0;
  ALTER TABLE public.lms_registrasies ADD COLUMN IF NOT EXISTS begin_datum timestamptz DEFAULT NOW();
  UPDATE public.lms_registrasies SET begin_datum = created_at WHERE begin_datum IS NULL AND created_at IS NOT NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_vordering') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_kursusse') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_vordering ADD COLUMN IF NOT EXISTS kursus_id uuid REFERENCES public.lms_kursusse(id) ON DELETE CASCADE;
  ALTER TABLE public.lms_vordering ADD COLUMN IF NOT EXISTS status text DEFAULT 'begin';
  ALTER TABLE public.lms_vordering ADD COLUMN IF NOT EXISTS toets_telling integer;
  ALTER TABLE public.lms_vordering ADD COLUMN IF NOT EXISTS toets_maksimum integer;
  ALTER TABLE public.lms_vordering ADD COLUMN IF NOT EXISTS toets_geslaag boolean;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_lesse')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_modules') THEN
    UPDATE public.lms_vordering v
    SET kursus_id = m.kursus_id
    FROM public.lms_lesse l
    JOIN public.lms_modules m ON m.id = l.module_id
    WHERE v.les_id = l.id AND v.kursus_id IS NULL;
  END IF;
END $$;
