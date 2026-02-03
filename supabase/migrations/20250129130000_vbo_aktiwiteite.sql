-- =============================================================================
-- VBO AKTIWITEITE - Hoofadministrateur en VBO Moderator kan nuwe aktiwiteite skep
-- =============================================================================
-- Only create when lms_kursusse exists (FK); safe for shadow DB / db pull.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_kursusse') THEN
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS public.vbo_aktiwiteite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titel TEXT NOT NULL,
    beskrywing TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN ('kursus', 'konferensie', 'werkwinkel', 'mentorskap', 'navorsing', 'publikasie', 'ander')),
    krediete INTEGER NOT NULL DEFAULT 0,
    kursus_id UUID REFERENCES public.lms_kursusse(id) ON DELETE SET NULL,
    bewyse_verplig BOOLEAN DEFAULT true,
    aktief BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.gebruikers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_vbo_aktiwiteite_aktief ON public.vbo_aktiwiteite(aktief);
  CREATE INDEX IF NOT EXISTS idx_vbo_aktiwiteite_tipe ON public.vbo_aktiwiteite(tipe);

  ALTER TABLE public.vbo_aktiwiteite ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Allow all vbo_aktiwiteite" ON public.vbo_aktiwiteite;
  CREATE POLICY "Allow all vbo_aktiwiteite" ON public.vbo_aktiwiteite FOR ALL USING (true) WITH CHECK (true);

  INSERT INTO public.vbo_aktiwiteite (id, titel, beskrywing, tipe, krediete, bewyse_verplig, aktief) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'VTT Fisies Bygewoon', 'Bywoning van die Voortgesette Teologiese Toerusting (VTT) geleentheid in persoon.', 'konferensie', 30, true, true),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'VTT Aanlyn', 'Aanlyn deelname aan die Voortgesette Teologiese Toerusting (VTT) sessies.', 'konferensie', 15, true, true),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Predikantevergadering', 'Bywoning van die amptelike predikantevergadering.', 'konferensie', 8, true, true),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Ringskomitee Predikante Bygewoon', 'Bywoning van ringskomitee vergaderings vir predikante.', 'konferensie', 5, true, true),
    ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'NGK Lentekonferensie', 'Bywoning van die NGK Lentekonferensie of soortgelyke kongres.', 'konferensie', 30, true, true),
    ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Fresh Expressions', 'Deelname aan Fresh Expressions opleiding of werkwinkel.', 'werkwinkel', 15, true, true),
    ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Aanbiedings (Gesprek met die Bybel, VTT''s)', 'Aanbieding van sessies soos Gesprek met die Bybel, VTT sessies.', 'ander', 10, true, true),
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Internasionale Beroepsverwante Konferensie', 'Bywoning van internasionale beroepsverwante konferensies. Op meriete beoordeel.', 'konferensie', 0, true, true),
    ('c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Artikel Geskryf (HTS/THT)', 'Publikasie van ''n teologiese artikel in HTS of THT.', 'publikasie', 30, true, true),
    ('d9eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Eweknie-evaluasie', 'Deelname aan eweknie-evaluasie proses met mede-predikante.', 'mentorskap', 10, true, true),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Dagstukkies - Bybelse Dagboek (Radio)', 'Skryf van dagstukkies vir die Bybelse Dagboek radio-uitsending.', 'publikasie', 20, true, true),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Boek/Akademiese Artikel Gelees', 'Lees van ''n teologiese boek of akademiese artikel met opsomming.', 'navorsing', 4, true, true),
    ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Artikel vir Die Hervormer', 'Skryf van ''n artikel vir Die Hervormer kerkblad.', 'publikasie', 4, true, true),
    ('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'LMS Kursus Voltooi', 'Voltooiing van VBO-geskikte kursus in Geloofsgroei.', 'kursus', 5, false, true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Add FK from vbo_indienings to vbo_aktiwiteite (slegs as albei tabelle bestaan)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vbo_indienings')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vbo_aktiwiteite')
  AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_name = 'vbo_indienings_aktiwiteit_id_fkey') THEN
    ALTER TABLE public.vbo_indienings
      ADD CONSTRAINT vbo_indienings_aktiwiteit_id_fkey
      FOREIGN KEY (aktiwiteit_id) REFERENCES public.vbo_aktiwiteite(id) ON DELETE RESTRICT;
  END IF;
END $$;
