import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_history")
      .select("id,role,content,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw new Error(error.message);
    return { messages: data ?? [] };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => {
    if (!d?.message?.trim()) throw new Error("Message is required");
    return { message: d.message.trim().slice(0, 2000) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { geminiGenerate } = await import("@/lib/gemini.server");

    await supabase.from("chat_history").insert({ user_id: userId, role: "user", content: data.message });

    const [{ data: profile }, { data: prefs }, { data: career }, { data: history }] = await Promise.all([
      supabase.from("profiles").select("full_name,location").eq("user_id", userId).maybeSingle(),
      supabase.from("user_preferences").select("preferred_roles,career_goals,work_model").eq("user_id", userId).maybeSingle(),
      supabase.from("career_analysis").select("career_domain,career_stage,missing_skills,recommended_roles").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("chat_history").select("role,content").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    const recent = (history ?? []).reverse();
    const convo = recent.map((m) => `${m.role === "user" ? "Student" : "Skilltern"}: ${m.content}`).join("\n");

    const system = `You are Skilltern's AI career mentor for students in Bangladesh seeking internships.
Be warm, concise, and practical. Give actionable advice on skills, resumes, projects, and internship strategy.
Use BDT and the local job market context when relevant. Keep replies under 180 words unless asked for detail.

Student context:
- Name: ${profile?.full_name ?? "unknown"}
- Location: ${profile?.location ?? "unknown"}
- Career goal: ${prefs?.career_goals ?? "not set"}
- Preferred roles: ${(prefs?.preferred_roles as string[] | null)?.join(", ") ?? "not set"}
- Career domain: ${career?.career_domain ?? "unknown"} (${career?.career_stage ?? "unknown"})
- Skills to build: ${(career?.missing_skills as string[] | null)?.join(", ") ?? "unknown"}`;

    const reply = await geminiGenerate({
      system,
      prompt: `${convo ? convo + "\n" : ""}Student: ${data.message}\nSkilltern:`,
      temperature: 0.7,
    });

    const clean = reply.trim() || "Sorry, I couldn't generate a response. Please try again.";
    await supabase.from("chat_history").insert({ user_id: userId, role: "assistant", content: clean });

    return { reply: clean };
  });
