-- Geloofsonderrig: Publieke leaderboard vir leerders (sonder name, wys almal se punte)
-- Leerders sien almal se rang en punte, met "Jy" gemerk vir hul eie posisie
-- Only create when view exists; safe for shadow DB.

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_leaderboard') THEN
    RETURN;
  END IF;
  CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_public()
  RETURNS TABLE(rang BIGINT, totaal_punte INTEGER, is_current_user BOOLEAN)
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $body$
    SELECT
      l.rang::BIGINT,
      l.totaal_punte,
      (l.leerder_id = auth.uid())
    FROM geloofsonderrig_leaderboard l
    ORDER BY l.rang
    LIMIT 100;
  $body$;
END $mig$;
