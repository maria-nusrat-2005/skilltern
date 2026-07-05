import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalysisResult = {
  extracted: {
    summary: string;
    skills: string[];
    education: string[];
    experience: string[];
    projects: { name: string; description: string }[];
    contact?: {
      full_name?: string | null;
      location?: string | null;
      phone?: string | null;
      linkedin_url?: string | null;
      github_url?: string | null;
      portfolio_url?: string | null;
    };
  };
  scores: {
    overall_score: number;
    ats_score: number;
    completeness: number;
    formatting_score: number;
    technical_depth: number;
    project_quality: number;
    measurable_impact: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  career: {
    career_domain: string;
    career_stage: string;
    technical_maturity: string;
    internship_readiness: number;
    missing_skills: string[];
    recommended_roles: string[];
    recommended_technologies: string[];
    recommended_projects: { title: string; description: string; difficulty: string }[];
  };
};

// Merge resume-extracted contact details into the user's profile + preferences.
// Existing non-empty profile values are preserved; only blank fields get filled.
async function syncProfileFromResume(
  supabase: { from: (t: string) => any },
  userId: string,
  result: AnalysisResult,
) {
  const c = result.extracted.contact ?? {};
  const clean = (v: unknown) => {
    const s = (v ?? "").toString().trim();
    return s.length > 0 ? s : null;
  };

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const pick = (newV: unknown, oldV: unknown) => clean(oldV) ?? clean(newV);

  const merged = {
    full_name: pick(existing?.full_name, c.full_name),
    location: pick(existing?.location, c.location),
    phone: pick(existing?.phone, c.phone),
    linkedin_url: pick(existing?.linkedin_url, c.linkedin_url),
    github_url: pick(existing?.github_url, c.github_url),
    portfolio_url: pick(existing?.portfolio_url, c.portfolio_url),
  };

  const filled = Object.values(merged).filter((v) => v && String(v).trim().length > 0).length;

  await supabase
    .from("profiles")
    .update({ ...merged, profile_completion: Math.round((filled / 6) * 100) })
    .eq("user_id", userId);

  // Seed preferences from the resume only when the user hasn't set them yet.
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const roles = (result.career.recommended_roles ?? []).filter(Boolean).slice(0, 5);
  const techs = (result.extracted.skills ?? []).filter(Boolean).slice(0, 12);

  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preferred_roles: prefs?.preferred_roles?.length ? prefs.preferred_roles : roles,
      preferred_technologies: prefs?.preferred_technologies?.length
        ? prefs.preferred_technologies
        : techs,
      preferred_locations: prefs?.preferred_locations ?? [],
      work_model: prefs?.work_model ?? null,
      company_type: prefs?.company_type ?? null,
      min_salary: prefs?.min_salary ?? null,
      career_goals: prefs?.career_goals ?? null,
    },
    { onConflict: "user_id" },
  );
}

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { resumeText: string }) => {
    if (!d?.resumeText || d.resumeText.trim().length < 80) {
      throw new Error("Please paste a more complete resume (at least a few lines).");
    }
    return { resumeText: d.resumeText.slice(0, 16000) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { geminiJson } = await import("@/lib/gemini.server");

    const system =
      "You are an expert technical recruiter and resume reviewer for the Bangladeshi student internship market. " +
      "Be specific, honest, and constructive. Always respond with valid JSON only.";

    const prompt = `Analyze this resume and return JSON with this exact shape:
{
  "extracted": { "summary": string, "skills": string[], "education": string[], "experience": string[], "projects": [{"name": string, "description": string}], "contact": {"full_name": string, "location": string, "phone": string, "linkedin_url": string, "github_url": string, "portfolio_url": string} },
  "scores": { "overall_score": number, "ats_score": number, "completeness": number, "formatting_score": number, "technical_depth": number, "project_quality": number, "measurable_impact": number },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "career": { "career_domain": string, "career_stage": string, "technical_maturity": string, "internship_readiness": number, "missing_skills": string[], "recommended_roles": string[], "recommended_technologies": string[], "recommended_projects": [{"title": string, "description": string, "difficulty": string}] }
}
All scores are integers 0-100. Provide 3-5 items per list. career_stage is one of "Fresher", "Early", "Intermediate". technical_maturity is one of "Beginner", "Developing", "Strong". For "contact", extract the candidate's details from the resume header; use an empty string for any field not present (location should be a city/country, phone the contact number, and the URL fields full profile links).

RESUME:
${data.resumeText}`;

    const result = await geminiJson<AnalysisResult>({ system, prompt, temperature: 0.4 });

    const { data: resume, error: rErr } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: "Pasted resume",
        file_path: `paste/${userId}`,
        parsed: true,
        analysis_status: "complete",
      })
      .select("id")
      .single();
    if (rErr) throw new Error(rErr.message);

    await supabase.from("parsed_resumes").insert({
      user_id: userId,
      resume_id: resume.id,
      data: { raw: data.resumeText.slice(0, 4000), extracted: result.extracted },
    });


    await supabase.from("resume_scores").insert({
      user_id: userId,
      resume_id: resume.id,
      overall_score: result.scores.overall_score,
      ats_score: result.scores.ats_score,
      completeness: result.scores.completeness,
      formatting_score: result.scores.formatting_score,
      technical_depth: result.scores.technical_depth,
      project_quality: result.scores.project_quality,
      measurable_impact: result.scores.measurable_impact,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
      examples: [],
    });

    await supabase.from("career_analysis").delete().eq("user_id", userId);
    const { error: cErr } = await supabase.from("career_analysis").insert({
      user_id: userId,
      resume_id: resume.id,
      status: "complete",
      career_domain: result.career.career_domain,
      career_stage: result.career.career_stage,
      technical_maturity: result.career.technical_maturity,
      internship_readiness: result.career.internship_readiness,
      ats_score: result.scores.ats_score,
      project_quality: result.scores.project_quality,
      missing_skills: result.career.missing_skills,
      recommended_roles: result.career.recommended_roles,
      recommended_technologies: result.career.recommended_technologies,
      recommended_projects: result.career.recommended_projects,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    });
    if (cErr) throw new Error(cErr.message);

    await syncProfileFromResume(supabase, userId, result);

    return { resumeId: resume.id, ...result };
  });

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "txt",
};

