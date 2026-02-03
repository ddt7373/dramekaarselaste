-- Fix lms_modules and lms_lesse RLS policies
-- Same issue as lms_kursusse: app uses custom auth, auth.uid() is always null.
-- Only run when tables exist; safe for shadow DB.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_modules') THEN
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Read Modules" ON public.lms_modules;
  DROP POLICY IF EXISTS "Admin All Modules" ON public.lms_modules;
  DROP POLICY IF EXISTS "Allow anon read lms_modules" ON public.lms_modules;
  DROP POLICY IF EXISTS "Allow anon insert lms_modules" ON public.lms_modules;
  DROP POLICY IF EXISTS "Allow anon update lms_modules" ON public.lms_modules;
  DROP POLICY IF EXISTS "Allow anon delete lms_modules" ON public.lms_modules;
  CREATE POLICY "Read Modules" ON public.lms_modules FOR SELECT USING (true);
  CREATE POLICY "Admin All Modules" ON public.lms_modules FOR ALL USING (true) WITH CHECK (true);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lms_modules TO anon, authenticated;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_lesse') THEN
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Read Lesse" ON public.lms_lesse;
  DROP POLICY IF EXISTS "Admin All Lesse" ON public.lms_lesse;
  DROP POLICY IF EXISTS "Allow anon read lms_lesse" ON public.lms_lesse;
  DROP POLICY IF EXISTS "Allow anon insert lms_lesse" ON public.lms_lesse;
  DROP POLICY IF EXISTS "Allow anon update lms_lesse" ON public.lms_lesse;
  DROP POLICY IF EXISTS "Allow anon delete lms_lesse" ON public.lms_lesse;
  CREATE POLICY "Read Lesse" ON public.lms_lesse FOR SELECT USING (true);
  CREATE POLICY "Admin All Lesse" ON public.lms_lesse FOR ALL USING (true) WITH CHECK (true);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lms_lesse TO anon, authenticated;
END $$;
