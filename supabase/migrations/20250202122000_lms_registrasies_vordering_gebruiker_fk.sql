-- =============================================================================
-- LMS: Fix gebruiker_id FK - app uses public.gebruikers, not auth.users
-- =============================================================================
-- Only run when tables exist; safe for shadow DB.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_registrasies') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_registrasies DROP CONSTRAINT IF EXISTS lms_registrasies_gebruiker_id_fkey;
  ALTER TABLE public.lms_registrasies
    ADD CONSTRAINT lms_registrasies_gebruiker_id_fkey
    FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_vordering') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_vordering DROP CONSTRAINT IF EXISTS lms_vordering_gebruiker_id_fkey;
  ALTER TABLE public.lms_vordering
    ADD CONSTRAINT lms_vordering_gebruiker_id_fkey
    FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE;
END $$;
