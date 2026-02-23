-- =============================================================================
-- MUSIEK: Voeg 'handmatig' by as geldige ai_diens waarde
-- vir liedere wat direk as MP3 opgelaai word sonder AI-generasie
-- =============================================================================

-- Verwyder die bestaande CHECK constraint en vervang met een wat 'handmatig' insluit
ALTER TABLE public.musiek_liedere DROP CONSTRAINT IF EXISTS musiek_liedere_ai_diens_check;

ALTER TABLE public.musiek_liedere ADD CONSTRAINT musiek_liedere_ai_diens_check
  CHECK (ai_diens IN ('suno', 'replicate', 'handmatig'));
