import { motion } from "framer-motion";
import { BookOpen, Users, ClipboardList, GraduationCap, Activity, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

const recentRegistrations = [
  { student: "Alex Johnson", course: "Machine Learning", time: "5 min ago" },
  { student: "Sarah Kim", course: "Software Engineering", time: "12 min ago" },
  { student: "Maria Garcia", course: "Computer Networks", time: "1 hour ago" },
  { student: "Emma Davis", course: "Database Systems", time: "2 hours ago" },
];

const pendingActions = [
  { label: "Course approvals pending", count: 4, variant: "warning" as const },
  { label: "Registration conflicts", count: 2, variant: "danger" as const },
  { label: "Grade submissions due", count: 7, variant: "info" as const },
];

export default function AcademicDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Academic Staff Dashboard</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2026 — Academic operations overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="1,247" icon={Users} variant="primary" delay={0.05} />
        <StatCard title="Active Courses" value={86} icon={BookOpen} variant="info" delay={0.1} />
        <StatCard title="Registrations" value="3,482" icon={ClipboardList} variant="success" trend={{ value: "+156 today", positive: true }} delay={0.15} />
        <StatCard title="Avg GPA" value="3.42" icon={GraduationCap} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Registrations
            </h3>
            <button onClick={() => navigate("/academic-staff/registrations")} className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {recentRegistrations.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.student}</p>
                  <p className="text-xs text-muted-foreground">registered for {r.course}</p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{r.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Pending Actions</h3>
          <div className="space-y-3">
            {pendingActions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground">{a.label}</p>
                <StatusBadge variant={a.variant}>{a.count}</StatusBadge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
