-- =============================================================================
-- GELOOFSONDERRIG: Backfill ai_logs vir voltooide lesse sonder chat-logs
-- =============================================================================
-- Leerders wat 'n les voltooi het (vordering) maar geen in-les chat gebruik het
-- het geen rye in geloofsonderrig_ai_logs nie, so die KGVW-analise (Leerders in
-- Klas) wys "Nog geen interaksies" / "Geen data". Voeg een "Les voltooi"-log by
-- per (leerder_id, les_id) sodat die skav_opsomming view hulle tel.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_ai_logs') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    RETURN;
  END IF;

  INSERT INTO public.geloofsonderrig_ai_logs (leerder_id, les_id, user_message, ai_response, kgvw_scores)
  SELECT
    v.leerder_id,
    v.les_id,
    'Les voltooi',
    '',
    '{"kennis":0.25,"gesindheid":0.25,"vaardigheid":0.25,"values":0.25}'::jsonb
  FROM public.geloofsonderrig_vordering v
  WHERE v.voltooi = true
    AND NOT EXISTS (
      SELECT 1 FROM public.geloofsonderrig_ai_logs a
      WHERE a.leerder_id = v.leerder_id AND a.les_id = v.les_id
    );
END $$;
