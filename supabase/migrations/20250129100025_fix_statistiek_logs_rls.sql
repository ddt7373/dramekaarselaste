-- =============================================================================
-- FIX GEMEENTE_STATISTIEK_LOGS RLS VIR TRIGGER INSERTS
-- =============================================================================
-- Die log_lidmaat_vermeerdering en log_lidmaat_status_verandering triggers
-- probeer INSERT in gemeente_statistiek_logs. RLS blokkeer dit omdat die
-- aanroeper nie die regte policy het nie. SECURITY DEFINER laat die funksies
-- as die tabel-eienaar loop, sodat die trigger altyd kan skryf.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_lidmaat_vermeerdering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
    VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'nuwe_registrasie', 'Lidmaat bygevoeg of geregistreer');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_lidmaat_status_verandering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status IN ('oorlede', 'verhuis', 'bedank') THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermindering', NEW.lidmaat_status, 'Lidmaat status verander na ' || NEW.lidmaat_status);
    ELSIF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status = 'aktief' THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'heraktiveer', 'Lidmaat weer aktief gemaak');
    END IF;
    RETURN NEW;
END;
$$;
