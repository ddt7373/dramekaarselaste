-- Fix jy_is_myne_children: remove FK to auth.users (app uses custom auth/gebruikers)
-- and drop any unique constraints that cause 409 Conflict on insert
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop user_id FK to auth.users if it exists (allows gebruikers.id)
  FOR r IN (
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.jy_is_myne_children'::regclass 
    AND contype = 'f' 
    AND conname LIKE '%user_id%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.jy_is_myne_children DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- Drop any unique constraints except primary key (can cause 409 on insert)
  FOR r IN (
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.jy_is_myne_children'::regclass 
    AND contype = 'u' 
    AND conname != 'jy_is_myne_children_pkey'
  ) LOOP
    EXECUTE format('ALTER TABLE public.jy_is_myne_children DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
