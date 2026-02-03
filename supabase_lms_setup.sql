-- ==============================================================================
-- SUPABASE LMS, JY IS MYNE & KINDERKERK SETUP SCRIPT
-- ==============================================================================
-- This script creates the missing tables required for:
-- 1. Learning Management System (LMS)
-- 2. "Jy is Myne" (Parenting/Baptism module)
-- 3. "Kort & Kragtig" (Kinderkerk module)
--
-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. LMS TABLES
-- ==============================================================================

-- 1.1 LMS KURSUSSE
CREATE TABLE IF NOT EXISTS public.lms_kursusse (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titel TEXT NOT NULL,
    beskrywing TEXT,
    kort_beskrywing TEXT,
    kategorie TEXT DEFAULT 'Bybelstudie',
    vlak TEXT DEFAULT 'beginner', -- beginner, intermediêr, gevorderd
    prys NUMERIC DEFAULT 0,
    is_gratis BOOLEAN DEFAULT true,
    duur_minute INTEGER DEFAULT 60,
    foto_url TEXT,
    video_voorskou_url TEXT,
    vereistes TEXT,
    wat_jy_sal_leer TEXT[] DEFAULT '{}',
    geskep_deur UUID REFERENCES auth.users(id),
    is_vbo_geskik BOOLEAN DEFAULT false,
    vbo_krediete INTEGER DEFAULT 0,
    is_missionaal BOOLEAN DEFAULT false,
    is_gepubliseer BOOLEAN DEFAULT false,
    is_aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 LMS MODULES
CREATE TABLE IF NOT EXISTS public.lms_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    kursus_id UUID REFERENCES public.lms_kursusse(id) ON DELETE CASCADE,
    titel TEXT NOT NULL,
    beskrywing TEXT,
    volgorde INTEGER DEFAULT 0,
    is_aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 LMS LESSE
CREATE TABLE IF NOT EXISTS public.lms_lesse (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES public.lms_modules(id) ON DELETE CASCADE,
    titel TEXT NOT NULL,
    tipe TEXT DEFAULT 'teks', -- teks, video, audio, vasvra, opdrag
    inhoud TEXT, -- Markdown content or description
    video_url TEXT,
    duur_minute INTEGER DEFAULT 10,
    bylaes JSONB DEFAULT '[]', -- Array of {titel, url, tipe}
    volgorde INTEGER DEFAULT 0,
    is_aktief BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 LMS REGISTRASIES (Enrollments)
CREATE TABLE IF NOT EXISTS public.lms_registrasies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    kursus_id UUID REFERENCES public.lms_kursusse(id) ON DELETE CASCADE,
    gebruiker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed, cancelled
    progress INTEGER DEFAULT 0, -- Percentage
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kursus_id, gebruiker_id)
);

-- 1.5 LMS VORDERING (Lesson Completion)
CREATE TABLE IF NOT EXISTS public.lms_vordering (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gebruiker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    les_id UUID REFERENCES public.lms_lesse(id) ON DELETE CASCADE,
    is_voltooi BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gebruiker_id, les_id)
);

-- ==============================================================================
-- 2. JY IS MYNE TABLES
-- ==============================================================================

