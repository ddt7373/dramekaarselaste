-- =============================================================================
-- Redaksie: Laat subadmin (gemeente administrateur) ook artikels verwyder
-- =============================================================================

DROP POLICY IF EXISTS "Admins/Moderators can delete submissions" ON public.artikels_indienings;

CREATE POLICY "Admins/Moderators can delete submissions"
  ON public.artikels_indienings
  FOR DELETE
  USING (
    current_setting('app.current_gebruiker_id', true)::uuid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gebruikers
      WHERE id = current_setting('app.current_gebruiker_id', true)::uuid
        AND LOWER(TRIM(rol)) IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'predikant')
    )
  );

CREATE OR REPLACE FUNCTION public.delete_artikel_indiening(
  p_indiening_id uuid,
  p_gebruiker_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gebruikers
    WHERE id = p_gebruiker_id
      AND LOWER(TRIM(rol)) IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'predikant')
  ) THEN
    RAISE EXCEPTION 'Geen regte om artikel te verwyder';
  END IF;

  PERFORM set_config('app.current_gebruiker_id', p_gebruiker_id::text, true);
  DELETE FROM public.artikels_indienings WHERE id = p_indiening_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Kon artikel nie verwyder nie (nie gevind of geen toegang)';
  END IF;
END;
$$;
