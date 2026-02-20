-- =============================================================================
-- Redaksie: Verwyder artikel indiening via RPC (basis – sien 20250203140000 vir RLS-fix)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_artikel_indiening(
  p_indiening_id uuid,
  p_gebruiker_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gebruikers
    WHERE id = p_gebruiker_id AND LOWER(TRIM(rol)) IN ('hoof_admin', 'subadmin', 'admin', 'moderator', 'predikant')
  ) THEN
    RAISE EXCEPTION 'Geen regte om artikel te verwyder';
  END IF;
  DELETE FROM public.artikels_indienings WHERE id = p_indiening_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_artikel_indiening(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_artikel_indiening(uuid, uuid) TO authenticated;
