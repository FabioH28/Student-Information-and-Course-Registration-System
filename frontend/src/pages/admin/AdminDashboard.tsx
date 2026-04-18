import { motion } from "framer-motion";
import { Users, BookOpen, CalendarDays, TrendingUp, AlertTriangle, Activity, ArrowUpRight, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

const recentActivity = [
  { action: "New registration", detail: "Sarah Kim registered for CS301", time: "2 min ago" },
  { action: "Course added", detail: "CS305 Compiler Design added to catalog", time: "1 hour ago" },
  { action: "Risk alert", detail: "3 students flagged with medium risk", time: "3 hours ago" },
  { action: "Semester update", detail: "Registration deadline extended to Mar 15", time: "5 hours ago" },
];

const popularCourses = [
  { name: "Machine Learning Intro", code: "CS301", enrolled: 48, capacity: 50 },
  { name: "Software Engineering", code: "CS302", enrolled: 42, capacity: 45 },
  { name: "Data Structures", code: "CS201", enrolled: 55, capacity: 60 },
  { name: "AI Foundations", code: "CS250", enrolled: 38, capacity: 40 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Spring 2026 — System overview and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="1,247" icon={Users} variant="primary" trend={{ value: "+23 this week", positive: true }} delay={0.05} />
        <StatCard title="Active Courses" value="86" icon={BookOpen} variant="info" delay={0.1} />
        <StatCard title="Registrations" value="3,482" icon={CalendarDays} variant="success" trend={{ value: "+156 today", positive: true }} delay={0.15} />
        <StatCard title="At-Risk Students" value="24" subtitle="1.9% of total" icon={AlertTriangle} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Courses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Most Popular Courses
          </h3>
          <div className="space-y-3">
            {popularCourses.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-14 text-right">{c.enrolled}/{c.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk Distribution */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-card rounded-xl border p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Student Risk Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { level: "Low Risk", count: 1156, pct: "92.7%", variant: "success" as const },
            { level: "Medium Risk", count: 67, pct: "5.4%", variant: "warning" as const },
            { level: "High Risk", count: 24, pct: "1.9%", variant: "danger" as const },
          ].map(r => (
            <div key={r.level} className="text-center p-4 rounded-lg bg-muted/50">
              <StatusBadge variant={r.variant}>{r.level}</StatusBadge>
              <p className="text-2xl font-bold text-foreground mt-2">{r.count}</p>
              <p className="text-xs text-muted-foreground">{r.pct}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
