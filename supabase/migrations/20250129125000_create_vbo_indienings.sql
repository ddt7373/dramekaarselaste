-- =============================================================================
-- VBO INDIENINGS - Predikante dien VBO aktiwiteite in vir goedkeuring
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vbo_indienings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predikant_id UUID NOT NULL REFERENCES public.gebruikers(id) ON DELETE CASCADE,
  aktiwiteit_id UUID NOT NULL,
  aktiwiteit_titel TEXT NOT NULL,
  aktiwiteit_tipe TEXT NOT NULL,
  krediete INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'hangende',
  notas TEXT,
  bewys_url TEXT,
  bewys_naam TEXT,
  jaar INTEGER NOT NULL,
  is_outomaties BOOLEAN DEFAULT false,
  kursus_id UUID,
  moderator_id UUID REFERENCES public.gebruikers(id) ON DELETE SET NULL,
  moderator_notas TEXT,
  goedgekeur_op TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vbo_indienings_predikant ON public.vbo_indienings(predikant_id);
CREATE INDEX IF NOT EXISTS idx_vbo_indienings_status ON public.vbo_indienings(status);
CREATE INDEX IF NOT EXISTS idx_vbo_indienings_jaar ON public.vbo_indienings(jaar);

-- RLS - App uses custom auth, access control in frontend
ALTER TABLE public.vbo_indienings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all vbo_indienings" ON public.vbo_indienings
  FOR ALL USING (true) WITH CHECK (true);
