import { motion } from "framer-motion";
import { BookOpen, Users, CheckSquare, GraduationCap, Clock, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { offeringsApi, registrationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: myOfferings = [] } = useQuery({
    queryKey: ["offerings-my"],
    queryFn: offeringsApi.my,
  });

  const totalStudents = myOfferings.reduce((sum, o) => sum + o.enrolled, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Welcome, {user?.display_name ?? "Instructor"}</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2025 — You have {myOfferings.length} course{myOfferings.length !== 1 ? "s" : ""} this semester</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={myOfferings.length} subtitle="This semester" icon={BookOpen} variant="primary" delay={0.05} />
        <StatCard title="Total Students" value={totalStudents} subtitle="Across all courses" icon={Users} variant="info" delay={0.1} />
        <StatCard title="Active Offerings" value={myOfferings.filter(o => o.status === "active").length} icon={CheckSquare} variant="success" delay={0.15} />
        <StatCard title="Full Courses" value={myOfferings.filter(o => o.status === "full").length} subtitle="At capacity" icon={GraduationCap} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> My Course Offerings
            </h3>
            <button onClick={() => navigate("/instructor/courses")} className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          {myOfferings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offerings assigned.</p>
          ) : (
            <div className="space-y-3">
              {myOfferings.map((o, i) => (
                <div key={o.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{o.schedule ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.room ?? "—"} • {o.enrolled}/{o.capacity} students</p>
                  </div>
                  <button onClick={() => navigate("/instructor/attendance")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors">
                    Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" /> Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: "View Courses", path: "/instructor/courses" },
              { label: "Manage Grades", path: "/instructor/grades" },
              { label: "Mark Attendance", path: "/instructor/attendance" },
              { label: "View Roster", path: "/instructor/roster" },
            ].map(action => (
              <button key={action.path} onClick={() => navigate(action.path)}
                className="w-full text-left text-sm px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors font-medium text-foreground">
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
