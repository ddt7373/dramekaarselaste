-- Geloofsonderrig: RPCs vir NHKA wat nie Supabase Auth gebruik nie
-- Only create when geloofsonderrig tables exist; safe for shadow DB.

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.upsert_geloofsonderrig_vordering_leerder(
    p_leerder_id UUID,
    p_les_id UUID,
    p_voltooi BOOLEAN,
    p_quiz_score INTEGER DEFAULT 0,
    p_quiz_total INTEGER DEFAULT 5,
    p_verse_completed INTEGER DEFAULT 0,
    p_verse_total INTEGER DEFAULT 3,
    p_visualiserings_count INTEGER DEFAULT 0
  )
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $body$
  BEGIN
    INSERT INTO public.geloofsonderrig_vordering (
      leerder_id, les_id, voltooi, quiz_score, quiz_total,
      verse_completed, verse_total, visualiserings_count, datum, updated_at
    ) VALUES (
      p_leerder_id, p_les_id, p_voltooi, p_quiz_score, p_quiz_total,
      p_verse_completed, p_verse_total, p_visualiserings_count,
      NOW(), NOW()
    )
    ON CONFLICT (leerder_id, les_id) DO UPDATE SET
      voltooi = EXCLUDED.voltooi,
      quiz_score = EXCLUDED.quiz_score,
      quiz_total = EXCLUDED.quiz_total,
      verse_completed = EXCLUDED.verse_completed,
      verse_total = EXCLUDED.verse_total,
      visualiserings_count = EXCLUDED.visualiserings_count,
      updated_at = NOW();
  END;
  $body$;

  CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_vordering_leerder(p_leerder_id UUID)
  RETURNS SETOF public.geloofsonderrig_vordering
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $body$
    SELECT * FROM public.geloofsonderrig_vordering WHERE leerder_id = p_leerder_id;
  $body$;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_punte') THEN
    CREATE OR REPLACE FUNCTION public.insert_geloofsonderrig_punte_leerder(
      p_leerder_id UUID,
      p_aksie_tipe TEXT,
      p_punte INTEGER,
      p_les_id UUID DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    BEGIN
      INSERT INTO public.geloofsonderrig_punte (leerder_id, aksie_tipe, punte, les_id)
      VALUES (p_leerder_id, p_aksie_tipe, p_punte, p_les_id);
    END;
    $body$;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_leaderboard') THEN
    CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_leerder(p_leerder_id UUID DEFAULT NULL)
    RETURNS TABLE(rang BIGINT, totaal_punte INTEGER, is_current_user BOOLEAN)
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
      SELECT
        l.rang::BIGINT,
        l.totaal_punte,
        (l.leerder_id = p_leerder_id) AS is_current_user
      FROM geloofsonderrig_leaderboard l
      ORDER BY l.rang
      LIMIT 100;
    $body$;
  END IF;

  GRANT EXECUTE ON FUNCTION public.upsert_geloofsonderrig_vordering_leerder(UUID,UUID,BOOLEAN,INTEGER,INTEGER,INTEGER,INTEGER,INTEGER) TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.get_geloofsonderrig_vordering_leerder(UUID) TO anon, authenticated;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_punte') THEN
    GRANT EXECUTE ON FUNCTION public.insert_geloofsonderrig_punte_leerder(UUID,TEXT,INTEGER,UUID) TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_leaderboard') THEN
    GRANT EXECUTE ON FUNCTION public.get_geloofsonderrig_leaderboard_leerder(UUID) TO anon, authenticated;
  END IF;
END $mig$;
