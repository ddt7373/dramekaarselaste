-- FORCE PRIMARY KEY ON MENU LAYOUTS
-- Run this if you are getting "no unique or exclusion constraint matching the ON CONFLICT specification"

-- 1. Ensure 'role' is not null (requirement for PK)
ALTER TABLE public.sys_menu_layouts 
ALTER COLUMN role SET NOT NULL;

-- 2. Drop existing constraint if it exists (to avoid errors if we try to add it again)
-- Note: Constraint name depends on how it was created, usually sys_menu_layouts_pkey
ALTER TABLE public.sys_menu_layouts 
DROP CONSTRAINT IF EXISTS sys_menu_layouts_pkey;

-- 3. Add Primary Key constraint explicitly
ALTER TABLE public.sys_menu_layouts 
ADD CONSTRAINT sys_menu_layouts_pkey PRIMARY KEY (role);
