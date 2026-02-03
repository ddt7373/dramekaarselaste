-- DATA LOSS WARNING: This script drops the existing table.

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing table
DROP TABLE IF EXISTS public.vbo_indienings CASCADE;

-- 3. Create vbo_indienings table
-- CHANGE: Referencing public.gebruikers instead of auth.users to match application logic
CREATE TABLE public.vbo_indienings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    predikant_id UUID NOT NULL REFERENCES public.gebruikers(id) ON DELETE CASCADE,
    aktiwiteit_id UUID NOT NULL,
    aktiwiteit_titel TEXT NOT NULL,
    aktiwiteit_tipe TEXT NOT NULL,
    krediete INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'hangende',
    notas TEXT,
    bewys_url TEXT,
    bewys_naam TEXT,
    jaar INTEGER NOT NULL,
    is_outomaties BOOLEAN DEFAULT false,
    moderator_id UUID REFERENCES public.gebruikers(id) ON DELETE SET NULL,
    moderator_notas TEXT,
    goedgekeur_op TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.vbo_indienings ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Using the 'auth.uid()' function usually returns the ID of the logged in user.
-- IF your app uses custom auth where auth.uid() != gebruikers.id, this might need adjustment.
-- But assuming auth.uid() matches the ID in gebruikers needed for 'own' check:

-- Allow Predikants to view their own
CREATE POLICY "Predikante kan eie indienings sien"
ON public.vbo_indienings FOR SELECT
USING ( auth.uid() = predikant_id );

-- Allow Predikants to insert their own
CREATE POLICY "Predikante kan indien"
ON public.vbo_indienings FOR INSERT
WITH CHECK ( auth.uid() = predikant_id );

-- Allow Moderators to view all
CREATE POLICY "Moderators kan alles sien"
ON public.vbo_indienings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gebruikers 
    WHERE id = auth.uid() 
    AND rol IN ('moderator', 'hoof_admin', 'admin')
  )
);

-- Allow Moderators to update
CREATE POLICY "Moderators kan opdateer"
ON public.vbo_indienings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.gebruikers 
    WHERE id = auth.uid() 
    AND rol IN ('moderator', 'hoof_admin', 'admin')
  )
);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.vbo_indienings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vbo_indienings TO service_role;
