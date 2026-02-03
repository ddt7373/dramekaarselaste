-- =====================================================
-- CLEAN SLATE: Drop existing profiles table if it exists
-- =====================================================

DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS get_full_name(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_display_name(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_congregation(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_congregation_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- MEMBER PROFILES TABLE (WITH DETAILED NAME FIELDS)
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  congregation_id UUID REFERENCES gemeentes(id) ON DELETE CASCADE NOT NULL,
  
  voorletters TEXT,
  first_name TEXT NOT NULL,
  second_name TEXT,
  third_name TEXT,
  noemnaam TEXT,
  surname TEXT NOT NULL,
  nooiensvan TEXT,
  
  cellphone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  title TEXT,
  gender TEXT CHECK (gender IN ('man', 'vrou', 'ander')),
  date_of_birth DATE,
  id_number TEXT,
  
  address_street TEXT,
  address_suburb TEXT,
  address_city TEXT,
  address_code TEXT,
  address_country TEXT DEFAULT 'Suid-Afrika',
  
  home_phone TEXT,
  work_phone TEXT,
  alternative_email TEXT,
  
  marital_status TEXT CHECK (marital_status IN ('ongetroud', 'getroud', 'geskei', 'weduwee', 'weduwenaar')),
  spouse_name TEXT,
  
  app_roles TEXT[] DEFAULT ARRAY['member']::TEXT[],
  portfolio TEXT,
  
  membership_date DATE,
  baptism_date DATE,
  confirmation_date DATE,
  
  photo_url TEXT,
  
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  notes TEXT,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_per_congregation UNIQUE(user_id, congregation_id),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_congregation_id ON profiles(congregation_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_cellphone ON profiles(cellphone);
CREATE INDEX idx_profiles_surname ON profiles(surname);
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_app_roles ON profiles USING GIN(app_roles);
CREATE INDEX idx_profiles_active ON profiles(active) WHERE active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view congregation members"
  ON profiles FOR SELECT
  USING (
    congregation_id IN (
      SELECT congregation_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all congregation profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.congregation_id = profiles.congregation_id
      AND ('admin' = ANY(p.app_roles) OR 'minister' = ANY(p.app_roles))
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update congregation profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.congregation_id = profiles.congregation_id
      AND ('admin' = ANY(p.app_roles) OR 'minister' = ANY(p.app_roles))
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.congregation_id = profiles.congregation_id
      AND ('admin' = ANY(p.app_roles) OR 'minister' = ANY(p.app_roles))
    )
  );
