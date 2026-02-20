-- ==============================================================================
-- FIX AUTH PERMISSIONS FOR CUSTOM AUTH SYSTEM
-- ==============================================================================

-- 1. GEBRUIKERS Permission Fixes
DO $$ 
BEGIN
  -- Enable RLS (safe if already enabled)
  ALTER TABLE IF EXISTS "public"."gebruikers" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- Drop policies to ensure idempotency
    DROP POLICY IF EXISTS "Anon can view gebruikers" ON "public"."gebruikers";
    DROP POLICY IF EXISTS "Anon can update gebruikers" ON "public"."gebruikers";
    
    -- Recreate policies
    CREATE POLICY "Anon can view gebruikers" 
    ON "public"."gebruikers"
    FOR SELECT 
    TO anon, authenticated, service_role
    USING (true);

    CREATE POLICY "Anon can update gebruikers" 
    ON "public"."gebruikers"
    FOR UPDATE
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- 2. LIDMAAT_VERHOUDINGS Permission Fixes
DO $$ 
BEGIN
  ALTER TABLE IF EXISTS "public"."lidmaat_verhoudings" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anon can view verhoudings" ON "public"."lidmaat_verhoudings";
    DROP POLICY IF EXISTS "Anon can insert verhoudings" ON "public"."lidmaat_verhoudings";
    DROP POLICY IF EXISTS "Anon can delete verhoudings" ON "public"."lidmaat_verhoudings";

    CREATE POLICY "Anon can view verhoudings" 
    ON "public"."lidmaat_verhoudings"
    FOR SELECT 
    TO anon, authenticated, service_role
    USING (true);

    CREATE POLICY "Anon can insert verhoudings" 
    ON "public"."lidmaat_verhoudings"
    FOR INSERT 
    TO anon, authenticated, service_role
    WITH CHECK (true);

    CREATE POLICY "Anon can delete verhoudings" 
    ON "public"."lidmaat_verhoudings"
    FOR DELETE
    TO anon, authenticated, service_role
    USING (true);
END $$;
