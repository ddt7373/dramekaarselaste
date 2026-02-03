-- Create 'vbo-bewyse' bucket and policies
-- Run this in Supabase SQL Editor

-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vbo-bewyse', 'vbo-bewyse', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on objects (just to be safe, though usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'vbo-bewyse'

-- Allow public access to view files (since the bucket is public)
CREATE POLICY "Public Access View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vbo-bewyse' );

-- Allow authenticated users (predikante) to upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vbo-bewyse' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own files (optional but good practice)
CREATE POLICY "Users Update Own"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'vbo-bewyse' AND auth.uid() = owner );

CREATE POLICY "Users Delete Own"
ON storage.objects FOR DELETE
USING ( bucket_id = 'vbo-bewyse' AND auth.uid() = owner );
