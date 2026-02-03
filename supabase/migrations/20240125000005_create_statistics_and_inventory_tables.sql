-- =====================================================
-- CONGREGATION STATISTICS & COMPLIANCE INVENTORY TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS congregation_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  congregation_id UUID REFERENCES gemeentes(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  
  baptized_members INTEGER NOT NULL DEFAULT 0,
  confessing_members INTEGER NOT NULL DEFAULT 0,
  total_souls INTEGER GENERATED ALWAYS AS (baptized_members + confessing_members) STORED,
  
  births INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  baptisms INTEGER DEFAULT 0,
  confirmations INTEGER DEFAULT 0,
  transfers_in INTEGER DEFAULT 0,
  transfers_out INTEGER DEFAULT 0,
  
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_congregation_year UNIQUE(congregation_id, year),
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_members CHECK (baptized_members >= 0 AND confessing_members >= 0)
);

CREATE INDEX IF NOT EXISTS idx_statistics_congregation ON congregation_statistics(congregation_id);
CREATE INDEX IF NOT EXISTS idx_statistics_year ON congregation_statistics(year DESC);

CREATE TABLE IF NOT EXISTS congregation_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  congregation_id UUID REFERENCES gemeentes(id) ON DELETE CASCADE NOT NULL,
  
  item_name TEXT NOT NULL,
  item_category TEXT,
  
  date_from DATE,
  date_to DATE,
  
  format TEXT CHECK (format IN ('paper', 'electronic', 'both')),
  
  is_compliant BOOLEAN DEFAULT false,
  compliance_notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_congregation_item UNIQUE(congregation_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_inventory_congregation ON congregation_inventory(congregation_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON congregation_inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_compliance ON congregation_inventory(is_compliant);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_statistics_timestamp ON congregation_statistics;
CREATE TRIGGER update_statistics_timestamp
  BEFORE UPDATE ON congregation_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_timestamp ON congregation_inventory;
CREATE TRIGGER update_inventory_timestamp
  BEFORE UPDATE ON congregation_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE congregation_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own congregation statistics" ON congregation_statistics;
CREATE POLICY "Users can view own congregation statistics"
  ON congregation_statistics FOR SELECT
  USING (
    congregation_id IN (
      SELECT congregation_id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage congregation statistics" ON congregation_statistics;
CREATE POLICY "Admins can manage congregation statistics"
  ON congregation_statistics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND congregation_id = congregation_statistics.congregation_id
      AND ('admin' = ANY(app_roles) OR 'minister' = ANY(app_roles))
    )
  );

ALTER TABLE congregation_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own congregation inventory" ON congregation_inventory;
CREATE POLICY "Users can view own congregation inventory"
  ON congregation_inventory FOR SELECT
  USING (
    congregation_id IN (
      SELECT congregation_id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage congregation inventory" ON congregation_inventory;
CREATE POLICY "Admins can manage congregation inventory"
  ON congregation_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND congregation_id = congregation_inventory.congregation_id
      AND ('admin' = ANY(app_roles) OR 'minister' = ANY(app_roles))
    )
  );
