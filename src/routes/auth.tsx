import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brand } from "@/components/brand";
import { Sparkles, FileText, Target } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Skilltern" },
      { name: "description", content: "Sign in to Skilltern to get AI-matched internships in Bangladesh." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error("Sign-in failed. Please try again.");
        setLoading(false);
        return;
      }
      // Supabase performs the redirect to Google, so we don't navigate here.
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Brand />
        <div className="mx-auto mt-16 w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome to Skilltern</h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to get AI-matched internships, instant resume scoring, and a personal career mentor.
          </p>
          <Card className="mt-8 p-6">
            <Button onClick={signIn} disabled={loading} size="lg" className="w-full gap-2">
              <GoogleIcon />
              {loading ? "Connecting…" : "Continue with Google"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing you agree to Skilltern's terms and privacy policy.
            </p>
          </Card>
          <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="hidden flex-col justify-center bg-sidebar p-16 lg:flex">
        <div className="max-w-md space-y-8">
          {[
            { icon: Sparkles, title: "AI internship matching", desc: "We rank 200+ live internships against your real skills and goals." },
            { icon: FileText, title: "Resume scoring", desc: "Get an ATS score and concrete fixes in seconds." },
            { icon: Target, title: "Close your skill gaps", desc: "Personalized projects and learning paths to become hireable." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
