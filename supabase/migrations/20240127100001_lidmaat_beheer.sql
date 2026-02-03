-- Opdateer gebruikers tabel met nuwe velde
ALTER TABLE public.gebruikers 
ADD COLUMN IF NOT EXISTS titel TEXT,
ADD COLUMN IF NOT EXISTS lidmaat_status TEXT DEFAULT 'aktief',
ADD COLUMN IF NOT EXISTS datum_oorlede TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS datum_verhuis TIMESTAMPTZ;

-- Skep 'n tabel vir intydse lidmaat-statistiek logs (Vermeerdering/Vermindering)
CREATE TABLE IF NOT EXISTS public.gemeente_statistiek_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gemeente_id UUID REFERENCES public.gemeentes(id),
    gebruiker_id UUID REFERENCES public.gebruikers(id),
    tipe TEXT NOT NULL, -- 'vermeerdering' of 'vermindering'
    rede TEXT, -- 'nuwe_registrasie', 'oorlede', 'verhuis', 'belydenis', 'doop', ens.
    datum TIMESTAMPTZ DEFAULT NOW(),
    beskrywing TEXT
);

-- RLS vir die nuwe log tabel
ALTER TABLE public.gemeente_statistiek_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin kan logs sien" ON public.gemeente_statistiek_logs;
CREATE POLICY "Admin kan logs sien" ON public.gemeente_statistiek_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.gebruikers
            WHERE id = auth.uid() AND rol IN ('admin', 'hoofadmin')
        )
    );

-- Funksie om outomaties vermeerdering te log by nuwe lidmaat
CREATE OR REPLACE FUNCTION log_lidmaat_vermeerdering()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
    VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'nuwe_registrasie', 'Lidmaat bygevoeg of geregistreer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger vir nuwe lidmate
DROP TRIGGER IF EXISTS tr_log_lidmaat_vermeerdering ON public.gebruikers;
CREATE TRIGGER tr_log_lidmaat_vermeerdering
AFTER INSERT ON public.gebruikers
FOR EACH ROW EXECUTE FUNCTION log_lidmaat_vermeerdering();
