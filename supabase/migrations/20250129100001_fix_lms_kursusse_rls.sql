-- Fix lms_kursusse RLS policies
-- The app uses custom auth (gebruikers table) that doesn't establish a Supabase session.
-- Only run when lms_kursusse exists; safe for shadow DB.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_kursusse') THEN
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Public Read Kursusse" ON public.lms_kursusse;
  DROP POLICY IF EXISTS "Admin All Kursusse" ON public.lms_kursusse;
  DROP POLICY IF EXISTS "Allow anon read lms_kursusse" ON public.lms_kursusse;
  DROP POLICY IF EXISTS "Allow anon insert lms_kursusse" ON public.lms_kursusse;
  DROP POLICY IF EXISTS "Allow anon update lms_kursusse" ON public.lms_kursusse;
  DROP POLICY IF EXISTS "Allow anon delete lms_kursusse" ON public.lms_kursusse;
  CREATE POLICY "Public Read Kursusse" ON public.lms_kursusse FOR SELECT USING (true);
  CREATE POLICY "Admin All Kursusse" ON public.lms_kursusse FOR ALL USING (true) WITH CHECK (true);
END $$;
