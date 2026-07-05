-- Skill assessment question bank.
-- 10 questions per tech, 5 picked per assessment at runtime.
-- Static, read-only for clients; the next migration seeds the rows.
CREATE TABLE public.skill_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INTEGER NOT NULL CHECK (answer_index BETWEEN 0 AND 3),
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy','Medium','Hard')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_questions_skill ON public.skill_questions (skill);
CREATE INDEX idx_skill_questions_active ON public.skill_questions (skill)
  WHERE is_active = true;

GRANT SELECT ON public.skill_questions TO authenticated, anon;
GRANT ALL ON public.skill_questions TO service_role;
ALTER TABLE public.skill_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skill questions readable by everyone"
  ON public.skill_questions FOR SELECT USING (true);