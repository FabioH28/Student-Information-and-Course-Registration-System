import { motion } from "framer-motion";
import { BookOpen, Users, CheckSquare, GraduationCap, Clock, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

const upcomingSessions = [
  { time: "09:00", course: "Data Structures", code: "CS201", room: "Hall A-201", students: 42 },
  { time: "11:00", course: "Algorithms", code: "CS301", room: "Hall B-105", students: 38 },
  { time: "14:00", course: "Data Structures Lab", code: "CS201L", room: "Lab C-302", students: 20 },
];

const recentActivity = [
  { action: "Attendance marked", detail: "CS201 — Monday session", time: "2 hours ago" },
  { action: "Grades published", detail: "CS301 Midterm results", time: "Yesterday" },
  { action: "Grade updated", detail: "Alex Johnson — CS201", time: "2 days ago" },
];

export default function InstructorDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Welcome, Dr. Smith</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2026 — You have 3 courses this semester</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={3} subtitle="This semester" icon={BookOpen} variant="primary" delay={0.05} />
        <StatCard title="Total Students" value={100} subtitle="Across all courses" icon={Users} variant="info" delay={0.1} />
        <StatCard title="Sessions Today" value={3} icon={CheckSquare} variant="success" delay={0.15} />
        <StatCard title="Pending Grades" value={12} subtitle="Awaiting entry" icon={GraduationCap} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Today's Sessions
            </h3>
            <button onClick={() => navigate("/instructor/courses")} className="text-xs text-primary hover:underline font-medium">View all courses</button>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                <span className="text-sm font-mono font-semibold w-14 text-muted-foreground">{s.time}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{s.course}</p>
                  <p className="text-xs text-muted-foreground">{s.code} • {s.room}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{s.students}</span>
                </div>
                <button onClick={() => navigate("/instructor/attendance")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors">
                  Mark
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
