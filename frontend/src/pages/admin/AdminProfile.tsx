import { motion } from "framer-motion";
import { Mail, ShieldCheck, Users, GraduationCap, BookOpen, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, studentsApi, coursesApi, semestersApi } from "@/lib/api";

export default function AdminProfile() {
  const { user } = useAuth();
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });

  const fullName = user?.display_name ?? user?.name ?? "System Admin";
  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const activeSem = semesters.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your CIS administrator account" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-destructive/10 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-destructive/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-destructive text-2xl font-bold text-destructive-foreground shadow-lg">
            {initials || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-semibold text-foreground">{fullName}</h2>
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{user?.role ?? "system_admin"}</Badge>
              <Badge>Full system access</Badge>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2"
        >
          <h3 className="mb-4 font-semibold text-foreground">Account information</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <ReadField icon={Mail} label="Email" value={user?.email} />
            <ReadField icon={ShieldCheck} label="Role" value={user?.role ?? "system_admin"} />
            <ReadField icon={ShieldCheck} label="Account status" value="Active" />
            <ReadField icon={Calendar} label="Active semester" value={activeSem?.name ?? "None set"} />
          </dl>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-foreground">System snapshot</h3>
            <div className="space-y-3">
              <Metric icon={Users} label="Total accounts" value={String(users.length)} />
              <Metric icon={GraduationCap} label="Students" value={String(students.length)} />
              <Metric icon={BookOpen} label="Courses" value={String(courses.length)} />
              <Metric icon={Calendar} label="Semesters" value={String(semesters.length)} />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
      {children}
    </span>
  );
}

function ReadField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted/60 p-1.5 text-muted-foreground"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate font-medium text-foreground">{value || "—"}</dd>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
