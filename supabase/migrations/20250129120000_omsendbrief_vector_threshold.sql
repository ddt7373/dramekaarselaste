-- =============================================================================
-- OMSENDBRIEF: Verbeter vektor-soektog met minimum similarity-drempel
-- =============================================================================
-- Filter uit chunks wat nie genoeg ooreenstem met die vraag nie (bv. SAKOV
-- orreliste by 'n vraag oor reiskoste van predikante).
-- =============================================================================

CREATE OR REPLACE FUNCTION match_omsendbrief_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.52
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
    WHERE c.embedding IS NOT NULL
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
