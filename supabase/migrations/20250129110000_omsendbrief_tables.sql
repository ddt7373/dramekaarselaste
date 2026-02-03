-- =============================================================================
-- OMSENDBRIEF PORTAL, KLETSBOT & ANALISE
-- =============================================================================
-- Dokumente word opgelaai, gechunk en gevector. Kletsbot ondervra die inhoud.
-- Vrae word gelog vir analise.
-- =============================================================================

-- Enable pgvector for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Omsendbrief dokumente (metadata)
CREATE TABLE IF NOT EXISTS public.omsendbrief_dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES public.gebruikers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Omsendbrief chunks (tekst + embedding vir RAG)
-- Gemini text-embedding-004 uses 768 dimensions
CREATE TABLE IF NOT EXISTS public.omsendbrief_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dokument_id UUID NOT NULL REFERENCES public.omsendbrief_dokumente(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),  -- NULL until edge function processes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omsendbrief_chunks_dokument ON public.omsendbrief_chunks(dokument_id);
-- RPC vir vektor-soektog (cosine similarity)
CREATE OR REPLACE FUNCTION match_omsendbrief_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, dokument_id uuid, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.dokument_id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM omsendbrief_chunks c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Omsendbrief vrae (vir analise)
CREATE TABLE IF NOT EXISTS public.omsendbrief_vrae (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gebruiker_id UUID REFERENCES public.gebruikers(id),
  gemeente_id UUID REFERENCES public.gemeentes(id),
  vraag TEXT NOT NULL,
  antwoord TEXT,
  bron_chunk_ids UUID[],
  asked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omsendbrief_vrae_asked ON public.omsendbrief_vrae(asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_omsendbrief_vrae_gemeente ON public.omsendbrief_vrae(gemeente_id);

-- RLS
ALTER TABLE public.omsendbrief_dokumente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omsendbrief_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omsendbrief_vrae ENABLE ROW LEVEL SECURITY;

-- App uses custom auth - permissive policies; access control in frontend/edge function
CREATE POLICY "Allow all omsendbrief dokumente" ON public.omsendbrief_dokumente
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all omsendbrief chunks" ON public.omsendbrief_chunks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all omsendbrief vrae" ON public.omsendbrief_vrae
  FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket vir omsendbrief
INSERT INTO storage.buckets (id, name, public)
VALUES ('omsendbrief-dokumente', 'omsendbrief-dokumente', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow omsendbrief upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'omsendbrief-dokumente');

CREATE POLICY "Allow omsendbrief read" ON storage.objects
  FOR SELECT USING (bucket_id = 'omsendbrief-dokumente');
