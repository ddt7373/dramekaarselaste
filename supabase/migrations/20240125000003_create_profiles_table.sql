-- =====================================================
-- MEMBER PROFILES TABLE (UPDATED WITH DETAILED NAME FIELDS)
-- All users are members with assigned roles
-- =====================================================

-- Create profiles table with detailed name structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  congregation_id UUID REFERENCES gemeentes(id) ON DELETE CASCADE NOT NULL,
  
  -- Detailed Name Fields (Afrikaans naming convention)
  voorletters TEXT,
  first_name TEXT NOT NULL,
  second_name TEXT,
  third_name TEXT,
  noemnaam TEXT,
  surname TEXT NOT NULL,
  nooiensvan TEXT,
  
  -- Contact Info (Required during onboarding)
  cellphone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Extended Info (Optional - filled by admin later)
  title TEXT,
  gender TEXT CHECK (gender IN ('man', 'vrou', 'ander')),
  date_of_birth DATE,
  id_number TEXT,
  
  -- Address Fields
  address_street TEXT,
  address_suburb TEXT,
  address_city TEXT,
  address_code TEXT,
  address_country TEXT DEFAULT 'Suid-Afrika',
  
  -- Additional Contact
  home_phone TEXT,
  work_phone TEXT,
  alternative_email TEXT,
  
  -- Family Info
  marital_status TEXT CHECK (marital_status IN ('ongetroud', 'getroud', 'geskei', 'weduwee', 'weduwenaar')),
  spouse_name TEXT,
  
  -- Role & Portfolio
  app_roles TEXT[] DEFAULT ARRAY['member']::TEXT[],
  portfolio TEXT,
  
  -- Membership Info
  membership_date DATE,
  baptism_date DATE,
  confirmation_date DATE,
  
  -- Media
  photo_url TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_per_congregation UNIQUE(user_id, congregation_id),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_congregation_id ON profiles(congregation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cellphone ON profiles(cellphone);
CREATE INDEX IF NOT EXISTS idx_profiles_surname ON profiles(surname);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_app_roles ON profiles USING GIN(app_roles);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active) WHERE active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view congregation members" ON profiles;
CREATE POLICY "Users can view congregation members"
  ON profiles FOR SELECT
  USING (
    congregation_id IN (
      SELECT congregation_id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all congregation profiles" ON profiles;
CREATE POLICY "Admins can view all congregation profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND congregation_id = profiles.congregation_id
      AND ('admin' = ANY(app_roles) OR 'minister' = ANY(app_roles))
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update congregation profiles" ON profiles;
CREATE POLICY "Admins can update congregation profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND congregation_id = profiles.congregation_id
      AND ('admin' = ANY(app_roles) OR 'minister' = ANY(app_roles))
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND congregation_id = profiles.congregation_id
      AND ('admin' = ANY(app_roles) OR 'minister' = ANY(app_roles))
    )
  );
