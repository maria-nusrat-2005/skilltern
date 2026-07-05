-- Feature 7: Company reviews
CREATE TABLE public.company_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  role TEXT,
  title TEXT,
  body TEXT,
  pros TEXT,
  cons TEXT,
  author_label TEXT,
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_reviews TO authenticated;
GRANT ALL ON public.company_reviews TO service_role;
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read reviews" ON public.company_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add their own reviews" ON public.company_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own reviews" ON public.company_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.company_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_company_reviews_updated_at BEFORE UPDATE ON public.company_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_company_reviews_company ON public.company_reviews (company);

-- Feature 13: Skill assessments / quizzes
CREATE TABLE public.skill_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  level TEXT,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_assessments TO authenticated;
GRANT ALL ON public.skill_assessments TO service_role;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own assessments" ON public.skill_assessments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_skill_assessments_user ON public.skill_assessments (user_id);

-- Feature 17: Anonymized peer benchmarks (synthetic peers, no auth FK)
CREATE TABLE public.peer_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  readiness INTEGER NOT NULL,
  ats_score INTEGER NOT NULL,
  project_quality INTEGER NOT NULL,
  applications_count INTEGER NOT NULL DEFAULT 0,
  university TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.peer_benchmarks TO authenticated;
GRANT ALL ON public.peer_benchmarks TO service_role;
ALTER TABLE public.peer_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read benchmarks" ON public.peer_benchmarks FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_peer_benchmarks_domain ON public.peer_benchmarks (domain);

-- Feature 8: Smart alerts toggle on saved searches
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS notify BOOLEAN NOT NULL DEFAULT true;