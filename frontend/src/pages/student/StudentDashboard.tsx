import { motion } from "framer-motion";
import { BookOpen, CalendarDays, GraduationCap, AlertTriangle, Sparkles, Clock, Bot } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, registrationsApi, offeringsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["student-me"],
    queryFn: studentsApi.me,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const activeRegs = registrations.filter(r => r.status === "active");

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings"],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
    enabled: activeRegs.length > 0,
  });

  const myOfferingIds = new Set(activeRegs.map(r => r.offering_id));
  const myOfferings = offerings.filter(o => myOfferingIds.has(o.id));

  const firstName = profile?.first_name ?? user?.display_name.split(" ")[0] ?? "Student";
  const gpa = profile ? Number(profile.gpa).toFixed(2) : "—";
  const semester = profile?.current_semester ?? "—";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {firstName}!</h2>
            <p className="text-primary-foreground/80 mt-1">Semester {semester} — Spring 2025</p>
          </div>
          <button onClick={() => navigate("/student/chatbot")} className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm">
            <Bot className="w-4 h-4" /> Ask AI Assistant
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Courses" value={activeRegs.length} subtitle={`${activeRegs.length * 3} Credits est.`} icon={BookOpen} variant="primary" delay={0.1} />
        <StatCard title="Current GPA" value={gpa} icon={GraduationCap} variant="success" delay={0.15} />
        <StatCard title="Status" value={profile?.status ?? "—"} subtitle="Academic standing" icon={AlertTriangle} variant={profile?.status === "probation" ? "warning" : "info"} delay={0.2} />
        <StatCard title="Semester" value={semester} subtitle="Current semester" icon={Clock} variant="info" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> My Registered Courses
            </h3>
            <button onClick={() => navigate("/student/registration")} className="text-xs text-primary hover:underline font-medium">Manage</button>
          </div>
          {myOfferings.length === 0 && activeRegs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active registrations.</p>
          ) : (
            <div className="space-y-3">
              {activeRegs.map((reg, i) => {
                const offering = offerings.find(o => o.id === reg.offering_id);
                return (
                  <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                    <span className="text-xs font-mono text-muted-foreground w-20">Offering {reg.offering_id}</span>
                    <div className="flex-1">
                      {offering ? (
                        <>
                          <p className="font-medium text-sm">{offering.schedule}</p>
                          <p className="text-xs opacity-70">{offering.room}</p>
                        </>
                      ) : (
                        <p className="font-medium text-sm text-muted-foreground">Loading…</p>
                      )}
                    </div>
                    <StatusBadge variant="success">Active</StatusBadge>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Academic Info
            </h3>
            <button onClick={() => navigate("/student/grades")} className="text-xs text-primary hover:underline font-medium">View grades</button>
          </div>
          {profile ? (
            <div className="space-y-3">
              {[
                { label: "Student Code", value: profile.student_code },
                { label: "GPA", value: gpa },
                { label: "Semester", value: String(profile.current_semester) },
                { label: "Status", value: profile.status },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
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
