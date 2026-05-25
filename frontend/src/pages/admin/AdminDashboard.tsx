import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, GraduationCap, BookOpen, Calendar, ClipboardList,
  ShieldAlert, ArrowRight, Activity, UserCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { usersApi, studentsApi, coursesApi, semestersApi, offeringsApi, financeApi } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  student: "Students", teacher: "Instructors", instructor: "Instructors",
  staff: "Academic Staff", academic_staff: "Academic Staff",
  finance_staff: "Finance Staff", admin: "Admins", system_admin: "Admins",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: usersApi.list });
  const { data: pendingUsers = [] } = useQuery({ queryKey: ["admin-users-pending"], queryFn: usersApi.pending });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => offeringsApi.list() });
  const { data: holds = [] } = useQuery({ queryKey: ["finance-holds", true], queryFn: () => financeApi.holds({ active_only: true }) });

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const k = ROLE_LABELS[u.role] ?? u.role;
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const activeSemester = semesters.find((s) => s.is_active);
  const inactiveAccounts = users.filter((u) => !u.is_active).length;
  const firstName = user?.display_name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Welcome back, {firstName}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {users.length} accounts · {students.length} students · {courses.length} courses · {activeSemester?.name ?? "no active semester"}.
        </p>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Users" value={String(users.length)} icon={Users} accent="from-primary/15 to-primary/5" onClick={() => navigate("/admin/users")} hint={`${inactiveAccounts} inactive`} />
        <StatTile label="Students" value={String(students.length)} icon={GraduationCap} accent="from-info/15 to-info/5" onClick={() => navigate("/admin/students")} />
        <StatTile label="Courses" value={String(courses.length)} icon={BookOpen} accent="from-success/15 to-success/5" onClick={() => navigate("/admin/courses")} hint={`${offerings.length} offerings`} />
        <StatTile label="Pending approval" value={String(pendingUsers.length)} icon={UserCheck} accent={pendingUsers.length ? "from-warning/15 to-warning/5" : "from-muted/40 to-muted/10"} onClick={() => navigate("/admin/users")} hint={pendingUsers.length ? "Review now" : "All clear"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <h3 className="mb-4 font-semibold text-foreground">Accounts by Role</h3>
          <div className="space-y-3">
            {roleBreakdown.map(([label, count]) => {
              const pct = (count / users.length) * 100;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground"><span className="font-semibold text-foreground">{count}</span> · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Current Semester
            </h3>
            {activeSemester ? (
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={activeSemester.name} />
                <Row label="Starts" value={activeSemester.start_date} />
                <Row label="Ends" value={activeSemester.end_date} />
                <Row label="Reg. deadline" value={activeSemester.registration_deadline} />
                <Row label="Drop deadline" value={activeSemester.drop_deadline} />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No semester is currently active.</p>
            )}
          </div>

          <div className={`rounded-xl border p-5 shadow-card ${holds.length ? "border-destructive/30 bg-destructive/5" : "bg-card"}`}>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <ShieldAlert className={`h-4 w-4 ${holds.length ? "text-destructive" : "text-muted-foreground"}`} />
              Active Account Holds
            </h3>
            <p className="text-3xl font-bold text-foreground">{holds.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{holds.length ? "Students with restrictions" : "No active holds"}</p>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickLink icon={Users} label="Manage users" onClick={() => navigate("/admin/users")} />
        <QuickLink icon={Calendar} label="Manage semesters" onClick={() => navigate("/admin/semesters")} />
        <QuickLink icon={ClipboardList} label="Registrations" onClick={() => navigate("/admin/registrations")} />
        <QuickLink icon={Activity} label="View analytics" onClick={() => navigate("/admin/analytics")} />
      </motion.section>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent, hint, onClick }: {
  label: string; value: string; icon: React.ElementType; accent: string; hint?: string; onClick?: () => void;
}) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${accent} p-5 text-left shadow-card transition-shadow hover:shadow-card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur"><Icon className="h-5 w-5 text-foreground" /></div>
      </div>
    </motion.button>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15"><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
