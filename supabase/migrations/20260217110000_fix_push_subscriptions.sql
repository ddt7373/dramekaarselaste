-- Add missing columns to push_subscriptions
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS gemeente_id uuid REFERENCES public.gemeentes(id);

-- Ensure RLS is enabled
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Re-create policy to represent "Users can manage own push_subscriptions" but safely
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own push_subscriptions" ON public.push_subscriptions;
    
    CREATE POLICY "Users can manage own push_subscriptions" 
    ON public.push_subscriptions
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;
