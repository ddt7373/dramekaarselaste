-- =====================================================
-- EXTEND GEMEENTES TABLE FOR HOOF ADMIN DASHBOARD
-- =====================================================
-- Only run when gemeentes (and dependent tables) exist (e.g. after full schema applied).
-- Safe for shadow DB / db pull when gemeentes is created elsewhere or in a later setup.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemeentes') THEN
    RETURN;
  END IF;

  -- Add additional fields to gemeentes table if they don't exist
  ALTER TABLE public.gemeentes
    ADD COLUMN IF NOT EXISTS ring TEXT,
    ADD COLUMN IF NOT EXISTS stigtingsdatum DATE,
    ADD COLUMN IF NOT EXISTS erediens_tye TEXT,
    ADD COLUMN IF NOT EXISTS last_data_update TIMESTAMP WITH TIME ZONE;

  -- Create index for last_data_update
  CREATE INDEX IF NOT EXISTS idx_gemeentes_last_update ON public.gemeentes(last_data_update DESC);
END $$;

-- Function to update last_data_update timestamp (always create; references gemeentes at runtime)
CREATE OR REPLACE FUNCTION update_gemeente_last_data_update()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemeentes') THEN
    UPDATE public.gemeentes
    SET last_data_update = NOW()
    WHERE id = NEW.congregation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers only if dependent tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'congregation_statistics') THEN
    DROP TRIGGER IF EXISTS trigger_update_gemeente_on_statistics ON public.congregation_statistics;
    CREATE TRIGGER trigger_update_gemeente_on_statistics
      AFTER INSERT OR UPDATE ON public.congregation_statistics
      FOR EACH ROW
      EXECUTE FUNCTION update_gemeente_last_data_update();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'congregation_inventory') THEN
    DROP TRIGGER IF EXISTS trigger_update_gemeente_on_inventory ON public.congregation_inventory;
    CREATE TRIGGER trigger_update_gemeente_on_inventory
      AFTER INSERT OR UPDATE ON public.congregation_inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_gemeente_last_data_update();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS trigger_update_gemeente_on_profiles ON public.profiles;
    CREATE TRIGGER trigger_update_gemeente_on_profiles
      AFTER INSERT OR UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_gemeente_last_data_update();
  END IF;
END $$;

-- =====================================================
-- VIEWS FOR HOOF ADMIN DASHBOARD (only if gemeentes exists)
-- =====================================================

