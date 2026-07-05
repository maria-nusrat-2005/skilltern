
CREATE EXTENSION IF NOT EXISTS vector;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  location TEXT,
  phone TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  profile_completion INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- resumes
-- =========================================================
CREATE TABLE public.resumes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parsed BOOLEAN NOT NULL DEFAULT false,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_resumes_updated BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- parsed_resumes
-- =========================================================
CREATE TABLE public.parsed_resumes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parsed_resumes TO authenticated;
GRANT ALL ON public.parsed_resumes TO service_role;
ALTER TABLE public.parsed_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own parsed_resumes" ON public.parsed_resumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_parsed_resumes_updated BEFORE UPDATE ON public.parsed_resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- career_analysis
-- =========================================================
CREATE TABLE public.career_analysis (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  career_domain TEXT,
  career_stage TEXT,
  industry_preference TEXT,
  technical_maturity TEXT,
  internship_readiness INT,
  ats_score INT,
  project_quality INT,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_analysis TO authenticated;
GRANT ALL ON public.career_analysis TO service_role;
ALTER TABLE public.career_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own career_analysis" ON public.career_analysis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_career_analysis_updated BEFORE UPDATE ON public.career_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ai_memory
-- =========================================================
CREATE TABLE public.ai_memory (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory TO authenticated;
GRANT ALL ON public.ai_memory TO service_role;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai_memory" ON public.ai_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ai_memory_updated BEFORE UPDATE ON public.ai_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- internships (catalog)
-- =========================================================
CREATE TABLE public.internships (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_type TEXT NOT NULL,
  location TEXT NOT NULL,
  salary TEXT,
  duration TEXT,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_level TEXT,
  work_model TEXT,
  domain TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internships TO authenticated, anon;
GRANT ALL ON public.internships TO service_role;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internships readable by everyone" ON public.internships FOR SELECT USING (true);

-- =========================================================
-- internship_embeddings
-- =========================================================
CREATE TABLE public.internship_embeddings (
  internship_id UUID NOT NULL PRIMARY KEY REFERENCES public.internships(id) ON DELETE CASCADE,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internship_embeddings TO authenticated;
GRANT ALL ON public.internship_embeddings TO service_role;
ALTER TABLE public.internship_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internship embeddings readable by authenticated" ON public.internship_embeddings FOR SELECT TO authenticated USING (true);
CREATE INDEX internship_embeddings_idx ON public.internship_embeddings USING hnsw (embedding vector_cosine_ops);

-- =========================================================
-- internship_matches
-- =========================================================
CREATE TABLE public.internship_matches (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  overall_score INT NOT NULL DEFAULT 0,
  technical_score INT NOT NULL DEFAULT 0,
  project_score INT NOT NULL DEFAULT 0,
  experience_score INT NOT NULL DEFAULT 0,
  industry_score INT NOT NULL DEFAULT 0,
  explanation TEXT,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_effort TEXT,
  learning_path JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, internship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_matches TO authenticated;
GRANT ALL ON public.internship_matches TO service_role;
ALTER TABLE public.internship_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own matches" ON public.internship_matches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- applications
-- =========================================================
CREATE TABLE public.applications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'saved',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, internship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON public.applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- application_status_history
-- =========================================================
CREATE TABLE public.application_status_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own status history" ON public.application_status_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- chat_history
-- =========================================================
CREATE TABLE public.chat_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT ALL ON public.chat_history TO service_role;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat" ON public.chat_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- skill_gaps
-- =========================================================
CREATE TABLE public.skill_gaps (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_gaps TO authenticated;
GRANT ALL ON public.skill_gaps TO service_role;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own skill_gaps" ON public.skill_gaps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_skill_gaps_updated BEFORE UPDATE ON public.skill_gaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- resume_scores
-- =========================================================
CREATE TABLE public.resume_scores (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  ats_score INT,
  formatting_score INT,
  project_quality INT,
  measurable_impact INT,
  technical_depth INT,
  completeness INT,
  overall_score INT,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_scores TO authenticated;
GRANT ALL ON public.resume_scores TO service_role;
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resume_scores" ON public.resume_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- project_recommendations
-- =========================================================
CREATE TABLE public.project_recommendations (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  domain TEXT,
  difficulty TEXT,
  related_internships JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_recommendations TO authenticated;
GRANT ALL ON public.project_recommendations TO service_role;
ALTER TABLE public.project_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own project_recommendations" ON public.project_recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- user_preferences
-- =========================================================
CREATE TABLE public.user_preferences (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  work_model TEXT,
  company_type TEXT,
  min_salary INT,
  career_goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- similarity search function (top-k internships by cosine distance)
-- =========================================================
CREATE OR REPLACE FUNCTION public.match_internships(query_embedding vector(768), match_count int DEFAULT 20)
RETURNS TABLE (
  internship_id UUID,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ie.internship_id, 1 - (ie.embedding <=> query_embedding) AS similarity
  FROM public.internship_embeddings ie
  WHERE ie.embedding IS NOT NULL
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- =========================================================
-- storage policies for the private "resumes" bucket
-- files are stored under <user_id>/<filename>
-- =========================================================
CREATE POLICY "Users read own resume files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own resume files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own resume files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own resume files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
