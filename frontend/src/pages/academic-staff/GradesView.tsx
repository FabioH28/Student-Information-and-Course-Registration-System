import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import { gradesApi, offeringsApi, registrationsApi, studentsApi, coursesApi, CourseOut } from "@/lib/api";

function gradeVariant(grade: string | null) {
  if (!grade) return "warning" as const;
  if (grade === "F") return "danger" as const;
  if (grade.startsWith("A")) return "success" as const;
  if (grade.startsWith("B")) return "info" as const;
  return "warning" as const;
}

export default function GradesView() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", 2],
    queryFn: () => offeringsApi.list({ semester_id: 2 }),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-all"],
    queryFn: () => registrationsApi.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const firstOfferingId = offerings[0]?.id ?? null;
  const activeOfferingId = selectedOfferingId === "all" ? firstOfferingId : selectedOfferingId;

  const { data: grades = [] } = useQuery({
    queryKey: ["grades-offering", activeOfferingId],
    queryFn: () => gradesApi.forOffering(activeOfferingId!),
    enabled: activeOfferingId !== null,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));
  const registrationMap = Object.fromEntries(registrations.map(r => [r.id, r]));
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const offeringMap = Object.fromEntries(offerings.map(o => [o.id, o]));

  const rows = grades.map(g => {
    const reg = registrationMap[g.registration_id];
    const student = reg ? studentMap[reg.student_id] : null;
    const offering = reg ? offeringMap[reg.offering_id] : null;
    const course = offering ? courseMap[offering.course_id] : null;
    return { g, student, course, offering };
  });

  const filtered = rows.filter(({ student, course }) => {
    if (!search) return true;
    const name = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : "";
    const courseName = course?.name?.toLowerCase() ?? "";
    return name.includes(search.toLowerCase()) || courseName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Grades Overview" description="View all student grades across courses" />

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={activeOfferingId ?? ""}
          onChange={e => setSelectedOfferingId(Number(e.target.value))}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm"
        >
          {offerings.map(o => {
            const course = courseMap[o.course_id];
            return (
              <option key={o.id} value={o.id}>
                {course?.code ?? `#${o.id}`} — {course?.name ?? "—"} ({o.schedule ?? "—"})
              </option>
            );
          })}
        </select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student or course..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Course", "Midterm", "Assignment", "Final", "Total", "Grade", "Published"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {offerings.length === 0 ? "No offerings found." : "No grades recorded for this offering."}
                  </td>
                </tr>
              ) : filtered.map(({ g, student, course }, i) => (
                <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {student ? `${student.first_name} ${student.last_name}` : `Reg #${g.registration_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{course?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{course?.code ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.midterm_score ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.assignment_score ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.final_score ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{g.total_score ?? "—"}</td>
                  <td className="px-4 py-3">
                    {g.letter_grade ? (
                      <StatusBadge variant={gradeVariant(g.letter_grade)}>{g.letter_grade}</StatusBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={g.is_published ? "success" : "warning"}>
                      {g.is_published ? "Published" : "Draft"}
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
