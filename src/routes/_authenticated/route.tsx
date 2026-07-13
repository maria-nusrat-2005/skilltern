import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = profile?.role;

    // 1. If role is not selected, redirect to /select-role
    if (!role && location.pathname !== "/select-role") {
      throw redirect({ to: "/select-role" });
    }

    // 2. Role-specific route access checks
    if (role === "student") {
      // If student hasn't completed onboarding, redirect to /onboarding
      if (profile?.onboarding_completed === false && location.pathname !== "/onboarding" && location.pathname !== "/select-role") {
        throw redirect({ to: "/onboarding" });
      }
      
      // If student tries to access company or admin routes, redirect to /dashboard
      if (location.pathname.startsWith("/company") || location.pathname.startsWith("/admin")) {
        throw redirect({ to: "/dashboard" });
      }
    } else if (role === "company") {
      // If company recruiter tries to access student routes or admin routes, redirect to /company
      const studentRoutes = [
        "/dashboard", "/matches", "/bookmarks", "/resume", "/assessments", "/applications", "/calendar", "/insights", "/assistant", "/profile", "/companies"
      ];
      const isStudentRoute = studentRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + "/"));
      if (isStudentRoute || location.pathname.startsWith("/admin") || location.pathname === "/onboarding") {
        throw redirect({ to: "/company" });
      }
    } else if (role === "admin") {
      // Admin should go to /admin by default if they access other dashboards
      if (location.pathname === "/dashboard" || location.pathname === "/company" || location.pathname === "/onboarding") {
        throw redirect({ to: "/admin" });
      }
    }

    return { user: data.user, role };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
