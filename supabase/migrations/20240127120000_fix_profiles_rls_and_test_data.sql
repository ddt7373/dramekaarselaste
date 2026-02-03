-- 1. Maak seker die profiles tabel het die regte velde
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS titel TEXT,
ADD COLUMN IF NOT EXISTS lidmaat_status TEXT DEFAULT 'aktief',
ADD COLUMN IF NOT EXISTS datum_oorlede TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS datum_verhuis TIMESTAMPTZ;

-- 2. Maak die RLS lus reg vir 'profiles'
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiele is sigbaar vir ingetekende gebruikers" ON public.profiles;
DROP POLICY IF EXISTS "Admins kan profiele wysig" ON public.profiles;

CREATE POLICY "Profiele is sigbaar vir ingetekende gebruikers" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins kan profiele wysig" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.gebruikers
            WHERE id = auth.uid() AND rol IN ('admin', 'hoofadmin')
        )
    );

-- 3. Demo Gemeente (so FK vir profiele en statistieke bestaan)
INSERT INTO public.gemeentes (id, naam, beskrywing, aktief)
VALUES ('7789c1c7-4087-43b1-a07f-43614a5d176e', 'Demo Gemeente', 'Fiktiewe gemeente vir toetsdata', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Voeg fiktiewe profiele by vir Demo Gemeente
INSERT INTO public.profiles (id, user_id, congregation_id, first_name, surname, cellphone, email, lidmaat_status, title, active)
VALUES 
    (gen_random_uuid(), NULL, '7789c1c7-4087-43b1-a07f-43614a5d176e', 'Jan', 'Alleman', '+27000000001', 'jan.alleman@demo.example.com', 'aktief', 'Mnr.', true),
    (gen_random_uuid(), NULL, '7789c1c7-4087-43b1-a07f-43614a5d176e', 'Sarie', 'Marais', '+27000000002', 'sarie.marais@demo.example.com', 'aktief', 'Mev.', true),
    (gen_random_uuid(), NULL, '7789c1c7-4087-43b1-a07f-43614a5d176e', 'Pieter', 'Pille', '+27000000003', 'pieter.pille@demo.example.com', 'oorlede', 'Dr.', true),
    (gen_random_uuid(), NULL, '7789c1c7-4087-43b1-a07f-43614a5d176e', 'Koos', 'van der Merwe', '+27000000004', 'koos.vandermerwe@demo.example.com', 'verhuis', 'Mnr.', true),
    (gen_random_uuid(), NULL, '7789c1c7-4087-43b1-a07f-43614a5d176e', 'Hendrik', 'Brummer', '+27000000005', 'hendrik.brummer@demo.example.com', 'aktief', 'Ds.', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Voeg fiktiewe statistieke by vir Demo Gemeente oor die laaste 3 jaar
INSERT INTO public.congregation_statistics (congregation_id, year, baptized_members, confessing_members, births, deaths, baptisms, confirmations)
VALUES 
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2023, 45, 120, 5, 2, 4, 6),
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2024, 48, 125, 4, 3, 5, 8),
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2025, 52, 134, 6, 1, 7, 10)
ON CONFLICT DO NOTHING;
