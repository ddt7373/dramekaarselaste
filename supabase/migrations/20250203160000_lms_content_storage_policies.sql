-- =============================================================================
-- LMS content bucket: allow public read and upload (vir prente en video's)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lms-content') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lms-content', 'lms-content', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read lms-content" ON storage.objects;
CREATE POLICY "Public read lms-content" ON storage.objects
  FOR SELECT USING (bucket_id = 'lms-content');

DROP POLICY IF EXISTS "Allow upload lms-content" ON storage.objects;
CREATE POLICY "Allow upload lms-content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lms-content');

DROP POLICY IF EXISTS "Allow update lms-content" ON storage.objects;
CREATE POLICY "Allow update lms-content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lms-content');

DROP POLICY IF EXISTS "Allow delete lms-content" ON storage.objects;
CREATE POLICY "Allow delete lms-content" ON storage.objects
  FOR DELETE USING (bucket_id = 'lms-content');
