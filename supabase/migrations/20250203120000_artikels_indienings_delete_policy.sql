-- =============================================================================
-- Redaksie: Laat admins/moderators/predikant artikels-indienings verwyder
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artikels_indienings') THEN
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Admins/Moderators can delete submissions" ON public.artikels_indienings;
  CREATE POLICY "Admins/Moderators can delete submissions" ON public.artikels_indienings
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.gebruikers
        WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'moderator', 'predikant')
      )
    );
END $$;
