-- FIX MENU LAYOUTS TABLE (FK and RLS)

-- 1. Drop existing table to clear bad constraints/policies
DROP TABLE IF EXISTS public.sys_menu_layouts CASCADE;

-- 2. Create table with correct Foreign Key pointing to public.gebruikers
CREATE TABLE public.sys_menu_layouts (
  role text NOT NULL PRIMARY KEY,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES public.gebruikers(id) -- Linked to custom user table
);

-- 3. Enable RLS
ALTER TABLE public.sys_menu_layouts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies compatible with 'anon' client (Custom Auth)
-- Since the app handles auth client-side and connects as anon, we must allow anon access.
-- Security is deferred to the application logic for this architecture.

CREATE POLICY "Allow anon read"
  ON public.sys_menu_layouts FOR SELECT
  USING (true);

CREATE POLICY "Allow anon insert/update"
  ON public.sys_menu_layouts FOR ALL
  USING (true)
  WITH CHECK (true);
