import { motion } from "framer-motion";
import { Users, BookOpen, CalendarDays, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, coursesApi, registrationsApi, offeringsApi } from "@/lib/api";

export default function AdminDashboard() {
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

  const activeRegs = registrations.filter(r => r.status === "active");
  const atRiskStudents = students.filter(s => s.status === "probation" || Number(s.gpa) < 2.5);
  const activeOfferings = offerings.filter(o => o.status === "active");

  const mostPopular = [...offerings]
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 4);

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  const riskLow = students.filter(s => Number(s.gpa) >= 3.0 && s.status === "active").length;
  const riskMed = students.filter(s => Number(s.gpa) >= 2.5 && Number(s.gpa) < 3.0).length;
  const riskHigh = students.filter(s => Number(s.gpa) < 2.5 || s.status === "probation").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Spring 2025 — System overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} variant="primary" delay={0.05} />
        <StatCard title="Courses" value={courses.length} icon={BookOpen} variant="info" delay={0.1} />
        <StatCard title="Active Registrations" value={activeRegs.length} icon={CalendarDays} variant="success" delay={0.15} />
        <StatCard title="At-Risk Students" value={atRiskStudents.length} subtitle="GPA < 2.5 or probation" icon={AlertTriangle} variant="warning" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Most Enrolled Offerings
          </h3>
          {mostPopular.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offerings found.</p>
          ) : (
            <div className="space-y-3">
              {mostPopular.map(o => {
                const course = courseMap[o.course_id];
                const pct = Math.round((o.enrolled / o.capacity) * 100);
                return (
                  <div key={o.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-foreground truncate">{course?.name ?? `Offering #${o.id}`}</p>
                      <p className="text-xs text-muted-foreground">{course?.code ?? ""} • {o.schedule ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-14 text-right">{o.enrolled}/{o.capacity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> System Summary
          </h3>
          <div className="space-y-3">
            {[
              { label: "Active Offerings (Spring 2025)", value: activeOfferings.length },
              { label: "Total Registrations", value: registrations.length },
              { label: "Dropped Registrations", value: registrations.filter(r => r.status === "dropped").length },
              { label: "Completed Registrations", value: registrations.filter(r => r.status === "completed").length },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground">{item.label}</p>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-card rounded-xl border p-5 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Student Risk Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { level: "Low Risk", count: riskLow, pct: students.length ? `${Math.round((riskLow / students.length) * 100)}%` : "—", variant: "success" as const },
            { level: "Medium Risk", count: riskMed, pct: students.length ? `${Math.round((riskMed / students.length) * 100)}%` : "—", variant: "warning" as const },
            { level: "High Risk", count: riskHigh, pct: students.length ? `${Math.round((riskHigh / students.length) * 100)}%` : "—", variant: "danger" as const },
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
