
-- Public catalog: readable by everyone
GRANT SELECT ON public.internships TO anon, authenticated;
GRANT SELECT ON public.internship_embeddings TO authenticated;

-- User-owned tables: full CRUD for signed-in users (RLS scopes rows to auth.uid())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parsed_resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_gaps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory TO authenticated;

-- Service role: full access for server/admin operations
GRANT ALL ON public.internships TO service_role;
GRANT ALL ON public.internship_embeddings TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.resumes TO service_role;
GRANT ALL ON public.parsed_resumes TO service_role;
GRANT ALL ON public.resume_scores TO service_role;
GRANT ALL ON public.career_analysis TO service_role;
GRANT ALL ON public.internship_matches TO service_role;
GRANT ALL ON public.applications TO service_role;
GRANT ALL ON public.application_status_history TO service_role;
GRANT ALL ON public.skill_gaps TO service_role;
GRANT ALL ON public.project_recommendations TO service_role;
GRANT ALL ON public.chat_history TO service_role;
GRANT ALL ON public.ai_memory TO service_role;
