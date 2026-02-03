-- Jy Is Myne foto's storage bucket vir joernaal-inskrywings
INSERT INTO storage.buckets (id, name, public)
VALUES ('jy-is-myne-fotos', 'jy-is-myne-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: permissief vir joernaal-foto's (soos jy_is_myne_journal tabel)
DROP POLICY IF EXISTS "Public read jy-is-myne-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload jy-is-myne-fotos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all jy-is-myne-fotos" ON storage.objects;
CREATE POLICY "Allow all jy-is-myne-fotos" ON storage.objects FOR ALL
  USING (bucket_id = 'jy-is-myne-fotos') WITH CHECK (bucket_id = 'jy-is-myne-fotos');
