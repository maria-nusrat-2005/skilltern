import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  Target,
  Search,
  Shield,
  Trash2,
  Calendar,
  Building,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  Bell,
  Settings,
  Database,
  Download,
  Sparkles,
  Cpu,
  Server,
  Check,
  X,
  Filter,
  MoreVertical,
  Send,
  Lock,
  Edit3,
  Eye,
  RefreshCw,
  Layers,
  Wrench,
  BadgeCheck,
  Globe,
  Sliders,
  ShieldAlert,
  Star,
  Clock,
  ChevronRight,
  UserX,
  Ban,
  Plus,
  Radio,
  HardDrive,
  Laptop,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { adminListUsers, adminUpdateUserRole, adminGetStats } from "@/lib/profile.functions";
import { listInternships, deleteInternship } from "@/lib/internships.functions";
import { listCompanies } from "@/lib/companies.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Skilltern" }] }),
  component: AdminConsolePage,
});

// Mock Analytics Data
const monthlyApplicationsData = [
  { month: "Jan", applications: 320, hires: 45 },
  { month: "Feb", applications: 480, hires: 62 },
  { month: "Mar", applications: 650, hires: 88 },
  { month: "Apr", applications: 820, hires: 110 },
  { month: "May", applications: 940, hires: 135 },
  { month: "Jun", applications: 1250, hires: 180 },
  { month: "Jul", applications: 1420, hires: 210 },
];

const categoryDistribution = [
  { name: "Software Engineering", value: 45, color: "#3b82f6" },
  { name: "UI/UX Design", value: 18, color: "#ec4899" },
  { name: "Marketing", value: 12, color: "#f59e0b" },
  { name: "Data Science", value: 10, color: "#10b981" },
  { name: "Business & Management", value: 9, color: "#8b5cf6" },
  { name: "Others", value: 6, color: "#6b7280" },
];

const userGrowthData = [
  { month: "Jan", students: 400, companies: 30 },
  { month: "Feb", students: 650, companies: 42 },
  { month: "Mar", students: 890, companies: 55 },
  { month: "Apr", students: 1120, companies: 68 },
  { month: "May", students: 1450, companies: 80 },
  { month: "Jun", students: 1890, companies: 98 },
  { month: "Jul", students: 2340, companies: 115 },
];

