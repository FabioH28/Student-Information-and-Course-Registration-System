import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { registrationsApi, studentsApi, offeringsApi, coursesApi, CourseOut } from "@/lib/api";

export default function RegistrationsManagement() {
  const [search, setSearch] = useState("");

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["registrations-all"],
    queryFn: () => registrationsApi.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const offeringMap = Object.fromEntries(offerings.map(o => [o.id, o]));
  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));

  const filtered = registrations.filter(r => {
    const student = studentMap[r.student_id];
    const name = student ? `${student.first_name} ${student.last_name}` : "";
    const offering = offeringMap[r.offering_id];
    const course = offering ? courseMap[offering.course_id] : null;
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q) || course?.code.toLowerCase().includes(q);
  });

  const counts = {
    active: registrations.filter(r => r.status === "active").length,
    dropped: registrations.filter(r => r.status === "dropped").length,
    completed: registrations.filter(r => r.status === "completed").length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading registrations…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Registrations" description="View student course registrations" />

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.active}</p>
          <StatusBadge variant="success" className="mt-1">Active</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.dropped}</p>
          <StatusBadge variant="danger" className="mt-1">Dropped</StatusBadge>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.completed}</p>
          <StatusBadge variant="info" className="mt-1">Completed</StatusBadge>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student or course..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Course", "Registered At", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r, i) => {
                const student = studentMap[r.student_id];
                const offering = offeringMap[r.offering_id];
                const course = offering ? courseMap[offering.course_id] : null;
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {student ? `${student.first_name} ${student.last_name}` : `Student #${r.student_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{course?.name ?? `Offering #${r.offering_id}`}</p>
                      <p className="text-xs text-muted-foreground">{course?.code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.registered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={r.status === "active" ? "success" : r.status === "dropped" ? "danger" : "info"}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </StatusBadge>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No registrations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
