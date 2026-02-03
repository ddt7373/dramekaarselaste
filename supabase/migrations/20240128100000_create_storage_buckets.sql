-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vbo-bewyse', 'vbo-bewyse', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profile-pics', 'user-profile-pics', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gemeente-logos', 'gemeente-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gemeente-dokumente', 'gemeente-dokumente', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lms-content', 'lms-content', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for vbo-bewyse
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'vbo-bewyse');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'vbo-bewyse' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Delete Own Evidence" ON storage.objects;
CREATE POLICY "Delete Own Evidence" ON storage.objects FOR DELETE USING (
  bucket_id = 'vbo-bewyse' AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Note: The policies for other buckets should ideally be more granular, 
-- but this ensures they exist and are usable for now.
