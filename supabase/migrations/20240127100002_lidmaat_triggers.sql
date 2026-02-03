-- Trigger om status veranderinge (vermindering) te log
CREATE OR REPLACE FUNCTION log_lidmaat_status_verandering()
RETURNS TRIGGER AS $$
BEGIN
    -- As status verander na iets wat nie 'aktief' is nie (vermindering)
    IF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status IN ('oorlede', 'verhuis', 'bedank') THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermindering', NEW.lidmaat_status, 'Lidmaat status verander na ' || NEW.lidmaat_status);
    
    -- As status terug verander na 'aktief' (vermeerdering)
    ELSIF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status = 'aktief' THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'heraktiveer', 'Lidmaat weer aktief gemaak');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_lidmaat_status_verandering ON public.gebruikers;
CREATE TRIGGER tr_log_lidmaat_status_verandering
AFTER UPDATE OF lidmaat_status ON public.gebruikers
FOR EACH ROW EXECUTE FUNCTION log_lidmaat_status_verandering();
