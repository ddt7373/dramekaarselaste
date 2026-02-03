-- FIX MENU LAYOUTS SCHEMA
-- This adds the missing ID and GEMEENTE_ID columns to support gemeente overrides.

DROP TABLE IF EXISTS public.sys_menu_layouts CASCADE;

CREATE TABLE public.sys_menu_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  gemeente_id UUID REFERENCES public.gemeentes(id),
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.gebruikers(id),
  CONSTRAINT unique_role_gemeente UNIQUE (role, gemeente_id)
);

ALTER TABLE public.sys_menu_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.sys_menu_layouts;
CREATE POLICY "Allow public select" ON public.sys_menu_layouts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public all" ON public.sys_menu_layouts;
CREATE POLICY "Allow public all" ON public.sys_menu_layouts FOR ALL USING (true) WITH CHECK (true);
