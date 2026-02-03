-- ==============================================================================
-- GELOOFSONDERRIG SCHEMA (Database Storage Version)
-- ==============================================================================
-- Since Supabase Storage Policies are blocked, we use a public table to store files.

-- 1. Create Files Table (Stores Base64 content)
CREATE TABLE IF NOT EXISTS public.geloofsonderrig_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_data TEXT NOT NULL, -- Base64 Encoded Content
    size_bytes BIGINT,
    uploaded_by UUID references public.gebruikers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.geloofsonderrig_files ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Inline Logic - Proven to work)

-- Public Read Access
DROP POLICY IF EXISTS "Public Read Files" ON public.geloofsonderrig_files;
CREATE POLICY "Public Read Files"
ON public.geloofsonderrig_files FOR SELECT
USING (true);

-- Admin Upload Access
DROP POLICY IF EXISTS "Admin Insert Files" ON public.geloofsonderrig_files;
CREATE POLICY "Admin Insert Files"
ON public.geloofsonderrig_files FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.gebruikers 
        WHERE id = auth.uid() 
        AND rol IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'geloofsonderrig_admin')
    )
);

-- Admin Delete Access
DROP POLICY IF EXISTS "Admin Delete Files" ON public.geloofsonderrig_files;
CREATE POLICY "Admin Delete Files"
ON public.geloofsonderrig_files FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.gebruikers 
        WHERE id = auth.uid() 
        AND rol IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'geloofsonderrig_admin')
    )
);

-- ==============================================================================
-- REST OF THE SCHEMA (Grades, Classes, etc.)
-- ==============================================================================

-- Create Grades table
CREATE TABLE IF NOT EXISTS public.geloofsonderrig_grade (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    naam TEXT NOT NULL,
    volgorde INTEGER NOT NULL DEFAULT 0,
    aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies for Grades
ALTER TABLE public.geloofsonderrig_grade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.geloofsonderrig_grade;
CREATE POLICY "Enable read access for all users" ON public.geloofsonderrig_grade FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for admins" ON public.geloofsonderrig_grade;
CREATE POLICY "Enable all access for admins" ON public.geloofsonderrig_grade FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.gebruikers 
        WHERE id = auth.uid() 
        AND rol IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'geloofsonderrig_admin')
    )
);

-- Add grade_id to Klasse (Manual Alternation)
-- If this fails, run it separately
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geloofsonderrig_klasse' AND column_name = 'graad_id') THEN
        ALTER TABLE public.geloofsonderrig_klasse ADD COLUMN graad_id UUID REFERENCES public.geloofsonderrig_grade(id);
    END IF;
END $$;

-- Add grade_id to Onderwerpe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geloofsonderrig_onderwerpe' AND column_name = 'graad_id') THEN
        ALTER TABLE public.geloofsonderrig_onderwerpe ADD COLUMN graad_id UUID REFERENCES public.geloofsonderrig_grade(id);
    END IF;
END $$;

-- Add file columns to Lesse
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geloofsonderrig_lesse' AND column_name = 'file_url') THEN
        ALTER TABLE public.geloofsonderrig_lesse ADD COLUMN file_url TEXT;
        ALTER TABLE public.geloofsonderrig_lesse ADD COLUMN file_type TEXT;
        ALTER TABLE public.geloofsonderrig_lesse ADD COLUMN file_name TEXT;
    END IF;
END $$;
