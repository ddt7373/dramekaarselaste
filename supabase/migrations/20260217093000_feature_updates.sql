-- Add 'is_oorlede' to gebruikers
ALTER TABLE public.gebruikers 
ADD COLUMN IF NOT EXISTS is_oorlede boolean DEFAULT false;

-- Add 'sluit_uit_van_statistiek' to gemeentes
ALTER TABLE public.gemeentes 
ADD COLUMN IF NOT EXISTS sluit_uit_van_statistiek boolean DEFAULT false;

-- Create vbo_historiese_punte table
CREATE TABLE IF NOT EXISTS public.vbo_historiese_punte (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    predikant_id uuid REFERENCES public.gebruikers(id) ON DELETE CASCADE,
    jaar integer NOT NULL,
    punte numeric(10, 2) NOT NULL DEFAULT 0,
    beskrywing text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for vbo_historiese_punte
ALTER TABLE public.vbo_historiese_punte ENABLE ROW LEVEL SECURITY;

-- Allow anon access for now as per project pattern
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anon all access vbo_historiese_punte" ON public.vbo_historiese_punte;
    
    CREATE POLICY "Anon all access vbo_historiese_punte" ON public.vbo_historiese_punte
    FOR ALL USING (true) WITH CHECK (true);
END $$;
