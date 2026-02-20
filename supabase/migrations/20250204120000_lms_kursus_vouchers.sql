-- =============================================================================
-- LMS Kursus vouchers: allow paying via Kuberkermis (e.g. gemeente buys for user)
-- =============================================================================

-- Link Kuberkermis product to LMS course (when set, buying this product creates vouchers)
ALTER TABLE public.kuberkermis_produkte
  ADD COLUMN IF NOT EXISTS lms_kursus_id uuid REFERENCES public.lms_kursusse(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.kuberkermis_produkte.lms_kursus_id IS 'When set, this product is a course voucher; purchase generates codes for this course.';

-- Vouchers: one row per code; redeemed by gebruiker_id when used at registration
CREATE TABLE IF NOT EXISTS public.lms_kursus_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_kode text NOT NULL UNIQUE,
  kursus_id uuid NOT NULL REFERENCES public.lms_kursusse(id) ON DELETE CASCADE,
  bestelling_id uuid REFERENCES public.kuberkermis_bestellings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  used_by uuid REFERENCES public.gebruikers(id) ON DELETE SET NULL,
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lms_kursus_vouchers_kode ON public.lms_kursus_vouchers(voucher_kode);
CREATE INDEX IF NOT EXISTS idx_lms_kursus_vouchers_kursus ON public.lms_kursus_vouchers(kursus_id);
CREATE INDEX IF NOT EXISTS idx_lms_kursus_vouchers_used ON public.lms_kursus_vouchers(used_by) WHERE used_by IS NOT NULL;

ALTER TABLE public.lms_kursus_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read vouchers" ON public.lms_kursus_vouchers;
CREATE POLICY "Read vouchers" ON public.lms_kursus_vouchers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert vouchers" ON public.lms_kursus_vouchers;
CREATE POLICY "Insert vouchers" ON public.lms_kursus_vouchers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update vouchers redeem" ON public.lms_kursus_vouchers;
CREATE POLICY "Update vouchers redeem" ON public.lms_kursus_vouchers FOR UPDATE USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.lms_kursus_vouchers TO anon, authenticated;
