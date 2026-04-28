import { motion } from "framer-motion";
import { BookOpen, Users, ClipboardList, GraduationCap, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, coursesApi, registrationsApi, offeringsApi } from "@/lib/api";

export default function AcademicDashboard() {
  const navigate = useNavigate();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-all"],
    queryFn: () => registrationsApi.list(),
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const activeRegistrations = registrations.filter(r => r.status === "active");
  const avgGpa = students.length > 0
    ? (students.reduce((sum, s) => sum + Number(s.gpa), 0) / students.length).toFixed(2)
    : "—";

  const recentRegs = [...registrations]
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
    .slice(0, 5);

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const probationStudents = students.filter(s => s.status === "probation").length;
  const activeOfferings = offerings.filter(o => o.status === "active").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Academic Staff Dashboard</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2025 — Academic operations overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} variant="primary" delay={0.05} />
        <StatCard title="Active Courses" value={activeOfferings} icon={BookOpen} variant="info" delay={0.1} />
        <StatCard title="Active Registrations" value={activeRegistrations.length} icon={ClipboardList} variant="success" delay={0.15} />
        <StatCard title="Avg GPA" value={avgGpa} icon={GraduationCap} variant="warning" delay={0.2} />
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
          {recentRegs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRegs.map((r) => {
                const student = studentMap[r.student_id];
                const name = student ? `${student.first_name} ${student.last_name}` : `Student #${r.student_id}`;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">Offering #{r.offering_id}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Student Status</h3>
          <div className="space-y-3">
            {[
              { label: "Active Students", count: students.filter(s => s.status === "active").length, variant: "success" as const },
              { label: "On Probation", count: probationStudents, variant: "warning" as const },
              { label: "Suspended", count: students.filter(s => s.status === "suspended").length, variant: "danger" as const },
              { label: "Total Courses", count: courses.length, variant: "info" as const },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground">{item.label}</p>
                <StatusBadge variant={item.variant}>{item.count}</StatusBadge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
