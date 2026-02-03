-- Geloofsonderrig vordering: unieke beperking vir upsert (een vordering per leerder per les)
-- Voorkom duplikate en maak upsert moontlik
-- Only run when table exists; safe for shadow DB.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering') THEN
    RETURN;
  END IF;
  DELETE FROM public.geloofsonderrig_vordering a
  USING public.geloofsonderrig_vordering b
  WHERE a.id > b.id AND a.leerder_id = b.leerder_id AND a.les_id = b.les_id;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'geloofsonderrig_vordering' AND constraint_name = 'geloofsonderrig_vordering_leerder_les_unique') THEN
    ALTER TABLE public.geloofsonderrig_vordering
      ADD CONSTRAINT geloofsonderrig_vordering_leerder_les_unique UNIQUE (leerder_id, les_id);
  END IF;
END $$;