-- 2.1 CHILDREN
CREATE TABLE IF NOT EXISTS public.jy_is_myne_children (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gemeente_id UUID, -- Optional reference to congregation
    name TEXT NOT NULL,
    birth_date DATE,
    expected_date DATE,
    baptism_date DATE,
    phase INTEGER NOT NULL, -- 1-8
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 TOOLKIT ITEMS
CREATE TABLE IF NOT EXISTS public.jy_is_myne_toolkit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL, -- prayer, bible_story, etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    age_groups TEXT[] DEFAULT '{}',
    liturgical_season TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 PHASE CONTENT
CREATE TABLE IF NOT EXISTS public.jy_is_myne_phase_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phase INTEGER UNIQUE NOT NULL,
    phase_name TEXT NOT NULL,
    age_range TEXT NOT NULL,
    baptism_focus TEXT,
    communion_focus TEXT,
    development_goals TEXT[] DEFAULT '{}',
    symbolism TEXT,
    worship_integration TEXT,
    conversation_themes TEXT[] DEFAULT '{}',
    family_projects TEXT[] DEFAULT '{}',
    weekly_activities JSONB DEFAULT '{}',
    monthly_activities JSONB DEFAULT '{}',
    parent_reflections TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 JOURNAL
CREATE TABLE IF NOT EXISTS public.jy_is_myne_journal (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.jy_is_myne_children(id) ON DELETE CASCADE,
    entry_type TEXT DEFAULT 'reflection',
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    date DATE DEFAULT CURRENT_DATE,
    phase INTEGER,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. KORT & KRAGTIG (KINDERKERK) TABLES
-- ==============================================================================

-- 3.1 KK LESSONS
CREATE TABLE IF NOT EXISTS public.kk_lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    passage_reference TEXT,
    theme_tags TEXT[] DEFAULT '{}',
    age_band TEXT DEFAULT '6-11',
    difficulty INTEGER DEFAULT 1,
    summary TEXT,
    core_truths TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 KK LESSON VARIANTS
CREATE TABLE IF NOT EXISTS public.kk_lesson_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES public.kk_lessons(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL, -- STANDARD, SHORT, EXTENDED, REMEDIAL
    hook_text TEXT,
    story_text TEXT,
    explanation_points TEXT[] DEFAULT '{}',
    parent_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 KK QUESTIONS
CREATE TABLE IF NOT EXISTS public.kk_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES public.kk_lessons(id) ON DELETE CASCADE,
    question_type TEXT DEFAULT 'MULTIPLE_CHOICE', -- MULTIPLE_CHOICE, TRUE_FALSE, REFLECTION
    question_text TEXT NOT NULL,
    options TEXT[] DEFAULT '{}',
    correct_answer TEXT,
    correct_answers TEXT[] DEFAULT '{}', -- Supports multiple correct (though frontend logic focuses on correct_answer)
    skill_tag TEXT DEFAULT 'Feite',
    difficulty INTEGER DEFAULT 1,
    hint_text TEXT,
    explanation TEXT,
    variant_type TEXT DEFAULT 'STANDARD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 KK USER PROGRESS
CREATE TABLE IF NOT EXISTS public.kk_user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_lessons_completed INTEGER DEFAULT 0,
    total_time_spent_seconds INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_lesson_date DATE,
    average_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3.5 KK LESSON ATTEMPTS
CREATE TABLE IF NOT EXISTS public.kk_lesson_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.kk_lessons(id) ON DELETE SET NULL,
    variant_type TEXT,
    time_selected INTEGER, -- 3, 5, 10, 15
    challenge_mode BOOLEAN DEFAULT false,
    score_percent NUMERIC DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- HELPER FUNCTION: Get Current User Role (Bypasses RLS)
-- This function runs as the database owner (SECURITY DEFINER), allowing it to
-- read the 'gebruikers' table even if the user has no direct access.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT rol FROM public.gebruikers WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE public.lms_kursusse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_registrasies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_vordering ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jy_is_myne_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jy_is_myne_toolkit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jy_is_myne_phase_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jy_is_myne_journal ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kk_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_lesson_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_lesson_attempts ENABLE ROW LEVEL SECURITY;

-- 4.0 GEBRUIKERS POLICY
ALTER TABLE public.gebruikers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Own User Data" ON public.gebruikers;
CREATE POLICY "Read Own User Data" ON public.gebruikers FOR SELECT USING (id = auth.uid());

-- LMS POLICIES
-- NOTE: Policies temporarily set to permissive (USING true) because the frontend
-- uses custom auth that doesn't establish a Supabase session.
-- Security checks should be moved to the application layer until Supabase Auth is fully integrated.

-- Kursusse
DROP POLICY IF EXISTS "Public Read Kursusse" ON public.lms_kursusse;
CREATE POLICY "Public Read Kursusse" ON public.lms_kursusse FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Kursusse" ON public.lms_kursusse;
CREATE POLICY "Admin All Kursusse" ON public.lms_kursusse FOR ALL USING (true);

-- Modules & Lesse
DROP POLICY IF EXISTS "Read Modules" ON public.lms_modules;
CREATE POLICY "Read Modules" ON public.lms_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Modules" ON public.lms_modules;
CREATE POLICY "Admin All Modules" ON public.lms_modules FOR ALL USING (true);

DROP POLICY IF EXISTS "Read Lesse" ON public.lms_lesse;
CREATE POLICY "Read Lesse" ON public.lms_lesse FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Lesse" ON public.lms_lesse;
CREATE POLICY "Admin All Lesse" ON public.lms_lesse FOR ALL USING (true);

-- Registrasies & Vordering
DROP POLICY IF EXISTS "User Own Registrasies" ON public.lms_registrasies;
CREATE POLICY "User Own Registrasies" ON public.lms_registrasies FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin All Registrasies" ON public.lms_registrasies;
CREATE POLICY "Admin All Registrasies" ON public.lms_registrasies FOR SELECT USING (true);

DROP POLICY IF EXISTS "User Own Vordering" ON public.lms_vordering;
CREATE POLICY "User Own Vordering" ON public.lms_vordering FOR ALL USING (true);

-- 4.2 JY IS MYNE POLICIES
-- Children & Journal
DROP POLICY IF EXISTS "User Own Children" ON public.jy_is_myne_children;
CREATE POLICY "User Own Children" ON public.jy_is_myne_children FOR ALL USING (true);

DROP POLICY IF EXISTS "User Own Journal" ON public.jy_is_myne_journal;
CREATE POLICY "User Own Journal" ON public.jy_is_myne_journal FOR ALL USING (true);

-- Toolkit & Phase Content
DROP POLICY IF EXISTS "Public Read Toolkit" ON public.jy_is_myne_toolkit;
CREATE POLICY "Public Read Toolkit" ON public.jy_is_myne_toolkit FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Toolkit" ON public.jy_is_myne_toolkit;
CREATE POLICY "Admin Write Toolkit" ON public.jy_is_myne_toolkit FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Phase Content" ON public.jy_is_myne_phase_content;
CREATE POLICY "Public Read Phase Content" ON public.jy_is_myne_phase_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Phase Content" ON public.jy_is_myne_phase_content;
CREATE POLICY "Admin Write Phase Content" ON public.jy_is_myne_phase_content FOR ALL USING (true);

-- 4.3 KORT & KRAGTIG POLICIES
-- Lessons, Variants, Questions
DROP POLICY IF EXISTS "Public Read KK" ON public.kk_lessons;
CREATE POLICY "Public Read KK" ON public.kk_lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All KK" ON public.kk_lessons;
CREATE POLICY "Admin All KK" ON public.kk_lessons FOR ALL USING (true);

DROP POLICY IF EXISTS "Read Options KK" ON public.kk_lesson_variants;
CREATE POLICY "Read Options KK" ON public.kk_lesson_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Variants" ON public.kk_lesson_variants;
CREATE POLICY "Admin Write Variants" ON public.kk_lesson_variants FOR ALL USING (true);

DROP POLICY IF EXISTS "Read Questions KK" ON public.kk_questions;
CREATE POLICY "Read Questions KK" ON public.kk_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Write Questions" ON public.kk_questions;
CREATE POLICY "Admin Write Questions" ON public.kk_questions FOR ALL USING (true);

-- Progress & Attempts
DROP POLICY IF EXISTS "User Own KK Progress" ON public.kk_user_progress;
CREATE POLICY "User Own KK Progress" ON public.kk_user_progress FOR ALL USING (true);

DROP POLICY IF EXISTS "User Own KK Attempts" ON public.kk_lesson_attempts;
CREATE POLICY "User Own KK Attempts" ON public.kk_lesson_attempts FOR ALL USING (true);

-- ==============================================================================
-- 5. GRANTS
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- DONE
