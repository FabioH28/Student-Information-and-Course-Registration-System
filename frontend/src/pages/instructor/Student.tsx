import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Search, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { gradesApi, offeringsApi, registrationsApi, studentsApi } from "@/lib/api";

type FilterKey = "all" | "high_gpa" | "low_gpa" | "low_attendance" | "at_risk" | "active";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Students" },
  { key: "high_gpa", label: "High GPA" },
  { key: "low_gpa", label: "Low GPA" },
  { key: "low_attendance", label: "Low Attendance" },
  { key: "at_risk", label: "At Risk" },
  { key: "active", label: "Active Students" },
];

export default function Student() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: myOfferings = [] } = useQuery({
    queryKey: ["teacher-my-courses"],
    queryFn: async () => (await offeringsApi.teacherMyCourses()).map((offering) => ({ ...offering, id: offering.course_offering_id, schedule: offering.schedule_summary })),
  });

  const activeId = selectedOfferingId ?? myOfferings[0]?.course_offering_id ?? null;
  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations-offering", activeId],
    queryFn: () => registrationsApi.list({ offering_id: activeId! }),
    enabled: activeId !== null,
  });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades-offering", activeId],
    queryFn: () => gradesApi.forOffering(activeId!),
    enabled: activeId !== null,
  });

  const studentIds = registrations.filter((item) => item.status === "active").map((item) => item.student_id);
  const registrationByStudent = Object.fromEntries(registrations.map((item) => [item.student_id, item]));
  const gradeByRegistration = Object.fromEntries(grades.map((grade) => [grade.registration_id, grade]));
  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
    enabled: studentIds.length > 0,
  });

  const enrolledStudents = allStudents
    .filter((student) => studentIds.includes(student.id))
    .map((student) => {
      const registration = registrationByStudent[student.id];
      const grade = registration ? gradeByRegistration[registration.id] : null;
      const gpaNumber = Number(student.gpa ?? 0);
      const hasGradeData = Boolean(grade?.final_grade || grade?.total_score || grade?.pass_status);
      const attendance = registration?.attendance_percentage ?? null;
      const lowGpa = hasGradeData && gpaNumber < 3.0;
      const lowAttendance = attendance !== null && attendance < 75;
      const statusLabel = !hasGradeData && attendance === null
        ? "No Records"
        : lowGpa
          ? "At Risk"
          : lowAttendance
            ? "Low Attendance"
            : "Active";
      const statusVariant = statusLabel === "Active" ? "success" : statusLabel === "No Records" ? "info" : "warning";
      return { ...student, attendance, gpaNumber, hasGradeData, statusLabel, statusVariant };
    });

  const filtered = enrolledStudents.filter((student) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) || student.student_code.toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" ||
      (filter === "high_gpa" && student.gpaNumber >= 3.5) ||
      (filter === "low_gpa" && student.hasGradeData && student.gpaNumber < 3.0) ||
      (filter === "low_attendance" && student.statusLabel === "Low Attendance") ||
      (filter === "at_risk" && (student.statusLabel === "At Risk" || student.statusLabel === "Low Attendance")) ||
      (filter === "active" && student.statusLabel === "Active");
    return matchesSearch && matchesFilter;
  });

  const summary = useMemo(() => {
    const total = enrolledStudents.length;
    const active = enrolledStudents.filter((student) => student.statusLabel === "Active").length;
    const avgGpa = total ? enrolledStudents.reduce((sum, student) => sum + student.gpaNumber, 0) / total : 0;
    const attendanceValues = enrolledStudents.map((student) => student.attendance).filter((value): value is number => value !== null);
    const avgAttendance = attendanceValues.length ? attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length : 0;
    return { total, active, avgGpa, avgAttendance };
  }, [enrolledStudents]);

  function exportCsv() {
    const headers = ["Student name", "Student code", "Semester", "GPA", "Attendance", "Status"];
    const rows = filtered.map((student) => [
      `${student.first_name} ${student.last_name}`,
      student.student_code,
      String(student.current_semester),
      student.gpaNumber.toFixed(2),
      student.attendance === null ? "No records" : `${student.attendance.toFixed(0)}%`,
      student.statusLabel,
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const course = myOfferings.find((offering) => offering.course_offering_id === activeId);
    link.href = url;
    link.download = `${course?.course_code ?? "course"}-students.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage and review students enrolled in your selected course.">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}><Download className="mr-2 h-4 w-4" />Export</Button>
      </PageHeader>

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,24rem)_minmax(12rem,1fr)]">
          <select
            value={activeId ?? ""}
            onChange={(event) => setSelectedOfferingId(Number(event.target.value))}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {myOfferings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.course_code} - {offering.course_name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by student name or code" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Students", summary.total.toString()],
          ["Active Students", summary.active.toString()],
          ["Average GPA", summary.avgGpa.toFixed(2)],
          ["Average Attendance", `${summary.avgAttendance.toFixed(0)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${filter === item.key ? "border-purple-600 bg-purple-600 text-white" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{filtered.length} students shown</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student name", "Student code", "Semester", "GPA", "Attendance", "Status"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {myOfferings.length === 0 ? "No offerings assigned." : "No students match the selected filters."}
                  </td>
                </tr>
              ) : filtered.map((student, index) => (
                <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{student.first_name} {student.last_name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{student.student_code}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.current_semester}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{student.gpaNumber.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{student.attendance === null ? <span className="text-muted-foreground">No records</span> : `${student.attendance.toFixed(0)}%`}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={student.statusVariant}>{student.statusLabel}</StatusBadge>
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
