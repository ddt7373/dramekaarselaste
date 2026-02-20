-- =============================================================================
-- OMSENDBRIEF: Filter by year (document created_at year)
-- =============================================================================
-- Optional p_filter_year: only search chunks from documents uploaded in that year.
-- NULL = all years.
-- =============================================================================

-- Drop old overloads so there is only one function each (avoids "function name is not unique" on COMMENT)
DROP FUNCTION IF EXISTS public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float);
DROP FUNCTION IF EXISTS public.match_omsendbrief_chunks(vector(768), int, float);

-- 1. match_omsendbrief_chunks: add optional year filter
CREATE OR REPLACE FUNCTION match_omsendbrief_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.52,
  p_filter_year int DEFAULT NULL
)
RETURNS TABLE (id uuid, content text, dokument_id uuid, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      c.id,
      c.content,
      c.dokument_id,
      1 - (c.embedding <=> query_embedding) AS sim
    FROM omsendbrief_chunks c
    JOIN omsendbrief_dokumente d ON d.id = c.dokument_id
    WHERE c.embedding IS NOT NULL
      AND (p_filter_year IS NULL OR EXTRACT(YEAR FROM d.created_at)::int = p_filter_year)
  )
  SELECT
    r.id,
    r.content,
    r.dokument_id,
    r.sim AS similarity
  FROM ranked r
  WHERE r.sim >= match_threshold
  ORDER BY r.sim DESC
  LIMIT match_count;
END;
$$;

-- 2. omsendbrief_hybrid_search: add optional year filter
CREATE OR REPLACE FUNCTION public.omsendbrief_hybrid_search(
  p_query_text TEXT,
  p_query_embedding vector(768),
  p_limit int DEFAULT 10,
  p_vector_weight float DEFAULT 0.5,
  p_fts_weight float DEFAULT 0.5,
  p_filter_year int DEFAULT NULL
)
RETURNS TABLE (
  chunk_id uuid,
  dokument_id uuid,
  content text,
  similarity float,
  fts_rank float,
  combined_score float,
  document_title text,
  original_file_url text,
  filename text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_fts_query tsquery;
  v_query_clean text;
BEGIN
  v_query_clean := TRIM(COALESCE(p_query_text, ''));
  v_fts_query := CASE
    WHEN v_query_clean = '' THEN to_tsquery('simple', 'x') && to_tsquery('simple', '!x')
    ELSE websearch_to_tsquery('simple', v_query_clean)
  END;

  RETURN QUERY
  WITH
  vector_results AS (
    SELECT
      c.id AS chunk_id,
      c.dokument_id,
      c.content,
      1 - (c.embedding <=> p_query_embedding) AS sim
    FROM omsendbrief_chunks c
    JOIN omsendbrief_dokumente d ON d.id = c.dokument_id
    WHERE c.embedding IS NOT NULL
      AND (p_filter_year IS NULL OR EXTRACT(YEAR FROM d.created_at)::int = p_filter_year)
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  fts_results AS (
    SELECT
      c.id AS chunk_id,
      c.dokument_id,
      c.content,
      ts_rank(
        to_tsvector('simple', COALESCE(c.content, '') || ' ' || COALESCE(d.metadata->>'title', '') || ' ' || COALESCE(d.content, '')),
        v_fts_query
      ) AS rnk
    FROM omsendbrief_chunks c
    JOIN omsendbrief_dokumente d ON d.id = c.dokument_id
    WHERE to_tsvector('simple', COALESCE(c.content, '') || ' ' || COALESCE(d.metadata->>'title', '') || ' ' || COALESCE(d.content, '')) @@ v_fts_query
      AND (p_filter_year IS NULL OR EXTRACT(YEAR FROM d.created_at)::int = p_filter_year)
    ORDER BY rnk DESC
    LIMIT p_limit * 2
  ),
  vector_norm AS (
    SELECT vr.*,
           COALESCE(
             (vr.sim - MIN(vr.sim) OVER ()) / NULLIF(MAX(vr.sim) OVER () - MIN(vr.sim) OVER (), 0),
             1
           ) AS norm_sim
    FROM vector_results vr
  ),
  fts_norm AS (
    SELECT fr.*,
           COALESCE(
             (fr.rnk - MIN(fr.rnk) OVER ()) / NULLIF(MAX(fr.rnk) OVER () - MIN(fr.rnk) OVER (), 0),
             1
           ) AS norm_rnk
    FROM fts_results fr
  ),
  merged AS (
    SELECT
      COALESCE(vn.chunk_id, fn.chunk_id) AS chunk_id,
      COALESCE(vn.dokument_id, fn.dokument_id) AS dokument_id,
      COALESCE(vn.content, fn.content) AS content,
      COALESCE(vn.sim, 0) AS similarity,
      COALESCE(fn.rnk, 0) AS fts_rank,
      (COALESCE(vn.norm_sim, 0) * p_vector_weight + COALESCE(fn.norm_rnk, 0) * p_fts_weight) AS combined_score
    FROM vector_norm vn
    FULL OUTER JOIN fts_norm fn ON vn.chunk_id = fn.chunk_id
  ),
  boosted AS (
    SELECT
      m.chunk_id,
      m.dokument_id,
      m.content,
      m.similarity,
      m.fts_rank,
      CASE
        WHEN d.metadata->>'title' IS NOT NULL
             AND LOWER(d.metadata->>'title') LIKE '%' || LOWER(p_query_text) || '%'
        THEN m.combined_score + 0.3
        ELSE m.combined_score
      END AS combined_score,
      d.metadata->>'title' AS document_title,
      d.original_file_url,
      d.filename
    FROM merged m
    JOIN omsendbrief_dokumente d ON d.id = m.dokument_id
  )
  SELECT
    b.chunk_id,
    b.dokument_id,
    b.content,
    b.similarity,
    b.fts_rank,
    b.combined_score,
    b.document_title,
    b.original_file_url,
    b.filename
  FROM boosted b
  ORDER BY b.combined_score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float, int) TO anon;
GRANT EXECUTE ON FUNCTION public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_omsendbrief_chunks(vector(768), int, float, int) TO anon;
GRANT EXECUTE ON FUNCTION public.match_omsendbrief_chunks(vector(768), int, float, int) TO authenticated;

COMMENT ON FUNCTION public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float, int) IS 'Hybrid search: vector + FTS. Optional p_filter_year: only documents from that year (created_at).';
COMMENT ON FUNCTION public.match_omsendbrief_chunks(vector(768), int, float, int) IS 'Vector similarity search. Optional p_filter_year: only documents from that year (created_at).';
