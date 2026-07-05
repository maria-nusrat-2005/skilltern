
-- match_internships: switch to SECURITY INVOKER (RLS on internship_embeddings already allows authenticated reads)
CREATE OR REPLACE FUNCTION public.match_internships(query_embedding vector(768), match_count int DEFAULT 20)
RETURNS TABLE (
  internship_id UUID,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT ie.internship_id, 1 - (ie.embedding <=> query_embedding) AS similarity
  FROM public.internship_embeddings ie
  WHERE ie.embedding IS NOT NULL
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_internships(vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_internships(vector, int) TO authenticated, service_role;

-- internal trigger functions should not be API-callable
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
