-- RECREATE MENU LAYOUTS TABLE (CLEAN START)
-- This will resolve any "Primary Key" or "Constraint" conflicts by resetting the table.

-- 1. Drop the table completely (avoids conflicts with existing constraints)
DROP TABLE IF EXISTS public.sys_menu_layouts CASCADE;

-- 2. Create table with explicit Primary Key and clean structure
CREATE TABLE public.sys_menu_layouts (
  role text NOT NULL,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES public.gebruikers(id),
  CONSTRAINT sys_menu_layouts_pkey PRIMARY KEY (role)
);

-- 3. Enable Security
ALTER TABLE public.sys_menu_layouts ENABLE ROW LEVEL SECURITY;

-- 4. Add Open Policies for the App (managed by custom auth)
CREATE POLICY "Allow anon read"
  ON public.sys_menu_layouts FOR SELECT
  USING (true);

CREATE POLICY "Allow anon insert/update"
  ON public.sys_menu_layouts FOR ALL
  USING (true)
  WITH CHECK (true);
