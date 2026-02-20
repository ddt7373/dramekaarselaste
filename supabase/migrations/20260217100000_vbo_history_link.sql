-- Make predikant_id nullable to allow importing data for unregistered users
ALTER TABLE vbo_historiese_punte ALTER COLUMN predikant_id DROP NOT NULL;

-- Add columns to store original CSV names for future matching
ALTER TABLE vbo_historiese_punte ADD COLUMN csv_naam text;
ALTER TABLE vbo_historiese_punte ADD COLUMN csv_van text;

-- Create function to automatically link historical points when a new user registers
CREATE OR REPLACE FUNCTION link_historical_vbo_and_stats() RETURNS TRIGGER AS $$
BEGIN
  -- Link VBO History
  UPDATE vbo_historiese_punte
  SET predikant_id = NEW.id
  WHERE predikant_id IS NULL
  AND lower(trim(csv_naam)) = lower(trim(NEW.naam))
  AND lower(trim(csv_van)) = lower(trim(NEW.van));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors (though strictly it shouldn't exist yet)
DROP TRIGGER IF EXISTS on_user_created_link_data ON gebruikers;

-- Create trigger
CREATE TRIGGER on_user_created_link_data
AFTER INSERT ON gebruikers
FOR EACH ROW
EXECUTE FUNCTION link_historical_vbo_and_stats();
