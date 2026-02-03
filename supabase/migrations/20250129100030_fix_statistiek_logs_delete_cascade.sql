-- =============================================================================
-- FIX GEBRUIKER DELETE: Verwyder gemeente_statistiek_logs by gebruiker delete
-- =============================================================================
-- Die gebruiker_id FK blokkeer delete. Met ON DELETE CASCADE word die
-- verwante log-entries outomaties verwyder wanneer 'n gebruiker/lidmaat
-- uitgevee word.
-- =============================================================================

ALTER TABLE public.gemeente_statistiek_logs
  DROP CONSTRAINT IF EXISTS gemeente_statistiek_logs_gebruiker_id_fkey;

ALTER TABLE public.gemeente_statistiek_logs
  ADD CONSTRAINT gemeente_statistiek_logs_gebruiker_id_fkey
  FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE;
