-- ULTRA SIMPLE DEBUG SCRIPT

-- 1. Drop with CASCADE to ensure policies are gone
DROP TABLE IF EXISTS public.sys_menu_layouts CASCADE;

-- 2. Create table WITHOUT Foreign Key first
CREATE TABLE public.sys_menu_layouts (
    role text PRIMARY KEY,
    layout jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid 
);

-- 3. Enable RLS
ALTER TABLE public.sys_menu_layouts ENABLE ROW LEVEL SECURITY;

-- 4. Simple Policy
CREATE POLICY "Public Read"
ON public.sys_menu_layouts FOR SELECT
USING (true);

CREATE POLICY "Public All"
ON public.sys_menu_layouts FOR ALL
USING (true)
WITH CHECK (true);
