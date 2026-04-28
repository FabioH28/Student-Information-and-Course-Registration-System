import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { BookOpen, Users, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { registrationsApi, studentsApi, offeringsApi, coursesApi, CourseOut } from "@/lib/api";

export default function RegistrationOverview() {
  const [search, setSearch] = useState("");

  const { data: registrations = [] } = useQuery({
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

  const uniqueStudentIds = new Set(registrations.map(r => r.student_id));
  const avgCourses = uniqueStudentIds.size > 0
    ? (registrations.filter(r => r.status === "active").length / uniqueStudentIds.size).toFixed(1)
    : "0";

  const filtered = registrations.filter(r => {
    if (!search) return true;
    const student = studentMap[r.student_id];
    const name = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : "";
    const code = student?.student_code?.toLowerCase() ?? "";
    const offering = offeringMap[r.offering_id];
    const course = offering ? courseMap[offering.course_id] : null;
    const courseName = course?.name?.toLowerCase() ?? "";
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase()) || courseName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Registration Overview" description="Track and manage all student registrations" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Registrations" value={registrations.length} icon={BookOpen} variant="primary" />
        <StatCard title="Unique Students" value={uniqueStudentIds.size} icon={Users} variant="info" />
        <StatCard title="Avg Active/Student" value={avgCourses} icon={CalendarDays} variant="success" />
      </div>

      <div className="flex gap-2">
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
                {["Student", "Course", "Offering", "Date", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No registrations found.</td>
                </tr>
              ) : filtered.map((r, i) => {
                const student = studentMap[r.student_id];
                const offering = offeringMap[r.offering_id];
                const course = offering ? courseMap[offering.course_id] : null;
                const name = student ? `${student.first_name} ${student.last_name}` : `Student #${r.student_id}`;
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{course?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{course?.code ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{offering?.schedule ?? `#${r.offering_id}`}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(r.registered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={r.status === "active" ? "success" : r.status === "dropped" ? "danger" : "warning"}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </StatusBadge>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