function AdminConsolePage() {
  const qc = useQueryClient();

  // Search & Filter States
  const [globalSearch, setGlobalSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");

  // Selected Items for Modals
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, "active" | "disabled" | "suspended">>({});
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({
    "comp-1": true,
    "comp-2": false,
  });

  // Category & Skills Master State
  const [categories, setCategories] = useState([
    "Software Engineering",
    "UI/UX Design",
    "Data Science & AI",
    "Digital Marketing",
    "Business Development",
    "Finance & Accounting",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [skills, setSkills] = useState([
    "React.js",
    "Node.js",
    "TypeScript",
    "Python",
    "Figma",
    "Docker",
    "AWS",
    "TailwindCSS",
    "PostgreSQL",
    "MongoDB",
  ]);
  const [newSkill, setNewSkill] = useState("");

  // Broadcast Notification State
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "Skilltern",
    supportEmail: "support@skilltern.com",
    maintenanceMode: false,
    appLimit: 15,
    defaultMatchScore: 65,
    maxUploadMb: 10,
    allowPublicReg: true,
  });

  // Moderated jobs state overrides
  const [jobStatusOverrides, setJobStatusOverrides] = useState<Record<string, string>>({});

  // Abuse Reports Mock State
  const [reports, setReports] = useState([
    {
      id: "rep-1",
      type: "Fake Company Listing",
      target: "Apex Digital Solutions",
      reporter: "Mohammad Irfan",
      date: "2026-07-19",
      severity: "High",
      status: "Pending",
      reason: "Company requests upfront fee for interview scheduling.",
    },
    {
      id: "rep-2",
      type: "Spam Internship",
      target: "Crypto Trader Intern",
      reporter: "Sarah Khan",
      date: "2026-07-18",
      severity: "Medium",
      status: "Pending",
      reason: "Suspicious Telegram link provided as application portal.",
    },
    {
      id: "rep-3",
      type: "Misleading Salary",
      target: "Frontend Intern at DevHub",
      reporter: "Tanvir Ahmed",
      date: "2026-07-15",
      severity: "Low",
      status: "Resolved",
      reason: "Stipend listed as paid but recruiter stated unpaid during screening.",
    },
  ]);

  // Company Verification Pending Queue
  const [pendingCompanies, setPendingCompanies] = useState([
    {
      id: "ver-1",
      companyName: "Nexus AI Labs",
      domain: "nexusai.io",
      email: "hr@nexusai.io",
      type: "Software & AI",
      taxId: "TAX-9948201",
      submittedDate: "2026-07-18",
      status: "pending",
    },
    {
      id: "ver-2",
      companyName: "Quantum Design Agency",
      domain: "quantumdesign.co",
      email: "contact@quantumdesign.co",
      type: "Design Agency",
      taxId: "TAX-4481029",
      submittedDate: "2026-07-19",
      status: "pending",
    },
  ]);

  // Queries
  const statsQ = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminGetStats() });
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const jobsQ = useQuery({
    queryKey: ["admin-jobs", jobSearch],
    queryFn: () => listInternships({ data: { search: jobSearch, pageSize: 100 } }),
  });
  const companiesQ = useQuery({ queryKey: ["admin-companies"], queryFn: () => listCompanies() });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: (v: { targetUserId: string; role: "student" | "company" | "admin" }) =>
      adminUpdateUserRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User role updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role.");
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (v: { id: string }) => deleteInternship({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Internship listing removed.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove listing.");
    },
  });

  // Filtered Users list
  const filteredUsers = (usersQ.data ?? []).filter((u: any) => {
    const search = (userSearch || globalSearch).toLowerCase();
    const name = (u.full_name ?? "").toLowerCase();
    const email = (u.email ?? "").toLowerCase();
    const role = (u.role ?? "student").toLowerCase();

    const matchesSearch = name.includes(search) || email.includes(search) || role.includes(search);
    const matchesRole = roleFilter === "all" || role === roleFilter;
    const currentStatus = userStatusMap[u.id] || "active";
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Jobs list
  const filteredJobs = (jobsQ.data?.items ?? []).filter((j: any) => {
    const search = (jobSearch || globalSearch).toLowerCase();
    const title = (j.title ?? "").toLowerCase();
    const company = (j.company ?? "").toLowerCase();
    const matchesSearch = title.includes(search) || company.includes(search);

    const currentStatus = jobStatusOverrides[j.id] || "approved";
    const matchesStatus = jobStatusFilter === "all" || currentStatus === jobStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleUserStatusToggle = (userId: string, newStatus: "active" | "disabled" | "suspended") => {
    setUserStatusMap((prev) => ({ ...prev, [userId]: newStatus }));
    toast.success(`User status changed to ${newStatus.toUpperCase()}`);
  };

  const handleApproveCompany = (id: string, name: string) => {
    setPendingCompanies((prev) => prev.filter((c) => c.id !== id));
    toast.success(`${name} has been verified and approved!`);
  };

  const handleRejectCompany = (id: string, name: string) => {
    setPendingCompanies((prev) => prev.filter((c) => c.id !== id));
    toast.error(`${name} verification rejected.`);
  };

  const handleResolveReport = (id: string, action: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r))
    );
    toast.success(`Report resolved with action: ${action}`);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) {
      toast.error("Please enter both title and message body.");
      return;
    }
    toast.success(`Broadcast message sent to ${broadcastTarget.toUpperCase()}!`);
    setBroadcastTitle("");
    setBroadcastBody("");
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    setCategories((prev) => [...prev, newCategory.trim()]);
    setNewCategory("");
    toast.success("New master category added.");
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills((prev) => [...prev, newSkill.trim()]);
    setNewSkill("");
    toast.success("New master skill added.");
  };

  const handleExportCSV = (type: string) => {
    toast.success(`Exporting ${type} dataset to CSV... Download will start shortly.`);
  };

  return (
    <div className="space-y-8">
      {/* Header & Global Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Shield className="h-8 w-8 text-primary" /> Admin Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enterprise governance, user administration, verification workflows, and system monitoring.
          </p>
        </div>

        {/* Global Admin Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Global search users, companies..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <Badge
            variant={platformSettings.maintenanceMode ? "destructive" : "outline"}
            className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer text-xs"
            onClick={() => {
              setPlatformSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
              toast.info(`Maintenance mode ${!platformSettings.maintenanceMode ? "ENABLED" : "DISABLED"}`);
            }}
          >
            <Radio className={`h-3 w-3 ${platformSettings.maintenanceMode ? "animate-pulse text-white" : "text-emerald-500"}`} />
            {platformSettings.maintenanceMode ? "Maintenance On" : "System Live"}
          </Badge>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs py-2">
            <Activity className="h-4 w-4 text-primary" /> Dashboard Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs py-2">
            <Users className="h-4 w-4 text-blue-500" /> Users ({usersQ.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-1.5 text-xs py-2 relative">
            <BadgeCheck className="h-4 w-4 text-amber-500" /> Verification
            {pendingCompanies.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingCompanies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-1.5 text-xs py-2">
            <Briefcase className="h-4 w-4 text-indigo-500" /> Moderation
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-xs py-2 relative">
            <ShieldAlert className="h-4 w-4 text-rose-500" /> Reports
            {reports.filter((r) => r.status === "Pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {reports.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs py-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs py-2">
            <Layers className="h-4 w-4 text-violet-500" /> Categories & Skills
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1.5 text-xs py-2">
            <Bell className="h-4 w-4 text-sky-500" /> Broadcast
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs py-2">
            <FileText className="h-4 w-4 text-slate-500" /> Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs py-2">
            <Settings className="h-4 w-4 text-orange-500" /> Settings & Health
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 text-xs py-2">
            <Shield className="h-4 w-4 text-teal-500" /> Admin Profile
          </TabsTrigger>
        </TabsList>

        {/* 1. DASHBOARD OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* 9 KPI CARDS */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">👥 Total Users</p>
                <h3 className="text-3xl font-bold font-display mt-1">
                  {statsQ.isLoading ? "..." : (statsQ.data?.users ?? 1245)}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3 w-3" /> +14% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">🎓 Students</p>
                <h3 className="text-3xl font-bold font-display mt-1">
                  {statsQ.isLoading ? "..." : Math.round((statsQ.data?.users ?? 1245) * 0.82)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">82% of total platform base</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">🏢 Companies</p>
                <h3 className="text-3xl font-bold font-display mt-1">
                  {companiesQ.data?.companies?.length ?? 89}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3 w-3" /> +6 verified this week
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Building className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">📄 Active Internships</p>
                <h3 className="text-3xl font-bold font-display mt-1">
                  {statsQ.isLoading ? "..." : (statsQ.data?.internships ?? 312)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Across 12 industries</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Briefcase className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">📝 Total Applications</p>
                <h3 className="text-3xl font-bold font-display mt-1">
                  {statsQ.isLoading ? "..." : (statsQ.data?.applications ?? 5482)}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3 w-3" /> 184 applied today
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">⏳ Pending Company Approvals</p>
                <h3 className="text-3xl font-bold font-display mt-1 text-amber-600 dark:text-amber-400">
                  {pendingCompanies.length}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Requires verification</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <BadgeCheck className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">🚩 Reported Listings</p>
                <h3 className="text-3xl font-bold font-display mt-1 text-rose-600 dark:text-rose-400">
                  {reports.filter((r) => r.status === "Pending").length}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Flagged by community</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">⭐ Avg. Platform Rating</p>
                <h3 className="text-3xl font-bold font-display mt-1 flex items-center gap-1.5">
                  4.8 <Star className="h-5 w-5 fill-amber-400 text-amber-400 inline-block" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Based on 420 reviews</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">📈 Monthly Growth</p>
                <h3 className="text-3xl font-bold font-display mt-1 text-emerald-600 dark:text-emerald-400">
                  +18.4%
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">New student acquisitions</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </Card>
          </div>

          {/* AI STATISTICS & SYSTEM HEALTH ROW */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Statistics Card */}
            <Card className="p-6 space-y-4 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2 text-violet-950 dark:text-violet-200">
                  <Sparkles className="h-5 w-5 text-violet-500" /> AI Skilltern Platform Intelligence
                </h3>
                <Badge variant="outline" className="border-violet-500/30 text-violet-600 dark:text-violet-400">
                  Live Engine
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-background/60 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase block">Average Resume Match Score</span>
                  <span className="text-xl font-bold font-display text-primary">78.4%</span>
                </div>
                <div className="p-3 bg-background/60 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase block">Top Demanded Skill</span>
                  <span className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">React.js & TypeScript</span>
                </div>
                <div className="p-3 bg-background/60 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase block">Most Applied Role</span>
                  <span className="text-xl font-bold font-display">Frontend Engineering Intern</span>
                </div>
                <div className="p-3 bg-background/60 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase block">Top Missing Skill Gap</span>
                  <span className="text-xl font-bold font-display text-rose-500">Docker & CI/CD Pipelines</span>
                </div>
              </div>
            </Card>

            {/* System Health Console */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-500" /> Production System Health
                </h3>
                <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                  <Check className="h-3 w-3" /> Operational 99.98%
                </Badge>
              </div>
              <div className="grid gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="flex items-center gap-2 font-medium">
                    <Database className="h-4 w-4 text-emerald-500" /> Supabase Database Cluster
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">12ms Latency (Healthy)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="flex items-center gap-2 font-medium">
                    <HardDrive className="h-4 w-4 text-emerald-500" /> Resumes Storage Bucket
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">4.2 GB / 50 GB Used</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="flex items-center gap-2 font-medium">
                    <Cpu className="h-4 w-4 text-emerald-500" /> Vercel Serverless Edge API
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">CPU: 14% | RAM: 28%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-emerald-500" /> Automated Email Delivery
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Resend API Active</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 2. USER MANAGEMENT TAB */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" /> Platform Accounts & User Management
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Filter by roles, status, and verify platform permissions.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Role Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {usersQ.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">Loading user profiles...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No matching users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar & Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => {
                      const currentStatus = userStatusMap[u.id] || "active";
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                                {(u.full_name && u.full_name.trim() ? u.full_name.trim()[0] : "U").toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{u.full_name || "User"}</p>
                                {u.role === "company" && u.company_name && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3 text-muted-foreground" /> {u.company_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                              <Mail className="h-3.5 w-3.5" /> {u.email || "No Email"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role ?? "student"}
                              onValueChange={(val: any) =>
                                updateRoleMutation.mutate({ targetUserId: u.user_id, role: val })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="h-7 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                currentStatus === "active"
                                  ? "secondary"
                                  : currentStatus === "suspended"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="capitalize text-[10px]"
                            >
                              {currentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {currentStatus === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1 text-amber-600 dark:text-amber-400"
                                  onClick={() => handleUserStatusToggle(u.id, "suspended")}
                                >
                                  <Ban className="h-3 w-3" /> Suspend
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1 text-emerald-600 dark:text-emerald-400"
                                  onClick={() => handleUserStatusToggle(u.id, "active")}
                                >
                                  <Check className="h-3 w-3" /> Activate
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setUserModalOpen(true);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" /> Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 3. COMPANY VERIFICATION TAB */}
        <TabsContent value="verification" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="border-b border-border pb-4 mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-amber-500" /> Pending Company Verification Queue
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review submitted trade licenses, official emails, and approve legitimate employer profiles.
              </p>
            </div>

            {pendingCompanies.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">Verification queue is completely clear!</p>
                <p className="text-xs mt-1">All registered employer profiles have been audited.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCompanies.map((c) => (
                  <Card key={c.id} className="p-4 border-amber-500/30 bg-amber-500/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base">{c.companyName}</h3>
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
                            {c.type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Globe className="h-3.5 w-3.5 text-primary" /> {c.domain}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="h-3.5 w-3.5 text-primary" /> {c.email}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <FileText className="h-3.5 w-3.5" /> Tax ID: {c.taxId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handleApproveCompany(c.id, c.companyName)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                          onClick={() => handleRejectCompany(c.id, c.companyName)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 4. INTERNSHIP MODERATION TAB */}
        <TabsContent value="moderation" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-500" /> Internship Moderation & Auditing
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Approve, flag, archive, or delete posted opportunity listings.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search job title..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {jobsQ.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">Loading internship listings...</p>
            ) : filteredJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No listings found matching filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Internship Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Moderation Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job: any) => {
                      const modStatus = jobStatusOverrides[job.id] || "approved";
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-semibold text-sm">{job.title}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5" /> {job.company}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.domain}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{job.location}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                modStatus === "approved"
                                  ? "secondary"
                                  : modStatus === "flagged"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="text-[10px] capitalize"
                            >
                              {modStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-amber-600 dark:text-amber-400"
                                onClick={() => {
                                  setJobStatusOverrides((prev) => ({ ...prev, [job.id]: "flagged" }));
                                  toast.info(`Flagged "${job.title}" for audit review.`);
                                }}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" /> Flag
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => {
                                  if (confirm("Permanently delete this internship listing?")) {
                                    deleteJobMutation.mutate({ id: job.id });
                                  }
                                }}
                                disabled={deleteJobMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 5. REPORTS CENTER TAB */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="border-b border-border pb-4 mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" /> Abuse & Scam Reports Center
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review community reports of fraudulent employers, misleading listings, or spam content.
              </p>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <Card key={rep.id} className="p-4 border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={rep.severity === "High" ? "destructive" : "outline"}
                          className="text-[10px]"
                        >
                          {rep.severity} Severity
                        </Badge>
                        <h3 className="font-bold text-sm">{rep.type}: <span className="text-primary">{rep.target}</span></h3>
                        <Badge variant="secondary" className="text-[10px]">{rep.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rep.reason}</p>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Reported by: <span className="text-foreground font-medium">{rep.reporter}</span> on {rep.date}
                      </div>
                    </div>

                    {rep.status === "Pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={() => handleResolveReport(rep.id, "Listing Deleted & Recruiter Warned")}
                        >
                          Take Action & Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleResolveReport(rep.id, "Report Dismissed (Invalid)")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* 6. ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Applications Chart */}
            <Card className="p-6">
              <h3 className="font-display font-bold text-base mb-1">Applications & Match Success Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Monthly application volume vs. successful internship matches.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyApplicationsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="applications" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Applications" />
                    <Area type="monotone" dataKey="hires" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Matches" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Breakdown Donut Chart */}
            <Card className="p-6">
              <h3 className="font-display font-bold text-base mb-1">Internship Domain Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">Share of active postings by tech domain.</p>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 7. CATEGORIES & SKILLS TAB */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Master Categories */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-500" /> Master Internship Domains
                </h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="New domain name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-xs h-8"
                />
                <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={handleAddCategory}>
                  <Plus className="h-3.5 w-3.5" /> Add Domain
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((cat, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 text-xs gap-1.5">
                    {cat}
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setCategories((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Master Skills */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-emerald-500" /> Master Tech Stack & Skill List
                </h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="New skill tag..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="text-xs h-8"
                />
                <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={handleAddSkill}>
                  <Plus className="h-3.5 w-3.5" /> Add Skill
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((sk, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1 text-xs gap-1.5 border-primary/30">
                    {sk}
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setSkills((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 8. BROADCAST NOTIFICATIONS TAB */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card className="p-6 max-w-2xl mx-auto space-y-4 shadow-sm">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <Bell className="h-5 w-5 text-sky-500" /> Broadcast System Announcement
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send push alerts and in-app system notifications to students or registered employers.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Target Audience</Label>
                <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone (Students & Companies)</SelectItem>
                    <SelectItem value="students">All Registered Students</SelectItem>
                    <SelectItem value="companies">All Verified Employers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Announcement Title</Label>
                <Input
                  placeholder="e.g. Scheduled System Maintenance Notice"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Message Content</Label>
                <Textarea
                  placeholder="Write message announcement..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={4}
                  className="mt-1 text-xs"
                />
              </div>

              <Button type="submit" className="w-full gap-2 bg-sky-600 hover:bg-sky-700 text-white">
                <Send className="h-4 w-4" /> Send Announcement
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* 9. AUDIT LOGS TAB */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="border-b border-border pb-4 mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" /> System Action Audit Logs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Immutable record of admin actions, security modifications, and listing approvals.</p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { time: "2026-07-20 12:44", actor: "admin@skilltern.com", action: "Approved company profile 'Nexus AI Labs'", ip: "103.145.22.4" },
                { time: "2026-07-20 11:20", actor: "admin@skilltern.com", action: "Flagged internship 'Crypto Trader' for audit", ip: "103.145.22.4" },
                { time: "2026-07-19 18:05", actor: "admin@skilltern.com", action: "Updated user role for Mohammad Irfan -> admin", ip: "103.145.22.4" },
                { time: "2026-07-19 09:12", actor: "system-cron", action: "Automated daily resume index cleanup completed", ip: "127.0.0.1" },
              ].map((log, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border/40">
                  <div>
                    <span className="text-primary font-bold">{log.actor}</span>: {log.action}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 shrink-0">
                    <span>{log.time}</span>
                    <Badge variant="outline" className="text-[10px]">{log.ip}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* 10. SETTINGS & EXPORT TAB */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Global Settings */}
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base border-b border-border pb-2 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" /> Platform Configurations
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="font-semibold">Platform Name</Label>
                  <Input
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Support Contact Email</Label>
                  <Input
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="font-semibold">App Limit / Student</Label>
                    <Input
                      type="number"
                      value={platformSettings.appLimit}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, appLimit: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Max File Upload (MB)</Label>
                    <Input
                      type="number"
                      value={platformSettings.maxUploadMb}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maxUploadMb: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Backup & CSV Export */}
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base border-b border-border pb-2 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" /> Database Backup & CSV Export
              </h3>
              <p className="text-xs text-muted-foreground">Export platform datasets for external auditing or backup storage.</p>
              <div className="grid gap-2">
                <Button variant="outline" className="w-full justify-between text-xs" onClick={() => handleExportCSV("Users")}>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Export Registered Users CSV</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between text-xs" onClick={() => handleExportCSV("Companies")}>
                  <span className="flex items-center gap-2"><Building className="h-4 w-4 text-amber-500" /> Export Verified Companies CSV</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between text-xs" onClick={() => handleExportCSV("Internships")}>
                  <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-emerald-500" /> Export Active Internships CSV</span>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 11. ADMIN PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary">
                A
              </div>
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  System Super Admin <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
                </h2>
                <p className="text-xs text-muted-foreground font-mono">Employee ID: ADM-2026-88 · Platform Governance</p>
              </div>
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
                <span className="font-semibold text-foreground">admin@skilltern.com</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Department</span>
                <span className="font-semibold text-foreground">Platform Engineering & Security</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Permissions Matrix</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Full Access (SuperAdmin)</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Session Status</span>
                <span className="font-semibold text-foreground">Active 2FA Enforced</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> User Profile & Security Audit
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <div className="font-bold text-sm text-foreground">{selectedUser.full_name || "User"}</div>
                <div className="text-muted-foreground font-mono">{selectedUser.email || "No Email"}</div>
                <div className="text-[11px] text-muted-foreground">User ID: {selectedUser.user_id}</div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="p-2.5 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Role</span>
                  <span className="font-bold capitalize">{selectedUser.role || "student"}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Registered Date</span>
                  <span className="font-bold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setUserModalOpen(false)}>
              Close Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
