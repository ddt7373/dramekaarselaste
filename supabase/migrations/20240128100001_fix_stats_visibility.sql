-- 1. Maak seker die tabelle bestaan en is toeganklik
ALTER TABLE public.congregation_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins kan alle statistieke sien" ON public.congregation_statistics;
CREATE POLICY "Admins kan alle statistieke sien" ON public.congregation_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gebruikers
            WHERE id = auth.uid() AND rol IN ('admin', 'hoofadmin')
        )
    );

-- 2. Maak seker die Demo Gemeente se data is daar
-- Ons gebruik die ID uit jou logs: 7789c1c7-4087-43b1-a07f-43614a5d176e
INSERT INTO public.congregation_statistics (congregation_id, year, baptized_members, confessing_members, births, deaths, baptisms, confirmations)
VALUES 
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2023, 150, 450, 12, 5, 10, 15),
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2024, 155, 465, 10, 8, 12, 18),
    ('7789c1c7-4087-43b1-a07f-43614a5d176e', 2025, 162, 480, 15, 4, 14, 22)
ON CONFLICT (congregation_id, year) DO UPDATE SET
    baptized_members = EXCLUDED.baptized_members,
    confessing_members = EXCLUDED.confessing_members;
