-- RELOAD SCHEMA CACHE & VERIFY PERMISSIONS
-- Run this script to fix "no unique constraint" errors after table changes

-- 1. Explicitly grant permissions to anon/authenticated roles
GRANT ALL ON TABLE public.sys_menu_layouts TO anon;
GRANT ALL ON TABLE public.sys_menu_layouts TO authenticated;
GRANT ALL ON TABLE public.sys_menu_layouts TO service_role;

-- 2. Notify PostgREST to reload its schema cache
-- This is crucial after DROP/CREATE table operations if errors persist
NOTIFY pgrst, 'reload schema';
