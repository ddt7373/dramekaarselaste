-- =============================================================================
-- LMS Lesse: Add kursus_id and slaag_persentasie columns
-- =============================================================================
-- Only run when lms_lesse exists; safe for shadow DB.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_lesse') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_kursusse') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_lesse
    ADD COLUMN IF NOT EXISTS kursus_id uuid REFERENCES public.lms_kursusse(id) ON DELETE CASCADE;
  ALTER TABLE public.lms_lesse
    ADD COLUMN IF NOT EXISTS slaag_persentasie integer DEFAULT 70;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_modules') THEN
    UPDATE public.lms_lesse l
    SET kursus_id = m.kursus_id
    FROM public.lms_modules m
    WHERE l.module_id = m.id AND l.kursus_id IS NULL;
  END IF;
END $$;
