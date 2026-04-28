import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp, Users, BookOpen, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, coursesApi, registrationsApi, offeringsApi } from "@/lib/api";

export default function Analytics() {
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

  const avgGpa = students.length > 0
    ? (students.reduce((sum, s) => sum + Number(s.gpa), 0) / students.length).toFixed(2)
    : "—";

  const totalCapacity = offerings.reduce((sum, o) => sum + o.capacity, 0);
  const totalEnrolled = offerings.reduce((sum, o) => sum + o.enrolled, 0);
  const fillRate = totalCapacity > 0 ? `${Math.round((totalEnrolled / totalCapacity) * 100)}%` : "—";

  const atRiskCount = students.filter(s => Number(s.gpa) < 2.5 || s.status === "probation").length;
  const atRiskRate = students.length > 0 ? `${((atRiskCount / students.length) * 100).toFixed(1)}%` : "—";

  const activeRegs = registrations.filter(r => r.status === "active").length;
  const droppedRegs = registrations.filter(r => r.status === "dropped").length;
  const dropRate = registrations.length > 0 ? `${((droppedRegs / registrations.length) * 100).toFixed(1)}%` : "—";

  const metrics = [
    { title: "Avg GPA (University)", value: avgGpa, desc: "Across all students", icon: Users, color: "text-primary" },
    { title: "Course Fill Rate", value: fillRate, desc: "Spring 2025 — capacity utilization", icon: BookOpen, color: "text-info" },
    { title: "At-Risk Rate", value: atRiskRate, desc: "GPA < 2.5 or on probation", icon: AlertTriangle, color: "text-warning" },
    { title: "Drop Rate", value: dropRate, desc: "Registrations that were dropped", icon: TrendingUp, color: "text-destructive" },
  ];

  const statusGroups = [
    { label: "Active Students", count: students.filter(s => s.status === "active").length },
    { label: "On Probation", count: students.filter(s => s.status === "probation").length },
    { label: "Suspended", count: students.filter(s => s.status === "suspended").length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" description="Real-time academic insights from live data" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{m.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Registration Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Registrations", value: registrations.length },
              { label: "Active Registrations", value: activeRegs },
              { label: "Dropped", value: droppedRegs },
              { label: "Completed", value: registrations.filter(r => r.status === "completed").length },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground">{item.label}</p>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Student Status Breakdown</h3>
          <div className="space-y-3">
            {statusGroups.map(item => {
              const pct = students.length > 0 ? Math.round((item.count / students.length) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <span className="text-sm font-semibold text-foreground">{item.count} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Course Offerings — Enrollment Status (Spring 2025)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Schedule", "Enrolled", "Capacity", "Fill Rate", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {offerings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No offerings found.</td>
                </tr>
              ) : [...offerings].sort((a, b) => b.enrolled - a.enrolled).map(o => {
                const pct = o.capacity > 0 ? Math.round((o.enrolled / o.capacity) * 100) : 0;
                return (
                  <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.schedule ?? `Offering #${o.id}`}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{o.enrolled}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.capacity}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={pct >= 90 ? "text-destructive font-medium" : pct >= 70 ? "text-warning" : "text-success"}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{o.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
