-- =============================================================================
-- GELOOFSONDERRIG BETALINGS - Leerders betaal R100 na 1 gratis les
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.geloofsonderrig_betalings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leerder_id UUID NOT NULL REFERENCES public.gebruikers(id) ON DELETE CASCADE,
  gemeente_id UUID NOT NULL REFERENCES public.gemeentes(id) ON DELETE CASCADE,
  bedrag INTEGER NOT NULL DEFAULT 10000,  -- sente (R100 = 10000)
  status TEXT NOT NULL DEFAULT 'betaal' CHECK (status IN ('betaal', 'hangende', 'afgekeur')),
  betaal_deur UUID REFERENCES public.gebruikers(id) ON DELETE SET NULL,  -- admin wat namens kind betaal het
  betaal_tipe TEXT DEFAULT 'self' CHECK (betaal_tipe IN ('self', 'namens')),  -- self = leerder, namens = admin
  yoco_checkout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_betalings_leerder ON public.geloofsonderrig_betalings(leerder_id);
CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_betalings_gemeente ON public.geloofsonderrig_betalings(gemeente_id);
CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_betalings_status ON public.geloofsonderrig_betalings(status);
CREATE INDEX IF NOT EXISTS idx_geloofsonderrig_betalings_created ON public.geloofsonderrig_betalings(created_at DESC);

ALTER TABLE public.geloofsonderrig_betalings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all geloofsonderrig_betalings" ON public.geloofsonderrig_betalings
  FOR ALL USING (true) WITH CHECK (true);
