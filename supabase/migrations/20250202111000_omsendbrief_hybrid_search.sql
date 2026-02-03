-- =============================================================================
-- OMSENDBRIEF: Hybrid Search RPC - Phase 3
-- =============================================================================
-- Combines vector search (cosine similarity) and full-text search.
-- Boosts results when document title matches query (e.g. "Verlofreglement").
-- =============================================================================

CREATE OR REPLACE FUNCTION public.omsendbrief_hybrid_search(
  p_query_text TEXT,
  p_query_embedding vector(768),
  p_limit int DEFAULT 10,
  p_vector_weight float DEFAULT 0.5,
  p_fts_weight float DEFAULT 0.5
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
  -- Build FTS query from user input (websearch_to_tsquery handles phrases, AND/OR)
  v_query_clean := TRIM(COALESCE(p_query_text, ''));
  v_fts_query := CASE
    WHEN v_query_clean = '' THEN to_tsquery('simple', 'x') && to_tsquery('simple', '!x')  -- matches nothing
    ELSE websearch_to_tsquery('simple', v_query_clean)
  END;

  RETURN QUERY
  WITH
  -- Vector search: top chunks by cosine similarity
  vector_results AS (
    SELECT
      c.id AS chunk_id,
      c.dokument_id,
      c.content,
      1 - (c.embedding <=> p_query_embedding) AS sim
    FROM omsendbrief_chunks c
    WHERE c.embedding IS NOT NULL
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT p_limit * 2  -- fetch more for merging
  ),
  -- FTS search: chunks + document title
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
    ORDER BY rnk DESC
    LIMIT p_limit * 2
  ),
  -- Normalize and combine scores (0-1 range); when all same, use 1
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
  -- Merge: union chunks from both, take best score per chunk
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
  -- Title match boost: if query appears in document title, boost combined_score
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
        THEN m.combined_score + 0.3  -- boost for title match
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

-- Grant execute to anon and authenticated (app uses custom auth)
GRANT EXECUTE ON FUNCTION public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float) TO anon;
GRANT EXECUTE ON FUNCTION public.omsendbrief_hybrid_search(TEXT, vector(768), int, float, float) TO authenticated;

COMMENT ON FUNCTION public.omsendbrief_hybrid_search IS 'Hybrid search: vector + FTS. Boosts results when document title matches query.';
