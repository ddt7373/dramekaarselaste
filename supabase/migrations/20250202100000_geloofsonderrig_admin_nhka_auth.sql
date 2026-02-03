-- Geloofsonderrig: Admin leaderboard vir NHKA (gebruik nie Supabase Auth nie)
-- auth.uid() is NULL, so ons aanvaar p_admin_id en verifieer rol uit gebruikers tabel.

-- Verwyder ou funksie (geen params) voor nuwe een (met p_admin_id)
DROP FUNCTION IF EXISTS public.get_geloofsonderrig_leaderboard_admin();

-- Skep get_geloofsonderrig_leaderboard_admin met p_admin_id
CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_admin(p_admin_id UUID DEFAULT NULL)
RETURNS TABLE(rang BIGINT, leerder_id UUID, naam TEXT, van TEXT, totaal_punte INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check_id UUID;
BEGIN
  -- NHKA: p_admin_id gebruik (geen Supabase Auth)
  v_check_id := COALESCE(p_admin_id, auth.uid());
  IF v_check_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.gebruikers WHERE id = v_check_id AND rol IN ('hoof_admin', 'geloofsonderrig_admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT 
    l.rang::BIGINT,
    l.leerder_id,
    g.naam::TEXT,
    g.van::TEXT,
    l.totaal_punte
  FROM public.geloofsonderrig_leaderboard l
  JOIN public.gebruikers g ON g.id = l.leerder_id
  ORDER BY l.rang
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_geloofsonderrig_leaderboard_admin(UUID) TO anon, authenticated;