DO $$
BEGIN
  -- Require gemeentes and dependent tables (created in later migrations) so view does not fail in shadow DB
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemeentes') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'congregation_statistics') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'congregation_inventory') THEN
    RETURN;
  END IF;

  -- View: Gemeente Summary with Stats and Compliance
  CREATE OR REPLACE VIEW hoof_admin_gemeente_summary AS
  SELECT 
    g.id,
    g.naam,
    g.ring,
    g.stigtingsdatum,
    g.erediens_tye,
    g.adres,
    g.telefoon,
    g.epos,
    g.webwerf,
    g.aktief,
    g.last_data_update,
    (SELECT cs.total_souls FROM congregation_statistics cs WHERE cs.congregation_id = g.id ORDER BY cs.year DESC LIMIT 1) as latest_total_souls,
    (SELECT cs.baptized_members FROM congregation_statistics cs WHERE cs.congregation_id = g.id ORDER BY cs.year DESC LIMIT 1) as latest_baptized,
    (SELECT cs.confessing_members FROM congregation_statistics cs WHERE cs.congregation_id = g.id ORDER BY cs.year DESC LIMIT 1) as latest_confessing,
    (SELECT cs.year FROM congregation_statistics cs WHERE cs.congregation_id = g.id ORDER BY cs.year DESC LIMIT 1) as latest_stats_year,
    (SELECT p.id FROM profiles p WHERE p.congregation_id = g.id AND 'minister' = ANY(p.app_roles) AND p.active = true LIMIT 1) as predikant_id,
    (SELECT COALESCE(p.title || ' ', '') || p.first_name || ' ' || p.surname FROM profiles p WHERE p.congregation_id = g.id AND 'minister' = ANY(p.app_roles) AND p.active = true LIMIT 1) as predikant_naam,
    (SELECT p.cellphone FROM profiles p WHERE p.congregation_id = g.id AND 'minister' = ANY(p.app_roles) AND p.active = true LIMIT 1) as predikant_sel,
    (SELECT p.email FROM profiles p WHERE p.congregation_id = g.id AND 'minister' = ANY(p.app_roles) AND p.active = true LIMIT 1) as predikant_epos,
    (SELECT p.id FROM profiles p WHERE p.congregation_id = g.id AND p.portfolio ILIKE '%skriba%' AND p.active = true LIMIT 1) as skriba_id,
    (SELECT p.first_name || ' ' || p.surname FROM profiles p WHERE p.congregation_id = g.id AND p.portfolio ILIKE '%skriba%' AND p.active = true LIMIT 1) as skriba_naam,
    (SELECT p.cellphone FROM profiles p WHERE p.congregation_id = g.id AND p.portfolio ILIKE '%skriba%' AND p.active = true LIMIT 1) as skriba_sel,
    (SELECT p.email FROM profiles p WHERE p.congregation_id = g.id AND p.portfolio ILIKE '%skriba%' AND p.active = true LIMIT 1) as skriba_epos,
    (SELECT COUNT(*) FROM congregation_inventory ci WHERE ci.congregation_id = g.id) as total_inventory_items,
    (SELECT COUNT(*) FROM congregation_inventory ci WHERE ci.congregation_id = g.id AND ci.is_compliant = true) as compliant_items,
    (SELECT CASE WHEN COUNT(*) = 0 THEN false WHEN COUNT(*) FILTER (WHERE is_compliant = true) = COUNT(*) THEN true ELSE false END FROM congregation_inventory ci WHERE ci.congregation_id = g.id) as is_fully_compliant
  FROM public.gemeentes g
  WHERE g.aktief = true;

  -- View: Non-Compliant Inventory Items (only if congregation_inventory exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'congregation_inventory') THEN
    CREATE OR REPLACE VIEW non_compliant_inventory AS
    SELECT 
      g.naam as gemeente_naam,
      ci.item_name,
      ci.item_category,
      ci.date_from,
      ci.date_to,
      ci.format,
      ci.is_compliant,
      ci.compliance_notes,
      CASE 
        WHEN ci.date_from IS NULL OR ci.date_to IS NULL THEN 'Datums ontbreek'
        WHEN ci.format IS NULL THEN 'Formaat nie gespesifiseer'
        WHEN ci.is_compliant = false THEN 'Nie voldoen nie'
        ELSE 'Ander probleem'
      END as issue_type
    FROM public.congregation_inventory ci
    JOIN public.gemeentes g ON g.id = ci.congregation_id
    WHERE ci.is_compliant = false OR ci.date_from IS NULL OR ci.date_to IS NULL OR ci.format IS NULL
    ORDER BY g.naam, ci.item_category, ci.item_name;
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS (depend on view; view only exists when gemeentes + deps exist)
-- =====================================================

CREATE OR REPLACE FUNCTION get_total_church_souls()
RETURNS INTEGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'hoof_admin_gemeente_summary') THEN
    RETURN 0;
  END IF;
  RETURN (
    SELECT COALESCE(SUM(latest_total_souls), 0)::INTEGER
    FROM hoof_admin_gemeente_summary
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_compliant_congregations_count()
RETURNS INTEGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'hoof_admin_gemeente_summary') THEN
    RETURN 0;
  END IF;
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM hoof_admin_gemeente_summary
    WHERE is_fully_compliant = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS (only if gemeentes exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemeentes') THEN
    EXECUTE 'COMMENT ON COLUMN public.gemeentes.ring IS ''Ring/Region that the congregation belongs to''';
    EXECUTE 'COMMENT ON COLUMN public.gemeentes.stigtingsdatum IS ''Date the congregation was founded''';
    EXECUTE 'COMMENT ON COLUMN public.gemeentes.erediens_tye IS ''Service times (e.g., Sondae 09:00 & 18:00)''';
    EXECUTE 'COMMENT ON COLUMN public.gemeentes.last_data_update IS ''Last time any data was updated for this congregation''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'hoof_admin_gemeente_summary') THEN
    EXECUTE 'COMMENT ON VIEW hoof_admin_gemeente_summary IS ''Comprehensive summary of all congregations for Hoof Admin dashboard''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'non_compliant_inventory') THEN
    EXECUTE 'COMMENT ON VIEW non_compliant_inventory IS ''List of all non-compliant or incomplete inventory items across all congregations''';
  END IF;
END $$;