export const analyzeResumeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; mimeType: string; fileBase64: string }) => {
    if (!d?.fileBase64 || d.fileBase64.length < 100) {
      throw new Error("The uploaded file looks empty. Please try another file.");
    }
    if (!ALLOWED_MIME[d.mimeType]) {
      throw new Error("Unsupported file type. Upload a PDF, Word document, or plain text file.");
    }
    // base64 length ~ 1.37x bytes; cap ~12MB original
    if (d.fileBase64.length > 16_000_000) {
      throw new Error("File is too large. Please upload a file under 10MB.");
    }
    return {
      fileName: (d.fileName || "resume").slice(0, 200),
      mimeType: d.mimeType,
      fileBase64: d.fileBase64,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { geminiJsonFromFile } = await import("@/lib/gemini.server");

    const system =
      "You are an expert technical recruiter and resume reviewer for the Bangladeshi student internship market. " +
      "Read the attached resume document carefully. Be specific, honest, and constructive. Always respond with valid JSON only.";

    const prompt = `Read the attached resume file and return JSON with this exact shape:
{
  "extracted": { "summary": string, "skills": string[], "education": string[], "experience": string[], "projects": [{"name": string, "description": string}], "contact": {"full_name": string, "location": string, "phone": string, "linkedin_url": string, "github_url": string, "portfolio_url": string}, "raw_text": string },
  "scores": { "overall_score": number, "ats_score": number, "completeness": number, "formatting_score": number, "technical_depth": number, "project_quality": number, "measurable_impact": number },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "career": { "career_domain": string, "career_stage": string, "technical_maturity": string, "internship_readiness": number, "missing_skills": string[], "recommended_roles": string[], "recommended_technologies": string[], "recommended_projects": [{"title": string, "description": string, "difficulty": string}] }
}
"raw_text" must contain the full plain-text content of the resume. All scores are integers 0-100. Provide 3-5 items per list. career_stage is one of "Fresher", "Early", "Intermediate". technical_maturity is one of "Beginner", "Developing", "Strong". For "contact", extract the candidate's details from the resume header; use an empty string for any field not present (location should be a city/country, phone the contact number, and the URL fields full profile links).`;

    const result = await geminiJsonFromFile<AnalysisResult & { extracted: { raw_text?: string } }>({
      system,
      prompt,
      fileBase64: data.fileBase64,
      mimeType: data.mimeType,
      temperature: 0.4,
    });

    // Upload original file to private storage bucket (best-effort).
    const ext = ALLOWED_MIME[data.mimeType];
    const filePath = `${userId}/${Date.now()}-resume.${ext}`;
    try {
      const bin = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
      await supabase.storage.from("resumes").upload(filePath, bin, {
        contentType: data.mimeType,
        upsert: true,
      });
    } catch {
      // ignore storage failures; analysis is the priority
    }

    const { data: resume, error: rErr } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: data.fileName,
        file_path: filePath,
        parsed: true,
        analysis_status: "complete",
      })
      .select("id")
      .single();
    if (rErr) throw new Error(rErr.message);

    await supabase.from("parsed_resumes").insert({
      user_id: userId,
      resume_id: resume.id,
      data: {
        raw: (result.extracted.raw_text ?? "").slice(0, 4000),
        extracted: result.extracted,
      },
    });

    await supabase.from("resume_scores").insert({
      user_id: userId,
      resume_id: resume.id,
      overall_score: result.scores.overall_score,
      ats_score: result.scores.ats_score,
      completeness: result.scores.completeness,
      formatting_score: result.scores.formatting_score,
      technical_depth: result.scores.technical_depth,
      project_quality: result.scores.project_quality,
      measurable_impact: result.scores.measurable_impact,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
      examples: [],
    });

    await supabase.from("career_analysis").delete().eq("user_id", userId);
    const { error: cErr } = await supabase.from("career_analysis").insert({
      user_id: userId,
      resume_id: resume.id,
      status: "complete",
      career_domain: result.career.career_domain,
      career_stage: result.career.career_stage,
      technical_maturity: result.career.technical_maturity,
      internship_readiness: result.career.internship_readiness,
      ats_score: result.scores.ats_score,
      project_quality: result.scores.project_quality,
      missing_skills: result.career.missing_skills,
      recommended_roles: result.career.recommended_roles,
      recommended_technologies: result.career.recommended_technologies,
      recommended_projects: result.career.recommended_projects,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    });
    if (cErr) throw new Error(cErr.message);

    await syncProfileFromResume(supabase, userId, result);

    return { resumeId: resume.id, ...result };
  });

