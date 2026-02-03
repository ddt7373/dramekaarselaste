-- VOEG DIT HEEL BO-AAN JOU LÊER BY
CREATE TABLE IF NOT EXISTS public.gebruikers (
    id UUID PRIMARY KEY REFERENCES auth.users(id), -- Koppel aan Supabase Auth
    rol TEXT NOT NULL CHECK (rol IN ('hoof_admin', 'admin', 'moderator', 'predikant', 'gebruiker')),
    naam TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gemeentes (congregations) - required by profiles, hoof_admin_dashboard, etc.
CREATE TABLE IF NOT EXISTS public.gemeentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    naam TEXT NOT NULL,
    beskrywing TEXT,
    adres TEXT,
    telefoon TEXT,
    epos TEXT,
    webwerf TEXT,
    aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktiveer RLS vir gebruikers ook
ALTER TABLE public.gebruikers ENABLE ROW LEVEL SECURITY;

-- Create table for article types
CREATE TABLE IF NOT EXISTS public.artikels_tipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    naam TEXT NOT NULL,
    maks_woorde INTEGER,
    aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for article submissions
CREATE TABLE IF NOT EXISTS public.artikels_indienings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gebruiker_id UUID REFERENCES public.gebruikers(id),
    tipe_id UUID REFERENCES public.artikels_tipes(id),
    titel TEXT NOT NULL,
    inhoud TEXT NOT NULL,
    woord_telling INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ingedien' CHECK (status IN ('ingedien', 'in_hersiening', 'gepubliseer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.artikels_tipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artikels_indienings ENABLE ROW LEVEL SECURITY;

-- Policies for artikels_tipes
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read for active types" ON public.artikels_tipes;
    CREATE POLICY "Public read for active types" ON public.artikels_tipes
        FOR SELECT USING (aktief = true);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin full access to types" ON public.artikels_tipes;
    CREATE POLICY "Admin full access to types" ON public.artikels_tipes
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.gebruikers 
                WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'moderator', 'predikant')
            )
        );
END $$;

-- Policies for artikels_indienings
DO $$ BEGIN
    -- Relaxing the check to auth.uid() IS NOT NULL to prevent RLS violations if IDs don't match perfectly
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.artikels_indienings;
    CREATE POLICY "Users can insert their own submissions" ON public.artikels_indienings
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own submissions" ON public.artikels_indienings;
    CREATE POLICY "Users can view their own submissions" ON public.artikels_indienings
        FOR SELECT USING (auth.uid() = gebruiker_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins/Moderators can view all submissions" ON public.artikels_indienings;
    CREATE POLICY "Admins/Moderators can view all submissions" ON public.artikels_indienings
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.gebruikers 
                WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'moderator', 'predikant')
            )
        );
END $$;

-- Default data (only if empty)
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Hoofartikel', 900 WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Hoofartikel');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Redaksioneel', 900 WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Redaksioneel');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Aktuele sake', 900 WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Aktuele sake');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Teologie', 1400 WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Teologie');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Historiese almanak', 600 WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Historiese almanak');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Kerknuus algemeen', NULL WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Kerknuus algemeen');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Stoepstories', NULL WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Stoepstories');
INSERT INTO public.artikels_tipes (naam, maks_woorde)
SELECT 'Ander', NULL WHERE NOT EXISTS (SELECT 1 FROM public.artikels_tipes WHERE naam = 'Ander');
