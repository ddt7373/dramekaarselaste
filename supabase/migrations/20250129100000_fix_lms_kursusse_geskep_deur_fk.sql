-- Fix geskep_deur foreign key: app uses public.gebruikers, not auth.users
-- The lms_kursusse.geskep_deur column referenced auth.users(id), but the app
-- stores currentUser.id from the gebruikers table (custom auth).
-- Only run when lms_kursusse exists (e.g. from LMS setup); safe for shadow DB.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_kursusse') THEN
    RETURN;
  END IF;
  ALTER TABLE public.lms_kursusse
    DROP CONSTRAINT IF EXISTS lms_kursusse_geskep_deur_fkey;
  ALTER TABLE public.lms_kursusse
    ADD CONSTRAINT lms_kursusse_geskep_deur_fkey
    FOREIGN KEY (geskep_deur) REFERENCES public.gebruikers(id)
    ON DELETE SET NULL;
END $$;
