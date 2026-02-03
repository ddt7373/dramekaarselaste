-- Geloofsonderrig: Quiz 5/5, Leaderboard met belonings
-- Only run when geloofsonderrig tables exist; safe for shadow DB.

-- 1. Update quiz_total default na 5 (slegs as tabel bestaan)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    ALTER TABLE public.geloofsonderrig_vordering ALTER COLUMN quiz_total SET DEFAULT 5;
  END IF;
END $$;

-- 2. Punte-tabel vir belonings (slegs as geloofsonderrig_lesse bestaan)
-- Use $mig$ so nested $$ in CREATE FUNCTION bodies don't close this block
DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_lesse') THEN
    RETURN;
  END IF;
  CREATE TABLE IF NOT EXISTS public.geloofsonderrig_punte (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leerder_id UUID REFERENCES public.gebruikers(id) ON DELETE CASCADE NOT NULL,
    aksie_tipe TEXT NOT NULL, -- 'les_voltooi', 'quiz', 'vers', 'prompt', 'visualisering', 'gedig', 'musiek'
    punte INTEGER NOT NULL DEFAULT 0,
    les_id UUID REFERENCES public.geloofsonderrig_lesse(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_punte_leerder ON public.geloofsonderrig_punte(leerder_id);
CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_punte_created ON public.geloofsonderrig_punte(created_at DESC);

ALTER TABLE public.geloofsonderrig_punte ENABLE ROW LEVEL SECURITY;

-- Leerders sien eie punte
CREATE POLICY "Users see own punte" ON public.geloofsonderrig_punte 
  FOR SELECT USING (auth.uid() = leerder_id);

-- Leerders kan eie punte insert (via app)
CREATE POLICY "Users insert own punte" ON public.geloofsonderrig_punte 
  FOR INSERT WITH CHECK (auth.uid() = leerder_id);

-- Mentors/admins sien klas punte
CREATE POLICY "Mentors see class punte" ON public.geloofsonderrig_punte 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.geloofsonderrig_klas_leerders kl
      JOIN public.geloofsonderrig_klasse k ON k.id = kl.klas_id
      WHERE kl.leerder_id = public.geloofsonderrig_punte.leerder_id
      AND (k.mentor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.gebruikers WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'geloofsonderrig_admin')
      ))
    )
  );

GRANT ALL ON TABLE public.geloofsonderrig_punte TO service_role;

-- 3. Leaderboard view (totaal punte per leerder, rang)
CREATE OR REPLACE VIEW public.geloofsonderrig_leaderboard AS
SELECT 
  leerder_id,
  SUM(punte)::INTEGER as totaal_punte,
  RANK() OVER (ORDER BY SUM(punte) DESC) as rang
FROM public.geloofsonderrig_punte
GROUP BY leerder_id;

GRANT SELECT ON public.geloofsonderrig_leaderboard TO authenticated, service_role;

-- 4. RPC: Leerder kry slegs eie rang en punte (geen name van ander)
CREATE OR REPLACE FUNCTION public.get_my_geloofsonderrig_rank()
RETURNS TABLE(rang BIGINT, totaal_punte INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.rang, l.totaal_punte
  FROM geloofsonderrig_leaderboard l
  WHERE l.leerder_id = auth.uid();
$$;

-- 5. RPC: Hoofadmin kry volledige leaderboard met name (alleen hoof_admin/geloofsonderrig_admin)
CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_admin()
RETURNS TABLE(rang BIGINT, leerder_id UUID, naam TEXT, van TEXT, totaal_punte INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM gebruikers WHERE id = auth.uid() AND rol IN ('hoof_admin', 'geloofsonderrig_admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT 
    l.rang::BIGINT,
    l.leerder_id,
    g.naam::TEXT,
    g.van::TEXT,
    l.totaal_punte
  FROM geloofsonderrig_leaderboard l
  JOIN gebruikers g ON g.id = l.leerder_id
  ORDER BY l.rang
  LIMIT 100;
END;
$$;
END $mig$;
