import { motion } from "framer-motion";
import { BookOpen, CalendarDays, GraduationCap, AlertTriangle, Sparkles, Clock, TrendingUp, Bot } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

const timetableData = [
  { time: "09:00", course: "Data Structures", room: "Hall A-201", color: "bg-primary/10 border-primary/30 text-primary" },
  { time: "11:00", course: "Linear Algebra", room: "Hall B-105", color: "bg-info/10 border-info/30 text-info" },
  { time: "14:00", course: "AI Foundations", room: "Lab C-302", color: "bg-accent/10 border-accent/30 text-accent" },
];

const recentGrades = [
  { course: "Database Systems", grade: "A", credits: 3 },
  { course: "Web Development", grade: "A-", credits: 3 },
  { course: "Statistics", grade: "B+", credits: 4 },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Alex! 👋</h2>
            <p className="text-primary-foreground/80 mt-1">Spring 2026 • Week 8 of 16</p>
          </div>
          <button onClick={() => navigate("/student/chatbot")} className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm">
            <Bot className="w-4 h-4" /> Ask AI Assistant
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Courses" value={6} subtitle="18 Credits" icon={BookOpen} variant="primary" delay={0.1} />
        <StatCard title="Current GPA" value="3.72" icon={GraduationCap} variant="success" trend={{ value: "+0.05", positive: true }} delay={0.15} />
        <StatCard title="Pending Actions" value={3} subtitle="2 assignments, 1 survey" icon={Clock} variant="warning" delay={0.2} />
        <StatCard title="Academic Risk" value="Low" subtitle="Keep it up!" icon={AlertTriangle} variant="info" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Today's Schedule
            </h3>
            <button onClick={() => navigate("/student/timetable")} className="text-xs text-primary hover:underline font-medium">View full timetable</button>
          </div>
          <div className="space-y-3">
            {timetableData.map((item, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${item.color}`}>
                <span className="text-sm font-mono font-semibold w-14">{item.time}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.course}</p>
                  <p className="text-xs opacity-70">{item.room}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Grades */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Recent Grades
            </h3>
            <button onClick={() => navigate("/student/grades")} className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {recentGrades.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{item.course}</p>
                  <p className="text-xs text-muted-foreground">{item.credits} credits</p>
                </div>
                <StatusBadge variant="success">{item.grade}</StatusBadge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-xl border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" /> AI Recommendations
          </h3>
          <button onClick={() => navigate("/student/recommendations")} className="text-xs text-primary hover:underline font-medium">See all</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Machine Learning Intro", tag: "Fits your path", tagColor: "info" as const },
            { title: "Software Engineering", tag: "Recommended next", tagColor: "success" as const },
            { title: "Computer Networks", tag: "Balanced load", tagColor: "warning" as const },
          ].map((rec, i) => (
            <div key={i} className="p-4 rounded-lg border border-border hover:shadow-card-hover transition-shadow cursor-pointer bg-muted/30">
              <p className="font-medium text-sm text-foreground">{rec.title}</p>
              <StatusBadge variant={rec.tagColor} className="mt-2">{rec.tag}</StatusBadge>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
