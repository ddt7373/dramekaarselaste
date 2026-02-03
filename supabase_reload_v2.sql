-- FORCE SCHEMA RELOAD (V2)
-- Use this if NOTIFY gives a 400 error.
-- Changing a comment counts as a Schema change and forces PostgREST to refresh.

COMMENT ON TABLE public.sys_menu_layouts IS 'Layouts for navigation menus by role';

-- Re-apply grants just to be safe
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sys_menu_layouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sys_menu_layouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sys_menu_layouts TO service_role;
