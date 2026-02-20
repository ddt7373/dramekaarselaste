-- Add gebruiker_naam to lms_sertifikate for display
ALTER TABLE public.lms_sertifikate
ADD COLUMN IF NOT EXISTS gebruiker_naam text;
