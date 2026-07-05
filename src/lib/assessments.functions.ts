import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

function levelFromScore(score: number): string {
  if (score >= 85) return "Advanced";
  if (score >= 60) return "Intermediate";
  if (score >= 35) return "Beginner";
  return "Novice";
}

// 32-bit mulberry32 PRNG — small, deterministic, no deps.
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic partial Fisher–Yates shuffle. Same input + seed -> same output.
// Picks `n` items from `pool` in a stable order per (userId, skill, day).
function pickStable<T>(pool: T[], n: number, seedKey: string): T[] {
  const copy = pool.slice();
  const rng = mulberry32(hashSeed(seedKey));
  const out: T[] = [];
  const take = Math.min(n, copy.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    out.push(copy[i]);
  }
  return out;
}

/** Return the distinct active skill names from the seeded bank (sorted). */
export const listSkillNames = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("skill_questions")
      .select("skill")
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    const unique = [...new Set((data ?? []).map((r) => r.skill))].sort();
    return { skills: unique };
  });

/** Feature 13: Pick 5 questions from the seeded skill_questions bank for `skill`. */
export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { skill: string }) => {
    if (!d?.skill?.trim()) throw new Error("Pick a skill to be assessed on.");
    return { skill: d.skill.trim().slice(0, 60) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch the full seeded pool for this skill (max 10 by design).
    const { data: pool, error } = await supabase
      .from("skill_questions")
      .select("id, question, options, answer_index, explanation, difficulty")
      .eq("skill", data.skill)
      .eq("is_active", true);
    if (error) throw new Error(error.message);

    if (!pool || pool.length === 0) {
      throw new Error(`No seeded questions yet for "${data.skill}". Try another skill.`);
    }

    // Deterministic per (user, skill, UTC-day) so a user who refreshes
    // mid-quiz sees the same 5 questions in the same order.
    const seedKey = `${userId}:${data.skill}:${new Date().toISOString().slice(0, 10)}`;
    const picked = pickStable(pool, 5, seedKey);

    const questions: QuizQuestion[] = picked.map((q) => ({
      question: q.question,
      options: (q.options as string[]) ?? [],
      answer: typeof q.answer_index === "number" ? q.answer_index : 0,
      explanation: q.explanation ?? "",
    }));

    return { skill: data.skill, questions };
  });

/** Feature 13: Save a completed assessment result. */
export const saveAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      skill: string;
      correct: number;
      total: number;
      details: { question: string; correct: boolean }[];
    }) => {
      if (!d?.skill) throw new Error("skill is required");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.total || 1;
    const score = Math.round((data.correct / total) * 100);
    const { data: created, error } = await supabase
      .from("skill_assessments")
      .insert({
        user_id: userId,
        skill: data.skill,
        correct: data.correct,
        total: data.total,
        score,
        level: levelFromScore(score),
        details: data.details ?? [],
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

/** Feature 13: List the user's past assessments (latest first). */
export const listAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("skill_assessments")
      .select("id,skill,score,correct,total,level,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    // Best score per skill for the badge wall.
    const best = new Map<string, { skill: string; score: number; level: string }>();
    for (const a of data ?? []) {
      const cur = best.get(a.skill);
      if (!cur || a.score > cur.score) {
        best.set(a.skill, { skill: a.skill, score: a.score, level: a.level ?? "" });
      }
    }

    // Suggested skills from the latest career analysis.
    const { data: career } = await supabase
      .from("career_analysis")
      .select("missing_skills,recommended_technologies,career_domain")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .maybeSingle();

    const suggested = [
      ...((career?.missing_skills as string[]) ?? []),
      ...((career?.recommended_technologies as string[]) ?? []),
    ]
      .filter(Boolean)
      .slice(0, 12);

    return {
      history: data ?? [],
      best: [...best.values()].sort((a, b) => b.score - a.score),
      suggested,
      domain: career?.career_domain ?? null,
    };
  });
