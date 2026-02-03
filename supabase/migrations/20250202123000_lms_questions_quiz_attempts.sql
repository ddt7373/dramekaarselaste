-- ==============================================================================
-- LMS Questions & Quiz Attempts
-- ==============================================================================
-- Only create when lms_lesse exists; safe for shadow DB.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_lesse') THEN
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS public.lms_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    les_id UUID NOT NULL REFERENCES public.lms_lesse(id) ON DELETE CASCADE,
    vraag_teks TEXT NOT NULL,
    vraag_tipe TEXT DEFAULT 'mcq',
    opsies JSONB DEFAULT '{}',
    korrekte_antwoord TEXT,
    punte INTEGER DEFAULT 1,
    volgorde INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_lms_questions_les_id ON public.lms_questions(les_id);

  CREATE TABLE IF NOT EXISTS public.lms_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    les_id UUID NOT NULL REFERENCES public.lms_lesse(id) ON DELETE CASCADE,
    gebruiker_id UUID NOT NULL REFERENCES public.gebruikers(id) ON DELETE CASCADE,
    telling INTEGER DEFAULT 0,
    maksimum_punte INTEGER DEFAULT 0,
    persentasie NUMERIC DEFAULT 0,
    geslaag BOOLEAN DEFAULT false,
    antwoorde JSONB DEFAULT '{}',
    voltooi_op TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_les_id ON public.lms_quiz_attempts(les_id);
  CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_gebruiker_id ON public.lms_quiz_attempts(gebruiker_id);

  ALTER TABLE public.lms_questions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Read LMS Questions" ON public.lms_questions;
  CREATE POLICY "Read LMS Questions" ON public.lms_questions FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Admin Write LMS Questions" ON public.lms_questions;
  CREATE POLICY "Admin Write LMS Questions" ON public.lms_questions FOR ALL USING (true);

  DROP POLICY IF EXISTS "User Own Quiz Attempts" ON public.lms_quiz_attempts;
  CREATE POLICY "User Own Quiz Attempts" ON public.lms_quiz_attempts FOR ALL USING (true);
END $$;
