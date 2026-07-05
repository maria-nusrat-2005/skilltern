import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, FileText, Target, MessageSquare, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skilltern — AI internship matching for Bangladesh" },
      {
        name: "description",
        content:
          "Skilltern matches Bangladeshi students with the right internships using AI, scores your resume, and closes your skill gaps.",
      },
      { property: "og:title", content: "Skilltern — AI internship matching" },
      {
        property: "og:description",
        content: "Find internships that fit. AI matching, resume scoring, and skill-gap guidance for students in Bangladesh.",
      },
    ],
  }),
  component: Landing,
});

const companies = ["bKash", "Pathao", "Daraz", "Grameenphone", "BRAC", "10 Minute School", "Brain Station 23", "ShopUp"];

const features = [
  { icon: Sparkles, title: "AI internship matching", desc: "We rank 200+ live internships against your skills, projects, and goals — not just keywords." },
  { icon: FileText, title: "Instant resume scoring", desc: "Get an ATS score, strengths, weaknesses, and concrete fixes in seconds." },
  { icon: Target, title: "Skill-gap roadmaps", desc: "See exactly which skills to build and which projects make you hireable." },
  { icon: MessageSquare, title: "AI career mentor", desc: "Chat with a mentor that knows your profile and the Bangladeshi job market." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center sm:pt-20">
        <Badge variant="secondary" className="mb-6">
          Built for students in Bangladesh 🇧🇩
        </Badge>
        <h1 className="mx-auto max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Land the internship that actually fits you
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Skilltern uses AI to match you with the right internships, score your resume, and give you a clear plan to become hireable.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Browse internships</Link>
          </Button>
        </div>

        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Internships from companies students love
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
            {companies.map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-sidebar/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight">
            Everything you need to get hired
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">Ready to find your match?</h2>
        <p className="mt-3 text-muted-foreground">
          Join Skilltern and get matched in minutes. It's free for students.
        </p>
        <Button asChild size="lg" className="mt-8 gap-2">
          <Link to="/auth">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Brand />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Skilltern. Made in Bangladesh.</p>
        </div>
      </footer>
    </div>
  );
}