export const getCareerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: career } = await supabase
      .from("career_analysis")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: score } = await supabase
      .from("resume_scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { career, score };
  });

export const reanalyzeResumeVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: resume, error: rErr } = await supabase
      .from("resumes")
      .select("id,file_path,file_name")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (rErr || !resume) throw new Error("Resume not found.");

    const { data: parsed } = await supabase
      .from("parsed_resumes")
      .select("data")
      .eq("resume_id", resume.id)
      .limit(1)
      .maybeSingle();

    let resumeText = "";
    if (parsed?.data && typeof parsed.data === "object") {
      const pData = parsed.data as any;
      resumeText = pData.raw || pData.extracted?.raw_text || "";
    }

    if (!resumeText && resume.file_path) {
      try {
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from("resumes")
          .download(resume.file_path);
        if (!downloadErr && fileData) {
          resumeText = await fileData.text();
        }
      } catch (e) {
        // ignore
      }
    }

    if (!resumeText || resumeText.trim().length < 80) {
      throw new Error("Could not find the resume text. Please upload it again.");
    }

    const { geminiJson } = await import("@/lib/gemini.server");
    const system =
      "You are an expert technical recruiter and resume reviewer for the Bangladeshi student internship market. " +
      "Be specific, honest, and constructive. Always respond with valid JSON only.";

    const prompt = `Analyze this resume and return JSON with this exact shape:
{
  "extracted": { "summary": string, "skills": string[], "education": string[], "experience": string[], "projects": [{"name": string, "description": string}], "contact": {"full_name": string, "location": string, "phone": string, "linkedin_url": string, "github_url": string, "portfolio_url": string} },
  "scores": { "overall_score": number, "ats_score": number, "completeness": number, "formatting_score": number, "technical_depth": number, "project_quality": number, "measurable_impact": number },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "career": { "career_domain": string, "career_stage": string, "technical_maturity": string, "internship_readiness": number, "missing_skills": string[], "recommended_roles": string[], "recommended_technologies": string[], "recommended_projects": [{"title": string, "description": string, "difficulty": string}] }
}
All scores are integers 0-100. Provide 3-5 items per list. career_stage is one of "Fresher", "Early", "Intermediate". technical_maturity is one of "Beginner", "Developing", "Strong". For "contact", extract the candidate's details from the resume header; use an empty string for any field not present (location should be a city/country, phone the contact number, and the URL fields full profile links).

RESUME:
${resumeText}`;

    const result = await geminiJson<AnalysisResult>({ system, prompt, temperature: 0.4 });

    await supabase.from("resume_scores").delete().eq("resume_id", resume.id);
    await supabase.from("resume_scores").insert({
      user_id: userId,
      resume_id: resume.id,
      overall_score: result.scores.overall_score,
      ats_score: result.scores.ats_score,
      completeness: result.scores.completeness,
      formatting_score: result.scores.formatting_score,
      technical_depth: result.scores.technical_depth,
      project_quality: result.scores.project_quality,
      measurable_impact: result.scores.measurable_impact,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
      examples: [],
    });

    await supabase.from("career_analysis").delete().eq("user_id", userId);
    await supabase.from("career_analysis").insert({
      user_id: userId,
      resume_id: resume.id,
      status: "complete",
      career_domain: result.career.career_domain,
      career_stage: result.career.career_stage,
      technical_maturity: result.career.technical_maturity,
      internship_readiness: result.career.internship_readiness,
      ats_score: result.scores.ats_score,
      project_quality: result.scores.project_quality,
      missing_skills: result.career.missing_skills,
      recommended_roles: result.career.recommended_roles,
      recommended_technologies: result.career.recommended_technologies,
      recommended_projects: result.career.recommended_projects,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    });

    await syncProfileFromResume(supabase, userId, result);

    return { resumeId: resume.id, ...result };
  });
