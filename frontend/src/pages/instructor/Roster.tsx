import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { offeringsApi, registrationsApi, studentsApi, coursesApi, CourseOut } from "@/lib/api";

export default function Roster() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: myOfferings = [] } = useQuery({
    queryKey: ["offerings-my"],
    queryFn: offeringsApi.my,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));

  const activeId = selectedOfferingId ?? myOfferings[0]?.id ?? null;

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-offering", activeId],
    queryFn: () => registrationsApi.list({ offering_id: activeId! }),
    enabled: activeId !== null,
  });

  const studentIds = registrations.filter(r => r.status === "active").map(r => r.student_id);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
    enabled: studentIds.length > 0,
  });

  const enrolledStudents = allStudents.filter(s => studentIds.includes(s.id));

  const filtered = enrolledStudents.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || s.student_code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Student Roster" description="Enrolled students across your course offerings">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{filtered.length} students</span>
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={activeId ?? ""}
          onChange={e => setSelectedOfferingId(Number(e.target.value))}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm"
        >
          {myOfferings.map(o => {
            const course = courseMap[o.course_id];
            return (
              <option key={o.id} value={o.id}>
                {course?.code ?? `Offering #${o.id}`} — {course?.name ?? "—"} ({o.schedule ?? "—"})
              </option>
            );
          })}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Code", "Semester", "GPA", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {myOfferings.length === 0 ? "No offerings assigned." : "No students enrolled."}
                  </td>
                </tr>
              ) : filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{s.student_code}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.current_semester}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(s.gpa).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={s.status === "active" ? "success" : s.status === "probation" ? "warning" : "danger"}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </StatusBadge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
