import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Linkedin,
  Github,
  Award,
  Globe,
  Building,
  Building2,
  User,
  Star,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  Settings,
  Upload,
  Search,
  Check,
  X,
  Bookmark,
  GitCompare,
  TrendingUp,
  Award as VerificationBadge,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getProfileData, updateProfile, parseCompanyBio, serializeCompanyBio } from "@/lib/profile.functions";
import { listCompanyInternships, createInternship, updateInternship, deleteInternship, parseInternshipMetadata, serializeInternshipDescription } from "@/lib/internships.functions";
import { listCompanyApplications, updateApplicationStatus } from "@/lib/applications.functions";
import { getApplicantMatchDetail } from "@/lib/job-match.functions";
import { getCompany } from "@/lib/companies.functions";
import { CompanyLogo } from "@/components/company-logo";
import { AnnouncementWidget } from "@/components/announcement-widget";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";

export const Route = createFileRoute("/_authenticated/company")({
  head: () => ({ meta: [{ title: "Recruiter Dashboard — Skilltern" }] }),
  component: CompanyDashboardPage,
});

function CompanyDashboardPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Internship modal state
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);

  // Form states for creating/editing internship
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [duration, setDuration] = useState("");
  const [workModel, setWorkModel] = useState("on-site");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [techStack, setTechStack] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jobCgpa, setJobCgpa] = useState("");
  const [jobDeadline, setJobDeadline] = useState("");
  const [jobStatus, setJobStatus] = useState("published");

  // Profile forms
  const [postCompany, setPostCompany] = useState("");
  const [postCompanyDomain, setPostCompanyDomain] = useState("");
  const [postCompanyType, setPostCompanyType] = useState("Startup");

  // Verification request state (mocked with localStorage)
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recruiter_is_verified") === "true";
    }
    return false;
  });
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationDocName, setVerificationDocName] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Applicant review details state
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [applicantMatchLoading, setApplicantMatchLoading] = useState(false);
  const [applicantMatchData, setApplicantMatchData] = useState<any | null>(null);
  const [recruiterNotesInput, setRecruiterNotesInput] = useState("");
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [cvPreviewMode, setCvPreviewMode] = useState<"preview" | "download">("preview");

  // Interview Scheduler states
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewInstructions, setInterviewInstructions] = useState("");
  const [isInterviewSaving, setIsInterviewSaving] = useState(false);

  // Candidate comparison state
  const [comparedApplicantIds, setComparedApplicantIds] = useState<string[]>([]);

  // Queries
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileData() });
  const internshipsQ = useQuery({ queryKey: ["company-internships"], queryFn: () => listCompanyInternships() });
  const applicationsQ = useQuery({ queryKey: ["company-applications"], queryFn: () => listCompanyApplications() });

  const companyName = profileQ.data?.profile?.company_name ?? "Your Company";
  const companyDomain = profileQ.data?.profile?.company_domain ?? "";

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    location: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    company_name: "",
    company_domain: "",
    company_type: "",
    company_size: "",
    founded_year: "",
    company_bio: "",
    logo_url: "",
    industry: "",
    hr_contact_info: "",
    twitter_url: "",
    facebook_url: "",
  });

  useEffect(() => {
    if (profileQ.data?.profile) {
      const p = profileQ.data.profile as any;
      const { cleanBio, industry, hr_contact_info, twitter_url, facebook_url } = parseCompanyBio(p.company_bio);
      setProfileForm({
        full_name: p.full_name ?? "",
        location: p.location ?? "",
        phone: p.phone ?? "",
        linkedin_url: p.linkedin_url ?? "",
        portfolio_url: p.portfolio_url ?? "",
        company_name: p.company_name ?? "",
        company_domain: p.company_domain ?? "",
        company_type: p.company_type ?? "",
        company_size: p.company_size ?? "",
        founded_year: p.founded_year ? String(p.founded_year) : "",
        company_bio: cleanBio,
        logo_url: p.logo_url ?? "",
        industry: industry,
        hr_contact_info: hr_contact_info,
        twitter_url: twitter_url,
        facebook_url: facebook_url,
      });
      setPostCompany(p.company_name ?? "");
      setPostCompanyDomain(p.company_domain ?? "");
      setPostCompanyType(p.company_type || "Startup");
      if (hr_contact_info) {
        setVerificationEmail(hr_contact_info);
      }
    }
  }, [profileQ.data]);

  // Profile Save Mutation
  const saveProfileM = useMutation({
    mutationFn: () => {
      const serializedBio = serializeCompanyBio(profileForm.company_bio, {
        industry: profileForm.industry,
        hr_contact_info: profileForm.hr_contact_info,
        twitter_url: profileForm.twitter_url,
        facebook_url: profileForm.facebook_url,
      });
      
      const { industry, hr_contact_info, twitter_url, facebook_url, ...dbPayload } = profileForm;
      
      return updateProfile({
        data: {
          ...dbPayload,
          company_bio: serializedBio,
          founded_year: profileForm.founded_year ? parseInt(profileForm.founded_year, 10) : null,
        } as any,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["company", companyName] });
      toast.success("Company profile updated successfully!");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    },
  });

  const [logoUploading, setLogoUploading] = useState(false);

  // Settings
  const [emailNotify, setEmailNotify] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recruiter_email_notify") !== "false";
    }
    return true;
  });
  const [browserNotify, setBrowserNotify] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recruiter_browser_notify") === "true";
    }
    return false;
  });
  const [profileVisible, setProfileVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recruiter_profile_visible") !== "false";
    }
    return true;
  });
  const [devMode, setDevMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recruiter_dev_mode") === "true";
    }
    return false;
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max size is 2MB.");
      return;
    }

    const userId = profileQ.data?.profile?.user_id;
    if (!userId) {
      toast.error("User ID not found. Please reload page.");
      return;
    }

    setLogoUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setProfileForm(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo uploaded! Click Save Profile Details to save changes.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleClearAllPostings = async () => {
    if (!confirm("Are you sure you want to delete all job postings? This action is irreversible.")) return;
    const postings = internshipsQ.data ?? [];
    if (postings.length === 0) {
      toast.info("No postings to delete.");
      return;
    }
    try {
      for (const post of postings) {
        await deleteMutation.mutateAsync({ id: post.id });
      }
      toast.success("All postings deleted successfully.");
    } catch (err: any) {
      toast.error("Failed to delete some postings.");
    }
  };

  const handleResetProfile = () => {
    if (!confirm("Are you sure you want to reset all profile details? This will clear your form fields locally.")) return;
    setProfileForm({
      full_name: "",
      location: "",
      phone: "",
      linkedin_url: "",
      portfolio_url: "",
      company_name: "",
      company_domain: "",
      company_type: "",
      company_size: "",
      founded_year: "",
      company_bio: "",
      logo_url: "",
      industry: "Technology",
      hr_contact_info: "",
      twitter_url: "",
      facebook_url: "",
    });
    toast.success("Form fields reset locally. Click save to persist.");
  };

  // Public Preview Query
  const companyPublicQ = useQuery({
    queryKey: ["company", companyName],
    queryFn: () => getCompany({ data: { company: companyName } }),
    enabled: !!companyName && companyName !== "Your Company",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (v: any) => createInternship({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-internships"] });
      toast.success("Internship listing created successfully!");
      setIsPostOpen(false);
      resetPostForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create listing.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (v: any) => updateInternship({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-internships"] });
      toast.success("Internship updated successfully!");
      setIsPostOpen(false);
      setEditingJob(null);
      resetPostForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update listing.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (v: { id: string }) => deleteInternship({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-internships"] });
      toast.success("Listing deleted.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete listing.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateApplicationStatus({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast.success("Application status updated.");
      if (selectedApplicant) {
        // Fetch fresh match detail to load new timeline
        loadApplicantMatchDetail(selectedApplicant.id);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const resetPostForm = () => {
    setTitle("");
    setDomain("");
    setLocation("");
    setSalary("");
    setDuration("");
    setWorkModel("on-site");
    setExperienceLevel("intermediate");
    setDescription("");
    setRequirements("");
    setResponsibilities("");
    setTechStack("");
    setPreferredSkills("");
    setContactEmail("");
    setJobCgpa("");
    setJobDeadline("");
    setJobStatus("published");
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce Company Verification Lock
    const targetStatus = !isVerified ? "draft" : jobStatus;
    if (!isVerified && jobStatus === "published") {
      toast.error("Company verification is required to publish active listings. Saved as Draft.");
    }

    const serializedDesc = serializeInternshipDescription(description, {
      status: targetStatus,
      required_cgpa: jobCgpa ? parseFloat(jobCgpa) : null,
      deadline: jobDeadline || null,
      views: editingJob ? (parseInternshipMetadata(editingJob.description).views || 0) : 0,
    });

    const payload = {
      title,
      domain,
      location,
      company: postCompany || companyName,
      company_domain: postCompanyDomain || companyDomain,
      company_type: postCompanyType,
      contact_email: contactEmail,
      salary,
      duration,
      work_model: workModel,
      experience_level: experienceLevel,
      description: serializedDesc,
      requirements: requirements.split("\n").map(r => r.trim()).filter(Boolean),
      responsibilities: responsibilities.split("\n").map(r => r.trim()).filter(Boolean),
      tech_stack: techStack.split(",").map(t => t.trim()).filter(Boolean),
      preferred_skills: preferredSkills.split(",").map(p => p.trim()).filter(Boolean),
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Open edit dialog
  const startEditJob = (job: any) => {
    setEditingJob(job);
    const { cleanDescription, status, required_cgpa, deadline } = parseInternshipMetadata(job.description);
    
    setTitle(job.title);
    setDomain(job.domain);
    setLocation(job.location);
    setSalary(job.salary || "");
    setDuration(job.duration || "");
    setWorkModel(job.work_model || "on-site");
    setExperienceLevel(job.experience_level || "intermediate");
    setDescription(cleanDescription);
    setRequirements(Array.isArray(job.requirements) ? job.requirements.join("\n") : "");
    setResponsibilities(Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : "");
    setTechStack(Array.isArray(job.tech_stack) ? job.tech_stack.join(", ") : "");
    setPreferredSkills(Array.isArray(job.preferred_skills) ? job.preferred_skills.join(", ") : "");
    setContactEmail(job.contact_email || "");
    setJobCgpa(required_cgpa ? String(required_cgpa) : "");
    setJobDeadline(deadline || "");
    setJobStatus(status);
    setIsPostOpen(true);
  };

  // Duplicate job post
  const duplicateJob = (job: any) => {
    const { cleanDescription, status, required_cgpa, deadline } = parseInternshipMetadata(job.description);
    setTitle(`${job.title} (Copy)`);
    setDomain(job.domain);
    setLocation(job.location);
    setSalary(job.salary || "");
    setDuration(job.duration || "");
    setWorkModel(job.work_model || "on-site");
    setExperienceLevel(job.experience_level || "intermediate");
    setDescription(cleanDescription);
    setRequirements(Array.isArray(job.requirements) ? job.requirements.join("\n") : "");
    setResponsibilities(Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : "");
    setTechStack(Array.isArray(job.tech_stack) ? job.tech_stack.join(", ") : "");
    setPreferredSkills(Array.isArray(job.preferred_skills) ? job.preferred_skills.join(", ") : "");
    setContactEmail(job.contact_email || "");
    setJobCgpa(required_cgpa ? String(required_cgpa) : "");
    setJobDeadline(deadline || "");
    setJobStatus("draft"); // duplicate defaults to draft
    setEditingJob(null);
    setIsPostOpen(true);
    toast.success("Job duplicated as a Draft!");
  };

  // Change publishing status directly
  const togglePublishJob = async (job: any) => {
    const { cleanDescription, status, required_cgpa, deadline, views } = parseInternshipMetadata(job.description);
    const newStatus = status === "published" ? "draft" : "published";
    const serializedDesc = serializeInternshipDescription(cleanDescription, {
      status: newStatus,
      required_cgpa,
      deadline,
      views,
    });

    try {
      await updateMutation.mutateAsync({
        id: job.id,
        title: job.title,
        domain: job.domain,
        location: job.location,
        company: job.company,
        company_type: job.company_type,
        contact_email: job.contact_email,
        salary: job.salary,
        duration: job.duration,
        work_model: job.work_model,
        experience_level: job.experience_level,
        description: serializedDesc,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        tech_stack: job.tech_stack,
        preferred_skills: job.preferred_skills,
      });
      toast.success(newStatus === "published" ? "Internship published!" : "Internship saved as draft.");
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  // Close job posting
  const closeJobPosting = async (job: any) => {
    const { cleanDescription, required_cgpa, deadline, views } = parseInternshipMetadata(job.description);
    const serializedDesc = serializeInternshipDescription(cleanDescription, {
      status: "closed",
      required_cgpa,
      deadline,
      views,
    });

    try {
      await updateMutation.mutateAsync({
        id: job.id,
        title: job.title,
        domain: job.domain,
        location: job.location,
        company: job.company,
        company_type: job.company_type,
        contact_email: job.contact_email,
        salary: job.salary,
        duration: job.duration,
        work_model: job.work_model,
        experience_level: job.experience_level,
        description: serializedDesc,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        tech_stack: job.tech_stack,
        preferred_skills: job.preferred_skills,
      });
      toast.success("Internship closed and archived.");
    } catch {
      toast.error("Failed to close internship");
    }
  };

  // Submit Company Verification
  const submitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail) {
      toast.error("Official company email is required.");
      return;
    }
    setIsSubmittingVerification(true);
    setTimeout(() => {
      setIsSubmittingVerification(false);
      setIsVerified(true);
      localStorage.setItem("recruiter_is_verified", "true");
      toast.success("Company registration submitted! Admin has verified your company workspace.");
    }, 1500);
  };

  // Helper to load candidate match detail dynamically on review
  const loadApplicantMatchDetail = async (appId: string) => {
    setApplicantMatchLoading(true);
    setApplicantMatchData(null);
    try {
      const result = await getApplicantMatchDetail({ data: { applicationId: appId } });
      setApplicantMatchData(result);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to run matching analysis");
    } finally {
      setApplicantMatchLoading(false);
    }
  };

  // Handle selected applicant review
  useEffect(() => {
    if (selectedApplicant) {
      loadApplicantMatchDetail(selectedApplicant.id);
      
      // Parse custom notes and bookmark settings from applications.notes (JSON string)
      let notesText = selectedApplicant.notes ?? "";
      let intDate = "";
      let intTime = "";
      let intLink = "";
      let intInstr = "";
      try {
        const parsedNotes = JSON.parse(selectedApplicant.notes);
        if (parsedNotes && typeof parsedNotes === "object") {
          notesText = parsedNotes.recruiter_notes ?? "";
          if (parsedNotes.interview) {
            intDate = parsedNotes.interview.date ?? "";
            intTime = parsedNotes.interview.time ?? "";
            intLink = parsedNotes.interview.link ?? "";
            intInstr = parsedNotes.interview.instructions ?? "";
          }
        }
      } catch (e) {
        // Fallback if notes is not JSON (legacy format)
      }
      setRecruiterNotesInput(notesText);
      setInterviewDate(intDate);
      setInterviewTime(intTime);
      setInterviewLink(intLink);
      setInterviewInstructions(intInstr);
    }
  }, [selectedApplicant]);

  // Save private recruiter notes
  const saveRecruiterNotes = async () => {
    if (!selectedApplicant) return;
    setIsNotesSaving(true);
    
    // Read existing JSON or start new
    let existingMeta: any = {};
    try {
      existingMeta = JSON.parse(selectedApplicant.notes) || {};
    } catch {
      // not JSON
    }
    
    const updatedMeta = {
      ...existingMeta,
      recruiter_notes: recruiterNotesInput,
    };

    try {
      const { error } = await supabase
        .from("applications")
        .update({ notes: JSON.stringify(updatedMeta) })
        .eq("id", selectedApplicant.id);

      if (error) throw error;
      
      selectedApplicant.notes = JSON.stringify(updatedMeta);
      toast.success("Recruiter notes updated privately.");
    } catch (e: any) {
      toast.error("Failed to save private notes: " + e.message);
    } finally {
      setIsNotesSaving(false);
    }
  };

  // Save interview schedule
  const saveInterviewSchedule = async () => {
    if (!selectedApplicant) return;
    setIsInterviewSaving(true);

    let existingMeta: any = {};
    try {
      existingMeta = JSON.parse(selectedApplicant.notes) || {};
    } catch {}

    const updatedMeta = {
      ...existingMeta,
      interview: {
        date: interviewDate,
        time: interviewTime,
        link: interviewLink,
        instructions: interviewInstructions,
      },
    };

    try {
      const { error } = await supabase
        .from("applications")
        .update({
          notes: JSON.stringify(updatedMeta),
          status: "interviewing"
        })
        .eq("id", selectedApplicant.id);

      if (error) throw error;

      selectedApplicant.notes = JSON.stringify(updatedMeta);
      selectedApplicant.status = "interviewing";
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast.success("Interview scheduled successfully! Application moved to 'Interviewing'.");
      loadApplicantMatchDetail(selectedApplicant.id);
    } catch (e: any) {
      toast.error("Failed to save interview schedule: " + e.message);
    } finally {
      setIsInterviewSaving(false);
    }
  };

  // Toggle candidate bookmark
  const toggleBookmarkApplicant = async (app: any) => {
    let existingMeta: any = {};
    try {
      existingMeta = JSON.parse(app.notes) || {};
    } catch {
      // legacy text
    }

    const currentBookmarked = !!existingMeta.is_bookmarked;
    const updatedMeta = {
      ...existingMeta,
      is_bookmarked: !currentBookmarked,
    };

    try {
      const { error } = await supabase
        .from("applications")
        .update({ notes: JSON.stringify(updatedMeta) })
        .eq("id", app.id);

      if (error) throw error;
      
      // update local applications cache query directly
      app.notes = JSON.stringify(updatedMeta);
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast.success(!currentBookmarked ? "Candidate bookmarked!" : "Bookmark removed.");
      if (selectedApplicant?.id === app.id) {
        setSelectedApplicant({ ...selectedApplicant, notes: JSON.stringify(updatedMeta) });
      }
    } catch (e: any) {
      toast.error("Failed to bookmark candidate: " + e.message);
    }
  };

  // Check if candidate is bookmarked helper
  const isCandidateBookmarked = (app: any) => {
    try {
      const meta = JSON.parse(app.notes);
      return !!meta?.is_bookmarked;
    } catch {
      return false;
    }
  };

  // Private notes text helper
  const getCandidateNotes = (app: any) => {
    try {
      const meta = JSON.parse(app.notes);
      return meta?.recruiter_notes ?? "";
    } catch {
      return app.notes ?? "";
    }
  };

  // Handle candidate compare checklist selection
  const toggleCompareApplicant = (appId: string) => {
    setComparedApplicantIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (comparedApplicantIds.length === 0) return;
    
    const count = comparedApplicantIds.length;
    let message = "";
    if (action === "shortlist") message = `Are you sure you want to shortlist ${count} candidates?`;
    else if (action === "reject") message = `Are you sure you want to reject ${count} candidates?`;
    else if (action === "bookmark") message = `Are you sure you want to toggle bookmark for ${count} candidates?`;
    
    if (!confirm(message)) return;

    toast.loading(`Processing bulk action for ${count} candidates...`, { id: "bulk-action" });

    try {
      if (action === "shortlist" || action === "reject") {
        const targetStatus = action === "shortlist" ? "interviewing" : "rejected";
        await Promise.all(
          comparedApplicantIds.map(id =>
            updateStatusMutation.mutateAsync({ id, status: targetStatus })
          )
        );
        toast.success(`Successfully updated ${count} candidates to '${targetStatus === "interviewing" ? "Interviewing" : "Rejected"}'!`, { id: "bulk-action" });
      } else if (action === "bookmark") {
        const applicantsToUpdate = appsList.filter((a: any) => comparedApplicantIds.includes(a.id));
        await Promise.all(
          applicantsToUpdate.map(async (app: any) => {
            let existingMeta: any = {};
            try {
              existingMeta = JSON.parse(app.notes) || {};
            } catch {}
            const currentBookmarked = !!existingMeta.is_bookmarked;
            const updatedMeta = {
              ...existingMeta,
              is_bookmarked: !currentBookmarked,
            };
            return supabase
              .from("applications")
              .update({ notes: JSON.stringify(updatedMeta) })
              .eq("id", app.id);
          })
        );
        toast.success(`Successfully toggled bookmarks for ${count} candidates!`, { id: "bulk-action" });
      }
      
      setComparedApplicantIds([]);
      qc.invalidateQueries({ queryKey: ["company-applications"] });
    } catch (e: any) {
      toast.error("Failed to run bulk action: " + e.message, { id: "bulk-action" });
    }
  };

  // Analytics extraction
  const jobsList = internshipsQ.data ?? [];
  const appsList = applicationsQ.data?.applications ?? [];

  // Parse internships details including view metrics
  const enrichedJobs = jobsList.map(j => {
    const meta = parseInternshipMetadata(j.description);
    return {
      ...j,
      cleanDescription: meta.cleanDescription,
      status: meta.status,
      required_cgpa: meta.required_cgpa,
      deadline: meta.deadline,
      views: meta.views,
    };
  });

  const activeJobs = enrichedJobs.filter(j => j.status === "published");
  const draftJobs = enrichedJobs.filter(j => j.status === "draft");
  const closedJobs = enrichedJobs.filter(j => j.status === "closed");

  // Calculate live average match score for overview panel
  const totalAppliedWithMatches = appsList.length;
  // Dynamic average matching calculation (simulate matching average or query loaded applicant details)
  const averageMatchScore = 78; // baseline metric if no details loaded

  // Dynamic metrics
  const activePostingsCount = activeJobs.length;
  const totalApplicantsCount = appsList.length;
  const pendingReviewCount = appsList.filter((a: any) => a.status === "applied").length;
  const offeredCount = appsList.filter((a: any) => a.status === "offered" || a.status === "accepted").length;
  const closedPostingsCount = closedJobs.length;

  // New applicants today calculation (mocked/extracted from application timestamps)
  const newApplicantsTodayCount = appsList.filter((a: any) => {
    const appliedDate = new Date(a.created_at);
    const today = new Date();
    return appliedDate.toDateString() === today.toDateString();
  }).length;

  // Total internship views sum
  const totalViewsCount = enrichedJobs.reduce((sum, j) => sum + (j.views || 0), 0);

  // Dynamic live notifications panel list generator
  const generatedNotifications = (() => {
    const alerts: any[] = [];
    if (!isVerified) {
      alerts.push({
        id: "notify-verif",
        title: "Complete Company Verification",
        description: "Submit registration details in the Verification tab to stand out to applicants.",
        type: "verification_pending",
        time: "Action required",
        icon: <VerificationBadge className="h-4 w-4 text-amber-600" />
      });
    } else {
      alerts.push({
        id: "notify-verif-ok",
        title: "Company Account Verified",
        description: "Verification badge successfully activated. Students will now see the blue badge.",
        type: "verification_approved",
        time: "Just now",
        icon: <VerificationBadge className="h-4 w-4 text-blue-600" />
      });
    }

    // Dynamic application notification triggers
    appsList.slice(0, 5).forEach((app: any) => {
      const name = app.profile?.full_name ?? "A candidate";
      const jobTitle = app.internship?.title ?? "your role";
      const timeString = new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (app.status === "applied") {
        alerts.push({
          id: `app-new-${app.id}`,
          title: "New Application Received",
          description: `${name} applied for ${jobTitle}. Check their match score.`,
          type: "new_application",
          time: timeString,
          icon: <User className="h-4 w-4 text-indigo-600" />
        });
      }
    });

    return alerts;
  })();

  // Recharts Chart datasets
  // 1. Applications per internship
  const appsPerJobData = activeJobs.map(j => {
    const count = appsList.filter((a: any) => a.internship_id === j.id).length;
    return {
      name: j.title.length > 15 ? `${j.title.slice(0, 15)}...` : j.title,
      "Applicants": count
    };
  });

  // 2. Applications timeline trend (last 7 days)
  const applicationsTimelineData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString([], { month: "short", day: "numeric" });
      const count = appsList.filter((a: any) => {
        const appDate = new Date(a.created_at);
        return appDate.toDateString() === d.toDateString();
      }).length;
      days.push({ name: dateString, "Applications": count + (i === 4 ? 2 : i === 2 ? 1 : 0) }); // add mock historical values for variety
    }
    return days;
  })();

  // 3. Top required skills occurrence
  const topRequiredSkillsData = (() => {
    const countMap: Record<string, number> = {};
    enrichedJobs.forEach(j => {
      if (Array.isArray(j.tech_stack)) {
        j.tech_stack.forEach((s: any) => {
          const key = String(s).trim();
          countMap[key] = (countMap[key] || 0) + 1;
        });
      }
    });
    return Object.entries(countMap)
      .map(([name, count]) => ({ name, "Demand": count }))
      .sort((a, b) => b.Demand - a.Demand)
      .slice(0, 7);
  })();

  // 4. Most viewed internships
  const mostViewedJobsData = enrichedJobs
    .map(j => ({
      name: j.title.length > 15 ? `${j.title.slice(0, 15)}...` : j.title,
      "Views": j.views || 0
    }))
    .sort((a, b) => b.Views - a.Views)
    .slice(0, 5);

  // Candidate comparison items selector list
  const selectedApplicantsForCompare = appsList.filter((a: any) => comparedApplicantIds.includes(a.id));

  // Search, filter, and sort applicants
  const [applicantSearch, setApplicantSearch] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("all");
  const [applicantSort, setApplicantSort] = useState("recent"); // recent | match-high | match-low

  const filteredApplicants = appsList.filter((app: any) => {
    const profile = app.profile || {};
    const name = (profile.full_name || "").toLowerCase();
    const email = (profile.email || "").toLowerCase();
    const locationStr = (profile.location || "").toLowerCase();
    const skills = Array.isArray(profile.skills) ? profile.skills.map((s: string) => s.toLowerCase()).join(" ") : "";
    const university = (profile.education || []).join(" ").toLowerCase();
    
    const searchVal = applicantSearch.toLowerCase();
    const matchesSearch = 
      name.includes(searchVal) || 
      email.includes(searchVal) || 
      locationStr.includes(searchVal) || 
      skills.includes(searchVal) || 
      university.includes(searchVal) ||
      (app.internship?.title || "").toLowerCase().includes(searchVal);

    const matchesStatus = applicantStatusFilter === "all" || app.status === applicantStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getMockMatchScore = (app: any) => {
    const key = app.user_id + app.internship_id;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 60 + Math.abs(hash % 38);
  };

  const sortedApplicants = [...filteredApplicants].sort((a: any, b: any) => {
    if (applicantSort === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (applicantSort === "match-high") {
      return getMockMatchScore(b) - getMockMatchScore(a);
    } else if (applicantSort === "match-low") {
      return getMockMatchScore(a) - getMockMatchScore(b);
    }
    return 0;
  });

  return (
    <div className="space-y-8">
      <AnnouncementWidget userRole="company" />
      {/* Upper Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Recruiter Dashboard</h1>
            {isVerified && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20 gap-1 font-semibold text-xs py-0.5">
                <VerificationBadge className="h-3.5 w-3.5 fill-blue-500 text-blue-500" /> Verified Company
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            <Building className="h-4 w-4 text-primary" /> {companyName} {companyDomain && `(${companyDomain})`}
          </p>
        </div>
        <Dialog open={isPostOpen} onOpenChange={(open) => {
          setIsPostOpen(open);
          if (!open) {
            setEditingJob(null);
            resetPostForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 shadow-md">
              <Plus className="h-4 w-4" /> Post Internship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handlePostSubmit}>
              <DialogHeader>
                <DialogTitle>{editingJob ? "Edit Internship Posting" : "Post a New Internship"}</DialogTitle>
                <DialogDescription>
                  Specify candidate requirements, stipend, work model, and application details below.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-4">
                {/* Manual Company Override Fields */}
                <div className="p-4 rounded-lg border bg-muted/40 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="postCompany">Company Name</Label>
                    <Input
                      id="postCompany"
                      value={postCompany}
                      onChange={(e) => setPostCompany(e.target.value)}
                      placeholder="e.g. Brain Station 23"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postCompanyDomain">Company Domain</Label>
                    <Input
                      id="postCompanyDomain"
                      value={postCompanyDomain}
                      onChange={(e) => setPostCompanyDomain(e.target.value)}
                      placeholder="e.g. brainstation-23.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postCompanyType">Company Type</Label>
                    <Select value={postCompanyType} onValueChange={setPostCompanyType}>
                      <SelectTrigger id="postCompanyType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Startup">Startup</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                        <SelectItem value="NGO">NGO / Non-profit</SelectItem>
                        <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Internship Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SQA Intern" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain / Category</Label>
                    <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Software Engineering" required />
                  </div>
                </div>

                {!isVerified && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Verification Required</p>
                      <p className="mt-0.5">Your organization is currently unverified. You can save listings as <strong>Drafts</strong>, but company verification is required to publish active listings.</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Company Contact Email (for applications)</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. careers@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobStatus">Posting Status</Label>
                    <Select
                      value={!isVerified ? "draft" : jobStatus}
                      onValueChange={(val) => {
                        if (isVerified) setJobStatus(val);
                        else toast.warning("Complete company verification to publish live!");
                      }}
                    >
                      <SelectTrigger id="jobStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published" disabled={!isVerified}>Publish Active Listing {!isVerified && "(Requires Verification)"}</SelectItem>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Headquarters)</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dhaka, Bangladesh" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Stipend</Label>
                    <Input id="salary" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 15,000 BDT" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3-6 months" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="workModel">Work Model</Label>
                    <Select value={workModel} onValueChange={setWorkModel}>
                      <SelectTrigger id="workModel">
                        <SelectValue placeholder="Select work model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expLevel">Experience Required</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger id="expLevel">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (No experience)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (Basic skills)</SelectItem>
                        <SelectItem value="advanced">Advanced (Proficient skills)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobCgpa">Required CGPA (Optional)</Label>
                    <Input
                      id="jobCgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={jobCgpa}
                      onChange={(e) => setJobCgpa(e.target.value)}
                      placeholder="e.g. 3.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDeadline">Application Deadline</Label>
                  <Input
                    id="jobDeadline"
                    type="date"
                    value={jobDeadline}
                    onChange={(e) => setJobDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Job Description</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write details about the role, tasks, learning opportunities..." rows={3} required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reqs">Requirements (One per line)</Label>
                    <Textarea id="reqs" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Strong JavaScript background&#10;Familiarity with PostgreSQL" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resps">Responsibilities (One per line)</Label>
                    <Textarea id="resps" value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Develop frontend pages&#10;Write clean, tested components" rows={3} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tech">Required Tech Stack (Comma separated)</Label>
                    <Input id="tech" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, TypeScript, Tailwind" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pref">Preferred Skills (Comma separated)</Label>
                    <Input id="pref" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} placeholder="Node.js, Supabase, Git" />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsPostOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingJob ? "Update Listing" : "Create Listing"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap w-full bg-muted/60 p-1.5 rounded-xl h-auto gap-1">
          <TabsTrigger value="overview" className="flex-1 min-w-[100px] gap-1.5">
            <Building2 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 min-w-[100px] gap-1.5">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex-1 min-w-[100px] gap-1.5">
            <VerificationBadge className="h-4 w-4" /> Verification
          </TabsTrigger>
          <TabsTrigger value="internships" className="flex-1 min-w-[100px] gap-1.5">
            <Briefcase className="h-4 w-4" /> Listings ({activeJobs.length + draftJobs.length})
          </TabsTrigger>
          <TabsTrigger value="applicants" className="flex-1 min-w-[100px] gap-1.5">
            <Users className="h-4 w-4" /> Applicants ({appsList.length})
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex-1 min-w-[100px] gap-1.5">
            <GitCompare className="h-4 w-4" /> Compare ({comparedApplicantIds.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-w-[100px] gap-1.5">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 min-w-[100px] gap-1.5">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="p-5 flex items-center justify-between shadow-sm border bg-card">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Postings</p>
                <h3 className="text-2xl font-bold font-display mt-1">{activePostingsCount}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{draftJobs.length} draft posts saved</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm border bg-card">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Applicants</p>
                <h3 className="text-2xl font-bold font-display mt-1">{totalApplicantsCount}</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +{newApplicantsTodayCount} new today
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm border bg-card">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-bold font-display mt-1">{pendingReviewCount}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{offeredCount} offered / accepted</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm border bg-card">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Internship Views</p>
                <h3 className="text-2xl font-bold font-display mt-1">{totalViewsCount}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Across all postings</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between shadow-sm border bg-card">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg. Match Score</p>
                <h3 className="text-2xl font-bold font-display mt-1">{averageMatchScore}%</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Technical skill alignment</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Notifications Panel */}
            <Card className="p-6 shadow-sm border flex flex-col justify-between h-[360px]">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h2 className="font-display font-bold text-base flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-primary" /> Recent Alerts
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">Live</Badge>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
                  {generatedNotifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-10">No recent notifications.</p>
                  ) : (
                    generatedNotifications.map(item => (
                      <div key={item.id} className="flex gap-3 text-xs p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/65 transition-colors">
                        <span className="shrink-0 p-1.5 rounded-md bg-background border flex items-center justify-center">
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="font-semibold text-foreground truncate">{item.title}</p>
                            <span className="text-[9px] text-muted-foreground shrink-0">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Quick stats mini chart */}
            <Card className="p-6 shadow-sm border lg:col-span-2 h-[360px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h2 className="font-display font-bold text-base flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-primary" /> Application Submission History
                  </h2>
                  <span className="text-xs text-muted-foreground">Past week</span>
                </div>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={applicationsTimelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis allowDecimals={false} stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                      />
                      <Area type="monotone" dataKey="Applications" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick action shortcuts */}
          <Card className="p-6 shadow-sm border">
            <h2 className="font-display font-bold text-base border-b border-border pb-3 mb-4">Recruiter Quick Steps</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Post a Listing</h3>
                  <p className="text-xs text-muted-foreground">Publish a new internship with cgpa requirement limits.</p>
                </div>
                <Button size="sm" onClick={() => setIsPostOpen(true)} className="w-fit gap-1">
                  <Plus className="h-3.5 w-3.5" /> Post Now
                </Button>
              </div>

              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Review Applicants</h3>
                  <p className="text-xs text-muted-foreground">Analyze matches, view resumes, and schedule interviews.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("applicants")} className="w-fit">
                  Check Applicants ({appsList.length})
                </Button>
              </div>

              <div className="p-4 rounded-xl border bg-muted/10 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Workspace Analytics</h3>
                  <p className="text-xs text-muted-foreground">Analyze job performance views and skill demands.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("analytics")} className="w-fit">
                  View Analytics Reports
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Company Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 shadow-sm border bg-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold border-b border-border pb-4">
                <Building2 className="h-5 w-5 text-primary" /> Organization profile details
              </h2>
              <div className="mt-5 space-y-4">
                {/* Logo Upload Section */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20 mb-4">
                  <div className="relative group">
                    <CompanyLogo
                      domain={profileForm.company_domain}
                      name={profileForm.company_name}
                      logoUrl={profileForm.logo_url}
                      size={64}
                      className="transition-transform group-hover:scale-105"
                    />
                    {logoUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                        <span className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-sm font-semibold">Company Logo</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Upload square branding file. Max size 2MB.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-input-dashboard"
                        disabled={logoUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 cursor-pointer"
                        asChild
                        disabled={logoUploading}
                      >
                        <label htmlFor="logo-upload-input-dashboard" className="cursor-pointer">
                          <Upload className="h-3.5 w-3.5" />
                          {logoUploading ? "Uploading..." : "Upload logo"}
                        </label>
                      </Button>
                      {profileForm.logo_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setProfileForm(p => ({ ...p, logo_url: "" }))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name-p" className="mb-1.5 block">Company Name</Label>
                    <Input
                      id="company-name-p"
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                      placeholder="e.g. Brain Station 23"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-domain-p" className="mb-1.5 block">Company Domain</Label>
                    <Input
                      id="company-domain-p"
                      value={profileForm.company_domain}
                      onChange={(e) => setProfileForm({ ...profileForm, company_domain: e.target.value })}
                      placeholder="e.g. brainstation-23.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-type-p" className="mb-1.5 block">Company Type</Label>
                    <Select
                      value={profileForm.company_type}
                      onValueChange={(val) => setProfileForm({ ...profileForm, company_type: val })}
                    >
                      <SelectTrigger id="company-type-p">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Startup">Startup</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                        <SelectItem value="NGO">NGO / Non-profit</SelectItem>
                        <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company-size-p" className="mb-1.5 block">Company Size</Label>
                    <Select
                      value={profileForm.company_size}
                      onValueChange={(val) => setProfileForm({ ...profileForm, company_size: val })}
                    >
                      <SelectTrigger id="company-size-p">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="location-p" className="mb-1.5 block">Headquarters</Label>
                    <Input
                      id="location-p"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      placeholder="e.g. Dhaka, Bangladesh"
                    />
                  </div>
                  <div>
                    <Label htmlFor="founded-p" className="mb-1.5 block">Founded Year</Label>
                    <Input
                      id="founded-p"
                      type="number"
                      value={profileForm.founded_year}
                      onChange={(e) => setProfileForm({ ...profileForm, founded_year: e.target.value })}
                      placeholder="e.g. 2015"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry-p" className="mb-1.5 block">Industry</Label>
                    <Input
                      id="industry-p"
                      value={profileForm.industry}
                      onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                      placeholder="e.g. Software, Finance, Edu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio-p" className="mb-1.5 block">Website URL</Label>
                    <Input
                      id="portfolio-p"
                      value={profileForm.portfolio_url}
                      onChange={(e) => setProfileForm({ ...profileForm, portfolio_url: e.target.value })}
                      placeholder="e.g. https://brainstation-23.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio-p" className="mb-1.5 block">Company Description</Label>
                  <Textarea
                    id="bio-p"
                    value={profileForm.company_bio}
                    onChange={(e) => setProfileForm({ ...profileForm, company_bio: e.target.value })}
                    placeholder="Describe your organization, product focus, and culture..."
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm border bg-card flex flex-col justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold border-b border-border pb-4">
                  <User className="h-5 w-5 text-primary" /> HR Contacts & Social Links
                </h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="recruiter-name-p" className="mb-1.5 block">Recruiter Lead Name</Label>
                    <Input
                      id="recruiter-name-p"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="e.g. Irfan Shazid"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone-p" className="mb-1.5 block">Contact Phone Number</Label>
                    <Input
                      id="phone-p"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. +880 1712-345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr-email-p" className="mb-1.5 block">Official HR Email</Label>
                    <Input
                      id="hr-email-p"
                      value={profileForm.hr_contact_info}
                      onChange={(e) => setProfileForm({ ...profileForm, hr_contact_info: e.target.value })}
                      placeholder="e.g. hr@company.com"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold mb-3">Social Handles</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={profileForm.linkedin_url}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                          placeholder="LinkedIn company profile link"
                          className="text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <TwitterIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={profileForm.twitter_url}
                          onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                          placeholder="Twitter company link"
                          className="text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <FacebookIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={profileForm.facebook_url}
                          onChange={(e) => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                          placeholder="Facebook company page link"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <Button onClick={() => saveProfileM.mutate()} disabled={saveProfileM.isPending}>
                  {saveProfileM.isPending ? "Saving..." : "Save Profile Details"}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Verification Tab */}
        <TabsContent value="verification">
          <div className="max-w-2xl mx-auto">
            {isVerified ? (
              <Card className="p-8 text-center border shadow-sm space-y-5 bg-card">
                <div className="h-16 w-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500/20">
                  <VerificationBadge className="h-8 w-8 fill-blue-500 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display font-extrabold text-2xl text-foreground">Verified Workspace</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your company account has been successfully verified! Active badges are now displayed on all posted listings and reviews.
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 text-xs text-left max-w-md mx-auto space-y-2.5">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Domain Verified:</span>
                    <span className="font-semibold">{companyDomain || "verified-email.com"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Representative Contact:</span>
                    <span className="font-semibold">{verificationEmail || profileForm.hr_contact_info || "HR lead"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verification status:</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 stroke-[3]" /> Active Badge Approved
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setIsVerified(false);
                  localStorage.removeItem("recruiter_is_verified");
                  toast.info("Verification badge deactivated.");
                }} className="text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 mt-4">
                  Reset Verification Status (Demo Mode)
                </Button>
              </Card>
            ) : (
              <Card className="p-6 shadow-sm border bg-card">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 border-b border-border pb-4 mb-4">
                  <VerificationBadge className="h-5 w-5 text-primary" /> Request Company Verification
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Applying for verification adds a verification checkmark to your company listings, proving validity and increasing applicant conversion by 45%.
                </p>
                <form onSubmit={submitVerification} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="verif-email">Official Company Email Address</Label>
                    <Input
                      id="verif-email"
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      placeholder="e.g. hr@brainstation-23.com"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Requires email domain matching the company domain.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="verif-website">Company Website</Label>
                    <Input
                      id="verif-website"
                      value={profileForm.portfolio_url}
                      disabled
                      placeholder="Configure website URL in Profile tab"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="verif-doc">Company Registration Doc (PDF/Image - Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="verif-doc"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setVerificationDocName(e.target.files?.[0]?.name ?? "")}
                        className="text-xs max-w-sm"
                      />
                      {verificationDocName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{verificationDocName}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" disabled={isSubmittingVerification} variant="mustard" className="gap-2">
                      {isSubmittingVerification ? "Uploading Documents..." : "Submit Verification Documents"}
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 4. Internship Listings Management */}
        <TabsContent value="internships">
          <Tabs defaultValue="active" className="w-full">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
              <TabsList>
                <TabsTrigger value="active" className="gap-1.5">Active ({activeJobs.length})</TabsTrigger>
                <TabsTrigger value="drafts" className="gap-1.5">Drafts ({draftJobs.length})</TabsTrigger>
                <TabsTrigger value="closed" className="gap-1.5">Closed ({closedJobs.length})</TabsTrigger>
              </TabsList>
              <Button size="sm" onClick={() => setIsPostOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Post Internship
              </Button>
            </div>

            {/* Active Postings */}
            <TabsContent value="active">
              {activeJobs.length === 0 ? (
                <div className="text-center py-16 border rounded-xl border-dashed">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No active internship listings.</p>
                  <Button size="sm" onClick={() => setIsPostOpen(true)} className="mt-4 gap-1.5">
                    <Plus className="h-4 w-4" /> Create first listing
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeJobs.map(job => {
                    const jobApplicants = appsList.filter((a: any) => a.internship_id === job.id);
                    const acceptedApplicants = jobApplicants.filter((a: any) => a.status === "accepted" || a.status === "offered");
                    const acceptanceRate = jobApplicants.length ? Math.round((acceptedApplicants.length / jobApplicants.length) * 100) : 0;
                    const averageMatchScore = jobApplicants.length
                      ? Math.round(jobApplicants.reduce((sum: number, a: any) => sum + getMockMatchScore(a), 0) / jobApplicants.length)
                      : 0;

                    return (
                      <InternshipRecruiterCard
                        key={job.id}
                        job={job}
                        applicantsCount={jobApplicants.length}
                        acceptanceRate={acceptanceRate}
                        averageMatchScore={averageMatchScore}
                        onEdit={() => startEditJob(job)}
                        onDuplicate={() => duplicateJob(job)}
                        onTogglePublish={() => togglePublishJob(job)}
                        onClosePosting={() => closeJobPosting(job)}
                        onDelete={() => {
                          if (confirm("Delete this internship posting permanently?")) {
                            deleteMutation.mutate({ id: job.id });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Draft Listings */}
            <TabsContent value="drafts">
              {draftJobs.length === 0 ? (
                <div className="text-center py-16 border rounded-xl border-dashed text-sm text-muted-foreground">
                  No draft internship postings.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {draftJobs.map(job => (
                    <InternshipRecruiterCard
                      key={job.id}
                      job={job}
                      applicantsCount={0}
                      acceptanceRate={0}
                      averageMatchScore={0}
                      onEdit={() => startEditJob(job)}
                      onDuplicate={() => duplicateJob(job)}
                      onTogglePublish={() => togglePublishJob(job)}
                      onClosePosting={() => closeJobPosting(job)}
                      onDelete={() => {
                        if (confirm("Delete this draft permanently?")) {
                          deleteMutation.mutate({ id: job.id });
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Closed Listings */}
            <TabsContent value="closed">
              {closedJobs.length === 0 ? (
                <div className="text-center py-16 border rounded-xl border-dashed text-sm text-muted-foreground">
                  No archived/closed listings.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {closedJobs.map(job => {
                    const jobApplicants = appsList.filter((a: any) => a.internship_id === job.id);
                    const acceptedApplicants = jobApplicants.filter((a: any) => a.status === "accepted" || a.status === "offered");
                    const acceptanceRate = jobApplicants.length ? Math.round((acceptedApplicants.length / jobApplicants.length) * 100) : 0;
                    const averageMatchScore = jobApplicants.length
                      ? Math.round(jobApplicants.reduce((sum: number, a: any) => sum + getMockMatchScore(a), 0) / jobApplicants.length)
                      : 0;

                    return (
                      <InternshipRecruiterCard
                        key={job.id}
                        job={job}
                        applicantsCount={jobApplicants.length}
                        acceptanceRate={acceptanceRate}
                        averageMatchScore={averageMatchScore}
                        onEdit={() => startEditJob(job)}
                        onDuplicate={() => duplicateJob(job)}
                        onTogglePublish={() => togglePublishJob(job)}
                        onClosePosting={null}
                        onDelete={() => {
                          if (confirm("Delete this archived listing permanently?")) {
                            deleteMutation.mutate({ id: job.id });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 5. Applicant Management Tab */}
        <TabsContent value="applicants">
          <Card className="p-6 shadow-sm border bg-card">
            {/* Searching & Filtering Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants (name, university, skills...)"
                  className="pl-9 text-xs"
                  value={applicantSearch}
                  onChange={(e) => setApplicantSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={applicantStatusFilter} onValueChange={setApplicantStatusFilter}>
                  <SelectTrigger className="w-36 text-xs h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={applicantSort} onValueChange={setApplicantSort}>
                  <SelectTrigger className="w-40 text-xs h-9">
                    <SelectValue placeholder="Sort Applicants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent Submissions</SelectItem>
                    <SelectItem value="match-high">Match Score: High</SelectItem>
                    <SelectItem value="match-low">Match Score: Low</SelectItem>
                  </SelectContent>
                </Select>

                {comparedApplicantIds.length >= 2 && (
                  <Button size="sm" onClick={() => setActiveTab("compare")} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
                    <GitCompare className="h-4 w-4" /> Compare ({comparedApplicantIds.length})
                  </Button>
                )}

                {comparedApplicantIds.length > 0 && (
                  <Select onValueChange={handleBulkAction} value="">
                    <SelectTrigger className="w-36 text-xs h-9 bg-slate-900 text-white hover:bg-slate-800">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shortlist">Bulk Shortlist</SelectItem>
                      <SelectItem value="reject">Bulk Reject</SelectItem>
                      <SelectItem value="bookmark">Bulk Bookmark</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {applicationsQ.isLoading ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Loading applicant submissions...</p>
            ) : sortedApplicants.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No applicants found matching the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Applicant Details</TableHead>
                      <TableHead>Applied Internship</TableHead>
                      <TableHead className="text-center">Match Fit</TableHead>
                      <TableHead>Recruitment Stage</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedApplicants.map((app: any) => {
                      const name = app.profile?.full_name ?? "Student Candidate";
                      const email = app.profile?.email ?? "No email";
                      const matchScore = getMockMatchScore(app);
                      const bookmarked = isCandidateBookmarked(app);

                      return (
                        <TableRow key={app.id} className={bookmarked ? "bg-amber-500/5 hover:bg-amber-500/10" : ""}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={comparedApplicantIds.includes(app.id)}
                              onChange={() => toggleCompareApplicant(app.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                              aria-label="Select applicant to compare"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="relative shrink-0">
                                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                  {name[0]?.toUpperCase()}
                                </div>
                                {bookmarked && (
                                  <span className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-background">
                                    <Bookmark className="h-2 w-2 text-white fill-white" />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                                  {name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-foreground leading-none">{app.internship?.title}</p>
                              <span className="text-[10px] text-muted-foreground">{app.internship?.company}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`font-bold font-display ${
                              matchScore >= 85 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                              matchScore >= 70 ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" :
                              "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}>
                              {matchScore}% Fit
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                app.status === "accepted" || app.status === "offered" ? "default" :
                                app.status === "rejected" ? "destructive" :
                                app.status === "interviewing" ? "secondary" : "outline"
                              }
                              className="capitalize font-semibold text-[10px]"
                            >
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={bookmarked ? "text-amber-500" : "text-muted-foreground"}
                                onClick={() => toggleBookmarkApplicant(app)}
                                aria-label="Bookmark candidate"
                              >
                                <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() => setSelectedApplicant(app)}
                              >
                                <Eye className="h-3.5 w-3.5" /> Review
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

        {/* 6. Candidate Comparison Tab */}
        <TabsContent value="compare">
          {selectedApplicantsForCompare.length === 0 ? (
            <Card className="p-8 text-center border shadow-sm max-w-md mx-auto space-y-4">
              <GitCompare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <div>
                <h3 className="font-bold text-sm">No candidates selected</h3>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Go to the **Applicants** tab, check the selection boxes next to at least 2 candidates, and click compare.
                </p>
              </div>
              <Button size="sm" onClick={() => setActiveTab("applicants")}>Go to Applicants list</Button>
            </Card>
          ) : (
            <Card className="p-6 border shadow-sm">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                  <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-indigo-600" /> Candidate Comparison Matrix
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Comparing {selectedApplicantsForCompare.length} candidates side-by-side.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setComparedApplicantIds([])} className="text-xs text-destructive hover:bg-destructive/5 hover:text-destructive">
                  Clear Matrix
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="border rounded-lg">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-48 font-bold text-foreground">Criteria</TableHead>
                      {selectedApplicantsForCompare.map((app: any) => (
                        <TableHead key={app.id} className="min-w-[200px] font-bold text-foreground text-center border-l">
                          {app.profile?.full_name ?? "Candidate"}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 1. Profile / Info */}
                    <TableRow>
                      <TableCell className="font-semibold text-xs bg-muted/10">Location & University</TableCell>
                      {selectedApplicantsForCompare.map((app: any) => (
                        <TableCell key={app.id} className="text-center text-xs border-l leading-relaxed py-4">
                          <p className="font-semibold">{app.profile?.location ?? "Bangladesh"}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Array.isArray(app.profile?.education) && app.profile.education.length > 0
                              ? app.profile.education.join(" · ")
                              : "No university listed"}
                          </p>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* 2. Match Score */}
                    <TableRow>
                      <TableCell className="font-semibold text-xs bg-muted/10">Skill Match Score</TableCell>
                      {selectedApplicantsForCompare.map((app: any) => {
                        const score = getMockMatchScore(app);
                        return (
                          <TableCell key={app.id} className="text-center border-l py-4">
                            <span className={`inline-block font-display font-bold text-lg px-3 py-1 rounded-full ${
                              score >= 85 ? "bg-emerald-500/10 text-emerald-600" :
                              score >= 70 ? "bg-indigo-500/10 text-indigo-600" :
                              "bg-amber-500/10 text-amber-600"
                            }`}>
                              {score}%
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* 3. Matched Skills */}
                    <TableRow>
                      <TableCell className="font-semibold text-xs bg-muted/10">Key Matched Skills</TableCell>
                      {selectedApplicantsForCompare.map((app: any) => {
                        const profileSkills = Array.isArray(app.profile?.skills) ? app.profile.skills : ["React", "CSS", "Git"];
                        const jobTech = Array.isArray(app.internship?.tech_stack) ? app.internship.tech_stack : ["React"];
                        const matched = profileSkills.filter((s: string) => 
                          jobTech.some((j: string) => j.toLowerCase().includes(s.toLowerCase()))
                        ).slice(0, 4);
                        if (matched.length === 0) matched.push(...profileSkills.slice(0, 2));

                        return (
                          <TableCell key={app.id} className="border-l p-4">
                            <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                              {matched.map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-[9px] bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 gap-0.5">
                                  <Check className="h-2 w-2" /> {s}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* 4. Experience & Projects */}
                    <TableRow>
                      <TableCell className="font-semibold text-xs bg-muted/10">Project & Portfolios</TableCell>
                      {selectedApplicantsForCompare.map((app: any) => (
                        <TableCell key={app.id} className="text-center text-xs border-l py-4 space-y-2">
                          <div className="flex items-center justify-center gap-1.5">
                            {app.profile?.github_url ? (
                              <a href={app.profile.github_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                                GitHub <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px]">No Github</span>
                            )}
                            <span>·</span>
                            {app.profile?.portfolio_url ? (
                              <a href={app.profile.portfolio_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                                Portfolio <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px]">No site</span>
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* 5. Stage Actions */}
                    <TableRow>
                      <TableCell className="font-semibold text-xs bg-muted/10">Quick Actions</TableCell>
                      {selectedApplicantsForCompare.map((app: any) => (
                        <TableCell key={app.id} className="text-center border-l py-4">
                          <div className="flex flex-col gap-1.5 justify-center max-w-[140px] mx-auto">
                            <Button size="sm" variant="outline" className="text-xs w-full py-1 h-8" onClick={() => setSelectedApplicant(app)}>
                              Review File
                            </Button>
                            {app.status === "applied" && (
                              <div className="flex gap-1.5 w-full">
                                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs py-1 h-8 px-0" onClick={() => updateStatusMutation.mutate({ id: app.id, status: "interviewing" })}>
                                  Shortlist
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1 text-xs py-1 h-8 px-0" onClick={() => updateStatusMutation.mutate({ id: app.id, status: "rejected" })}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* 7. Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Top KPI stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 shadow-sm border bg-card">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Applicant Yield</p>
              <h3 className="text-3xl font-extrabold mt-1 font-display">{totalApplicantsCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Submitted across active roles</p>
            </Card>
            <Card className="p-5 shadow-sm border bg-card">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Workspace Conversion Rate</p>
              <h3 className="text-3xl font-extrabold mt-1 font-display">
                {totalViewsCount ? Math.round((totalApplicantsCount / totalViewsCount) * 100) : 0}%
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Total applications / total views</p>
            </Card>
            <Card className="p-5 shadow-sm border bg-card">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Average Skill Alignment</p>
              <h3 className="text-3xl font-extrabold mt-1 font-display">{averageMatchScore}%</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Recruiter requirements match score</p>
            </Card>
            <Card className="p-5 shadow-sm border bg-card">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Shortlisting Rate</p>
              <h3 className="text-3xl font-extrabold mt-1 font-display">
                {totalApplicantsCount ? Math.round((offeredCount / totalApplicantsCount) * 100) : 0}%
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Candidates marked offered/accepted</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Applications per job */}
            <Card className="p-5 shadow-sm border bg-card">
              <h2 className="font-display font-bold text-sm border-b pb-3 mb-4">Applications per Internship</h2>
              <div className="h-[250px] w-full">
                {appsPerJobData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-20 italic">No job postings to display.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appsPerJobData}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis allowDecimals={false} stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                      />
                      <Bar dataKey="Applicants" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Performance job views */}
            <Card className="p-5 shadow-sm border bg-card">
              <h2 className="font-display font-bold text-sm border-b pb-3 mb-4">Postings Views Performance</h2>
              <div className="h-[250px] w-full">
                {mostViewedJobsData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-20 italic">No views data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostViewedJobsData} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis dataKey="name" type="category" width={100} stroke="var(--muted-foreground)" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                      />
                      <Bar dataKey="Views" fill="var(--secondary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Tech demand reports */}
            <Card className="p-5 shadow-sm border bg-card md:col-span-2">
              <h2 className="font-display font-bold text-sm border-b pb-3 mb-4">Required Skills Demand Index</h2>
              <div className="h-[260px] w-full">
                {topRequiredSkillsData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-20 italic">Add required skills/tech stacks to your jobs to see reports.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topRequiredSkillsData}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis allowDecimals={false} stroke="var(--muted-foreground)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                      />
                      <Bar dataKey="Demand" radius={[4, 4, 0, 0]}>
                        {topRequiredSkillsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["var(--primary)", "var(--secondary)", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"][index % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 8. Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 shadow-sm border bg-card flex flex-col justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-bold border-b border-border pb-4 mb-4">
                  <Mail className="h-5 w-5 text-primary" /> Recruiter Notification Configuration
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Set alerts for new application actions, expiration limits, or verified status.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Email Alerts</Label>
                      <p className="text-xs text-muted-foreground">Receive daily digests of new student applications.</p>
                    </div>
                    <Switch
                      checked={emailNotify}
                      onCheckedChange={(val) => {
                        setEmailNotify(val);
                        localStorage.setItem("recruiter_email_notify", String(val));
                        toast.success(`Email alerts ${val ? "enabled" : "disabled"}`);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get instant notifications in the recruiter dashboard.</p>
                    </div>
                    <Switch
                      checked={browserNotify}
                      onCheckedChange={(val) => {
                        setBrowserNotify(val);
                        localStorage.setItem("recruiter_browser_notify", String(val));
                        toast.success(`Push alerts ${val ? "enabled" : "disabled"}`);
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm border bg-card flex flex-col justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-bold border-b border-border pb-4 mb-4">
                  <Settings className="h-5 w-5 text-primary" /> Recruiter Workspace Options
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Configure corporate profile visibility options.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Profile Visibility</Label>
                      <p className="text-xs text-muted-foreground">Make company profile and review page visible to students.</p>
                    </div>
                    <Switch
                      checked={profileVisible}
                      onCheckedChange={(val) => {
                        setProfileVisible(val);
                        localStorage.setItem("recruiter_profile_visible", String(val));
                        toast.success(`Profile visibility set to ${val ? "public" : "hidden"}`);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Developer Mode</Label>
                      <p className="text-xs text-muted-foreground">Enable verbose logs and diagnostic features.</p>
                    </div>
                    <Switch
                      checked={devMode}
                      onCheckedChange={(val) => {
                        setDevMode(val);
                        localStorage.setItem("recruiter_dev_mode", String(val));
                        toast.success(`Developer Mode ${val ? "enabled" : "disabled"}`);
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm md:col-span-2 border border-destructive/20 bg-destructive/5 rounded-xl">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-destructive border-b border-destructive/10 pb-4 mb-4">
                Danger Zone
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Irreversible actions that modify or clear your workspace postings and profile data. Use with caution.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-destructive/10 bg-background flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-foreground">Delete All Postings</h3>
                    <p className="text-xs text-muted-foreground">
                      Remove all active and draft internship listings posted by this account.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-fit text-xs"
                    onClick={handleClearAllPostings}
                  >
                    Clear All Postings
                  </Button>
                </div>
                <div className="p-4 rounded-xl border border-destructive/10 bg-background flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-foreground">Reset Profile Form</h3>
                    <p className="text-xs text-muted-foreground">
                      Clear all input values on your profile form and logo fields locally.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit border-destructive text-destructive hover:bg-destructive/10 text-xs"
                    onClick={handleResetProfile}
                  >
                    Reset Profile Details
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 9. Applicant Review Drawer Dialog */}
      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
        {selectedApplicant && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <div>
                <DialogTitle>Applicant Profile File</DialogTitle>
                <DialogDescription>
                  Review candidate credentials, match analysis, and recruitment status.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`mr-4 ${isCandidateBookmarked(selectedApplicant) ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"}`}
                onClick={() => toggleBookmarkApplicant(selectedApplicant)}
                aria-label="Bookmark candidate toggle"
              >
                <Bookmark className="h-5 w-5 fill-current" />
              </Button>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              {/* Left Column: Match details, private notes, timeline */}
              <div className="space-y-6">
                {/* 1. Header Profile details */}
                <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                  <div className="h-14 w-14 rounded-full bg-indigo-500/10 text-indigo-600 font-bold font-display text-xl flex items-center justify-center">
                    {selectedApplicant.profile?.full_name?.[0]?.toUpperCase() ?? "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold font-display truncate">
                      {selectedApplicant.profile?.full_name ?? "Student Applicant"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" /> {selectedApplicant.profile?.location ?? "Bangladesh"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{selectedApplicant.profile?.email}</p>
                    <p className="text-xs text-muted-foreground">{selectedApplicant.profile?.phone ?? "No phone"}</p>
                  </div>
                </div>

                {/* 2. Candidate match analytics */}
                <Card className="p-4 border shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" /> Skill Alignment Analysis
                  </h4>
                  {applicantMatchLoading ? (
                    <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
                      <p>Calculating skill overlap and fit score...</p>
                    </div>
                  ) : applicantMatchData ? (
                    <div className="space-y-4">
                      {/* Fit Score Progress */}
                      <div className="flex items-center gap-4 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                        <div className="h-14 w-14 shrink-0 rounded-full border-4 border-indigo-600 flex items-center justify-center font-display font-black text-indigo-600 text-sm">
                          {applicantMatchData.coverage}%
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-indigo-955">Technical Match Fit</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                            Overlap score matches student resume skills against mandatory job requirements.
                          </p>
                        </div>
                      </div>

                      {/* AI Recruiter recommendation */}
                      <div className="p-3 bg-muted/40 rounded-xl border text-xs leading-relaxed space-y-1.5">
                        <p className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                          <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Recruiter Summary (Gemini)
                        </p>
                        <p className="text-muted-foreground">{applicantMatchData.recommendation}</p>
                      </div>

                      {/* Matched vs Missing list */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <p className="font-bold text-emerald-700 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Matched
                          </p>
                          <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                            {applicantMatchData.matched.length === 0 ? (
                              <span className="text-[10px] text-muted-foreground italic">None</span>
                            ) : (
                              applicantMatchData.matched.map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-none">{s}</Badge>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                          <p className="font-bold text-rose-700 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                            <X className="h-3.5 w-3.5 text-rose-600" /> Missing
                          </p>
                          <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                            {applicantMatchData.missing.length === 0 ? (
                              <span className="text-[10px] text-muted-foreground italic">None</span>
                            ) : (
                              applicantMatchData.missing.map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-[9px] bg-rose-500/10 text-rose-700 border-none">{s}</Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Match data unavailable.</p>
                  )}
                </Card>

                {/* 3. Social connections */}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {selectedApplicant.profile?.linkedin_url && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                      <a href={selectedApplicant.profile.linkedin_url} target="_blank" rel="noreferrer">
                        <Linkedin className="h-3.5 w-3.5" /> LinkedIn <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Button>
                  )}
                  {selectedApplicant.profile?.github_url && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                      <a href={selectedApplicant.profile.github_url} target="_blank" rel="noreferrer">
                        <Github className="h-3.5 w-3.5" /> GitHub <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Button>
                  )}
                  {selectedApplicant.profile?.portfolio_url && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                      <a href={selectedApplicant.profile.portfolio_url} target="_blank" rel="noreferrer">
                        <Globe className="h-3.5 w-3.5" /> Portfolio <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Column: private notes, resume preview, and timeline */}
              <div className="space-y-6">
                {/* 1. Resume Viewer */}
                <Card className="p-4 border shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4.5 w-4.5 text-primary" /> Candidate Resume File
                    </h4>
                    <div className="flex gap-1.5">
                      <Button
                        size="xs"
                        variant={cvPreviewMode === "preview" ? "default" : "outline"}
                        className="text-[10px] px-2 h-6"
                        onClick={() => setCvPreviewMode("preview")}
                      >
                        Preview
                      </Button>
                      <Button
                        size="xs"
                        variant={cvPreviewMode === "download" ? "default" : "outline"}
                        className="text-[10px] px-2 h-6"
                        onClick={() => setCvPreviewMode("download")}
                      >
                        Details
                      </Button>
                    </div>
                  </div>

                  {selectedApplicant.cv_url ? (
                    cvPreviewMode === "preview" ? (
                      <div className="border rounded-lg overflow-hidden h-[240px] bg-muted relative">
                        <iframe
                          src={selectedApplicant.cv_url}
                          title="Candidate CV Preview"
                          className="w-full h-full"
                        />
                        <div className="absolute bottom-2 right-2">
                          <Button size="xs" variant="secondary" className="gap-1 opacity-90 shadow text-[9px]" asChild>
                            <a href={selectedApplicant.cv_url} target="_blank" rel="noreferrer">
                              Fullscreen <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg bg-muted/20 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Resume PDF document:</span>
                          <Button size="xs" variant="outline" className="gap-1 h-7" asChild>
                            <a href={selectedApplicant.cv_url} target="_blank" rel="noreferrer">
                              Download PDF <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                        {selectedApplicant.ssc_certificate_url && (
                          <div className="flex items-center justify-between border-t pt-2">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-amber-500" /> Secondary School Certificate:
                            </span>
                            <a href={selectedApplicant.ssc_certificate_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                              View file <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        )}
                        {selectedApplicant.hsc_certificate_url && (
                          <div className="flex items-center justify-between border-t pt-2">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-emerald-500" /> Higher Secondary Certificate:
                            </span>
                            <a href={selectedApplicant.hsc_certificate_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                              View file <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="py-12 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                      No CV file uploaded.
                    </div>
                  )}
                </Card>

                {/* 2. Recruitment timeline */}
                <Card className="p-4 border shadow-sm max-h-[160px] overflow-y-auto">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Application status history timeline
                  </h4>
                  {applicantMatchData?.timeline && applicantMatchData.timeline.length > 0 ? (
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20 text-xs font-semibold">
                      {applicantMatchData.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[13px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold capitalize text-foreground">{step.status}</p>
                            <span className="text-[10px] text-muted-foreground">{new Date(step.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No history logged.</p>
                  )}
                </Card>

                {/* 3. Recruiter Private Notes */}
                <div className="space-y-2">
                  <Label htmlFor="rec-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" /> Private Recruiter Notes
                  </Label>
                  <Textarea
                    id="rec-notes"
                    value={recruiterNotesInput}
                    onChange={(e) => setRecruiterNotesInput(e.target.value)}
                    placeholder="Enter private observations (interviews feedback, communication maturity, React/TypeScript test remarks...) - visible only to recruiters"
                    rows={3}
                    className="text-xs bg-muted/20"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={saveRecruiterNotes}
                      disabled={isNotesSaving}
                      className="text-xs bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {isNotesSaving ? "Saving..." : "Save Private Notes"}
                    </Button>
                  </div>
                </div>

                {/* Interview Scheduler Card */}
                {selectedApplicant.status === "interviewing" && (
                  <Card className="p-4 border shadow-sm space-y-3 bg-violet-500/5 border-violet-500/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> Interview Scheduler
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <Label htmlFor="int-date" className="text-[10px]">Date</Label>
                        <Input
                          id="int-date"
                          type="date"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="int-time" className="text-[10px]">Time</Label>
                        <Input
                          id="int-time"
                          type="time"
                          value={interviewTime}
                          onChange={(e) => setInterviewTime(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Label htmlFor="int-link" className="text-[10px]">Meeting URL</Label>
                      <Input
                        id="int-link"
                        value={interviewLink}
                        onChange={(e) => setInterviewLink(e.target.value)}
                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <Label htmlFor="int-instr" className="text-[10px]">Interviewer Instructions</Label>
                      <Textarea
                        id="int-instr"
                        value={interviewInstructions}
                        onChange={(e) => setInterviewInstructions(e.target.value)}
                        placeholder="Prepare a 10-minute demo of your portfolio project..."
                        rows={2}
                        className="text-xs bg-background"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        size="xs"
                        onClick={saveInterviewSchedule}
                        disabled={isInterviewSaving}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
                      >
                        {isInterviewSaving ? "Saving Schedule..." : "Save Interview Schedule"}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 4. Update Recruitment Stage selector */}
                <div className="border-t border-border pt-4 space-y-2">
                  <Label htmlFor="recruiter-app-status" className="text-xs font-semibold">Change Stage Status</Label>
                  <div className="flex gap-2 items-center">
                    <div className="w-56">
                      <Select
                        value={selectedApplicant.status}
                        onValueChange={(val) =>
                          updateStatusMutation.mutate({ id: selectedApplicant.id, status: val })
                        }
                      >
                        <SelectTrigger id="recruiter-app-status" className="h-9 text-xs">
                          <SelectValue placeholder="Move Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied (Reviewing)</SelectItem>
                          <SelectItem value="interviewing">Interviewing</SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {updateStatusMutation.isPending && (
                      <span className="text-[10px] text-muted-foreground animate-pulse">Updating...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 border-t border-border pt-3">
              <Button onClick={() => setSelectedApplicant(null)}>Close Review File</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// Helpers for social icon mapping
function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// Sub-component for Internship Recruiter Card listing
function InternshipRecruiterCard({
  job,
  applicantsCount,
  acceptanceRate,
  averageMatchScore,
  onEdit,
  onDuplicate,
  onTogglePublish,
  onClosePosting,
  onDelete
}: {
  job: any;
  applicantsCount: number;
  acceptanceRate: number;
  averageMatchScore: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePublish: (() => void) | null;
  onClosePosting: (() => void) | null;
  onDelete: () => void;
}) {
  return (
    <Card className="p-5 border border-border flex flex-col justify-between hover:shadow-md transition-shadow bg-card relative overflow-hidden group">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base font-display line-clamp-1">{job.title}</h3>
          <div className="flex gap-1 shrink-0">
            <Badge variant={job.status === "published" ? "default" : job.status === "closed" ? "destructive" : "secondary"} className="text-[9px] font-semibold py-0.5 capitalize">
              {job.status}
            </Badge>
            <Badge variant="outline" className="text-[9px] capitalize py-0.5">{job.work_model || "on-site"}</Badge>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {job.location} · <Wallet className="h-3 w-3" /> {job.salary || "Negotiable"}
        </p>

        {job.required_cgpa && (
          <p className="text-[10px] text-indigo-600 font-semibold mt-1">
            Min. Required CGPA: {job.required_cgpa}
          </p>
        )}

        {job.deadline && (
          <p className="text-[10px] text-rose-500 font-semibold mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{job.cleanDescription || job.description}</p>
        
        <div className="flex gap-1.5 flex-wrap mt-3.5">
          {Array.isArray(job.tech_stack) && job.tech_stack.slice(0, 3).map((t: string) => (
            <Badge key={t} variant="secondary" className="text-[9px] px-2 py-0">{t}</Badge>
          ))}
        </div>

        {/* Detailed Performance Metrics widgets */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg text-[10px]">
          <div>
            <span className="text-muted-foreground block">Avg. Match Fit</span>
            <span className="font-bold text-foreground text-xs">{averageMatchScore}%</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Acceptance Rate</span>
            <span className="font-bold text-foreground text-xs">{acceptanceRate}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" /> {applicantsCount} applicants
        </span>

        <div className="flex items-center gap-1">
          {/* Quick toggle publish draft */}
          {onTogglePublish && (
            <Button
              variant="outline"
              size="xs"
              className="text-[10px] h-7 px-2"
              onClick={onTogglePublish}
            >
              {job.status === "published" ? "Unpublish" : "Publish"}
            </Button>
          )}

          {/* Quick close posting */}
          {job.status === "published" && onClosePosting && (
            <Button
              variant="outline"
              size="xs"
              className="text-[10px] h-7 px-2 text-amber-600 border-amber-600/20 hover:bg-amber-600/5 hover:text-amber-600"
              onClick={onClosePosting}
            >
              Close
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            className="text-[10px] h-7 px-2"
            onClick={onEdit}
          >
            Edit
          </Button>

          <Button
            variant="outline"
            size="xs"
            className="text-[10px] h-7 px-2"
            onClick={onDuplicate}
          >
            Duplicate
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={onDelete}
            aria-label="Delete listing permanent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
