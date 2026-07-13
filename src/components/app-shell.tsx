import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  FileText,
  Target,
  MessageSquare,
  User,
  LogOut,
  Bookmark,
  GraduationCap,
  Building2,
  BarChart3,
  CalendarDays,
  Brain,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { CompareBar } from "@/components/compare-bits";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getProfileData } from "@/lib/profile.functions";

const studentNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/internships", label: "Internships", icon: Briefcase },
  { to: "/matches", label: "My Matches", icon: Sparkles },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/bookmarks", label: "Shortlist", icon: Bookmark },
  { to: "/resume", label: "Resume & Career", icon: FileText },
  { to: "/assessments", label: "Skill Tests", icon: Brain },
  { to: "/applications", label: "Applications", icon: Target },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/assistant", label: "AI Mentor", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const companyNav = [
  { to: "/company", label: "Recruiter Dashboard", icon: LayoutDashboard },
] as const;

const adminNav = [
  { to: "/admin", label: "Admin Panel", icon: LayoutDashboard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileData(),
  });

  const role = profileData?.profile?.role ?? "student";
  const nav = role === "admin" ? adminNav : role === "company" ? companyNav : studentNav;

  const initials =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ").map((p) => p[0]).slice(0, 2).join("") ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const displayName = profileData?.profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "User";
  const roleName = role === "admin" ? "Platform Admin" : role === "company" ? (profileData?.profile?.company_name ?? "Recruiter") : "Student";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <Brand to={role === "admin" ? "/admin" : role === "company" ? "/company" : "/dashboard"} />
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url as string | undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleName}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand to={role === "admin" ? "/admin" : role === "company" ? "/company" : "/dashboard"} />
        <Button size="icon" variant="ghost" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Mobile bottom nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-30 grid border-t border-border bg-background/95 backdrop-blur lg:hidden",
        role === "student" ? "grid-cols-5" : role === "company" ? "grid-cols-3" : "grid-cols-1"
      )}>
        {nav.slice(0, 5).map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <main className="pb-20 lg:pb-0 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      <CompareBar />
    </div>
  );
}
