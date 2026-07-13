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
  UserCheck
} from "lucide-react";
import { adminListUsers, adminUpdateUserRole, adminGetStats } from "@/lib/profile.functions";
import { listInternships, deleteInternship } from "@/lib/internships.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Console — Skilltern" }] }),
  component: AdminConsolePage,
});

function AdminConsolePage() {
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  // Queries
  const statsQ = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminGetStats() });
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  
  // Reuse listInternships with large page size for admin search
  const jobsQ = useQuery({
    queryKey: ["admin-jobs", jobSearch],
    queryFn: () => listInternships({ data: { search: jobSearch, pageSize: 50 } }),
  });

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

  // Filtered lists
  const filteredUsers = (usersQ.data ?? []).filter((u: any) => {
    const search = userSearch.toLowerCase();
    const name = (u.full_name ?? "").toLowerCase();
    const email = (u.email ?? "").toLowerCase();
    const role = (u.role ?? "").toLowerCase();
    return name.includes(search) || email.includes(search) || role.includes(search);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <Shield className="h-8 w-8 text-primary" /> Admin Control Console
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor platform performance, manage user permissions, and moderate job postings.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Registered Users</p>
            <h3 className="text-3xl font-bold font-display mt-1">
              {statsQ.isLoading ? "..." : statsQ.data?.users}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Active Listings</p>
            <h3 className="text-3xl font-bold font-display mt-1">
              {statsQ.isLoading ? "..." : statsQ.data?.internships}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Applications Filed</p>
            <h3 className="text-3xl font-bold font-display mt-1">
              {statsQ.isLoading ? "..." : statsQ.data?.applications}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="postings" className="gap-2">
            <Briefcase className="h-4 w-4" /> Moderation (Listings)
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Platform Accounts
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {usersQ.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">Loading user profiles...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined On</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                              {(u.full_name ?? "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{u.full_name ?? "User"}</p>
                              {u.role === "company" && u.company_name && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3" /> {u.company_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {u.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "admin"
                                ? "default"
                                : u.role === "company"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {u.role ?? "Student"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-block text-left w-36">
                            <Select
                              value={u.role ?? "student"}
                              onValueChange={(val: any) =>
                                updateRoleMutation.mutate({ targetUserId: u.user_id, role: val })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Modify role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Listings Moderation Tab */}
        <TabsContent value="postings" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Active Postings
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title or company..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {jobsQ.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">Loading listings...</p>
            ) : !jobsQ.data?.items || jobsQ.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No internships found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsQ.data.items.map((job: any) => (
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
                        <TableCell className="text-sm text-muted-foreground">{job.location}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5 h-8 text-xs"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this listing?")) {
                                deleteJobMutation.mutate({ id: job.id });
                              }
                            }}
                            disabled={deleteJobMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
