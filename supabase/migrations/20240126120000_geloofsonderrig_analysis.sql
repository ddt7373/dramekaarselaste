-- ==============================================================================
-- GELOOFSONDERRIG ANALYSIS & PROGRESS SCHEMA
-- ==============================================================================
-- Only run when geloofsonderrig_lesse exists (created in app or later migrations).
-- Safe for shadow DB / db pull.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_lesse') THEN
    RETURN;
  END IF;

  -- 1. AI Interaction Logs
  CREATE TABLE IF NOT EXISTS public.geloofsonderrig_ai_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leerder_id UUID REFERENCES public.gebruikers(id) ON DELETE CASCADE,
    les_id UUID REFERENCES public.geloofsonderrig_lesse(id) ON DELETE CASCADE,
    user_message TEXT,
    ai_response TEXT,
    kgvw_scores JSONB DEFAULT '{ "kennis": 0, "gesindheid": 0, "vaardigheid": 0, "values": 0 }'::jsonb,
    analise_opsomming TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Progress Table
  CREATE TABLE IF NOT EXISTS public.geloofsonderrig_vordering (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leerder_id UUID REFERENCES public.gebruikers(id) ON DELETE CASCADE,
    les_id UUID REFERENCES public.geloofsonderrig_lesse(id) ON DELETE CASCADE,
    voltooi BOOLEAN DEFAULT false,
    quiz_score INTEGER DEFAULT 0,
    quiz_total INTEGER DEFAULT 10,
    verse_completed INTEGER DEFAULT 0,
    verse_total INTEGER DEFAULT 5,
    visualiserings_count INTEGER DEFAULT 0,
    datum TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END $$;

-- Add missing columns if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering' AND column_name = 'quiz_score') THEN
      ALTER TABLE public.geloofsonderrig_vordering ADD COLUMN quiz_score INTEGER DEFAULT 0;
      ALTER TABLE public.geloofsonderrig_vordering ADD COLUMN quiz_total INTEGER DEFAULT 10;
      ALTER TABLE public.geloofsonderrig_vordering ADD COLUMN verse_completed INTEGER DEFAULT 0;
      ALTER TABLE public.geloofsonderrig_vordering ADD COLUMN verse_total INTEGER DEFAULT 5;
      ALTER TABLE public.geloofsonderrig_vordering ADD COLUMN visualiserings_count INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- 3. SKAV Opsomming View (only if geloofsonderrig_ai_logs exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_ai_logs') THEN
    RETURN;
  END IF;
  DROP VIEW IF EXISTS public.geloofsonderrig_skav_opsomming CASCADE;
  CREATE VIEW public.geloofsonderrig_skav_opsomming AS
  WITH flattened_logs AS (
    SELECT 
      leerder_id,
      les_id,
      (kgvw_scores->>'kennis')::numeric as kennis,
      (kgvw_scores->>'gesindheid')::numeric as gesindheid,
      (kgvw_scores->>'vaardigheid')::numeric as vaardigheid,
      (kgvw_scores->>'values')::numeric as waardes,
      kgvw_scores->'sterkpunte' as sp,
      kgvw_scores->'leemtes' as lm,
      created_at
    FROM public.geloofsonderrig_ai_logs
  )
  SELECT 
    leerder_id,
    les_id,
    AVG(kennis) * 10 as kennis_telling,
    AVG(gesindheid) * 10 as gesindheid_telling,
    AVG(vaardigheid) * 10 as vaardighede_telling,
    AVG(waardes) * 10 as waardes_telling,
    ARRAY_AGG(DISTINCT s.val) FILTER (WHERE s.val IS NOT NULL) as sterkpunte,
    ARRAY_AGG(DISTINCT l.val) FILTER (WHERE l.val IS NOT NULL) as leemtes,
    MAX(created_at) as laaste_opdatering
  FROM flattened_logs
  LEFT JOIN LATERAL jsonb_array_elements_text(sp) s(val) ON true
  LEFT JOIN LATERAL jsonb_array_elements_text(lm) l(val) ON true
  GROUP BY leerder_id, les_id;
END $$;

-- 4. Enable RLS (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_ai_logs') THEN
    ALTER TABLE public.geloofsonderrig_ai_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    ALTER TABLE public.geloofsonderrig_vordering ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 5. Policies and GRANTs (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_ai_logs') THEN
    DROP POLICY IF EXISTS "Users see own logs" ON public.geloofsonderrig_ai_logs;
    CREATE POLICY "Users see own logs" ON public.geloofsonderrig_ai_logs FOR SELECT USING (auth.uid() = leerder_id);
    DROP POLICY IF EXISTS "Mentors see class logs" ON public.geloofsonderrig_ai_logs;
    CREATE POLICY "Mentors see class logs" ON public.geloofsonderrig_ai_logs FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.geloofsonderrig_klas_leerders kl
        JOIN public.geloofsonderrig_klasse k ON k.id = kl.klas_id
        WHERE kl.leerder_id = public.geloofsonderrig_ai_logs.leerder_id
        AND (k.mentor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.gebruikers WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'geloofsonderrig_admin')
        ))
      )
    );
    GRANT ALL ON TABLE public.geloofsonderrig_ai_logs TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    DROP POLICY IF EXISTS "Users see own progress" ON public.geloofsonderrig_vordering;
    CREATE POLICY "Users see own progress" ON public.geloofsonderrig_vordering FOR SELECT USING (auth.uid() = leerder_id);
    DROP POLICY IF EXISTS "Users update own progress" ON public.geloofsonderrig_vordering;
    CREATE POLICY "Users update own progress" ON public.geloofsonderrig_vordering FOR ALL USING (auth.uid() = leerder_id) WITH CHECK (auth.uid() = leerder_id);
    DROP POLICY IF EXISTS "Mentors see class progress" ON public.geloofsonderrig_vordering;
    CREATE POLICY "Mentors see class progress" ON public.geloofsonderrig_vordering FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.geloofsonderrig_klas_leerders kl
        JOIN public.geloofsonderrig_klasse k ON k.id = kl.klas_id
        WHERE kl.leerder_id = public.geloofsonderrig_vordering.leerder_id
        AND (k.mentor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.gebruikers WHERE id = auth.uid() AND rol IN ('hoof_admin', 'admin', 'geloofsonderrig_admin')
        ))
      )
    );
    GRANT ALL ON TABLE public.geloofsonderrig_vordering TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_skav_opsomming') THEN
    GRANT SELECT ON public.geloofsonderrig_skav_opsomming TO anon, authenticated, service_role;
  END IF;
END $$;
