-- =============================================================================
-- OMSENDBRIEF: Hybrid Search & Source Document Retrieval - Phase 1
-- =============================================================================
-- Schema updates for:
-- - original_file_url: direct link to raw PDF in Storage
-- - content: full document text (Markdown) for FTS
-- - metadata: JSONB for title, page numbers, etc.
-- - pg_trgm: optional extension for fuzzy matching
-- =============================================================================

-- Enable pg_trgm for flexible text search (optional, helps with ILIKE/trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to omsendbrief_dokumente
ALTER TABLE public.omsendbrief_dokumente
  ADD COLUMN IF NOT EXISTS original_file_url TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Backfill metadata from filename for existing rows (clean title: hyphens/underscores -> spaces)
UPDATE public.omsendbrief_dokumente
SET metadata = jsonb_build_object(
  'title',
  REPLACE(REPLACE(COALESCE(filename, ''), '-', ' '), '_', ' ')
)
WHERE metadata IS NULL OR metadata = '{}';

-- GIN index for full-text search on content and metadata->>'title'
-- Use 'simple' for language-agnostic search (Afrikaans/English compatible)
CREATE INDEX IF NOT EXISTS idx_omsendbrief_dokumente_content_fts
  ON public.omsendbrief_dokumente
  USING gin(to_tsvector('simple', COALESCE(content, '') || ' ' || COALESCE(metadata->>'title', '')));

-- GIN index on chunks content for hybrid search (chunk-level FTS)
CREATE INDEX IF NOT EXISTS idx_omsendbrief_chunks_content_fts
  ON public.omsendbrief_chunks
  USING gin(to_tsvector('simple', COALESCE(content, '')));

-- Make bucket public so getPublicUrl returns working download links
UPDATE storage.buckets SET public = true WHERE id = 'omsendbrief-dokumente';

COMMENT ON COLUMN public.omsendbrief_dokumente.original_file_url IS 'Direct link to raw PDF in Supabase Storage';
COMMENT ON COLUMN public.omsendbrief_dokumente.content IS 'Full document text in Markdown format';
COMMENT ON COLUMN public.omsendbrief_dokumente.metadata IS 'JSONB: title, page_numbers, etc.';
