import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const grades = [
  { student: "Alex Johnson", id: "STU-001", course: "Data Structures", code: "CS201", instructor: "Dr. Smith", grade: "A", gpa: 4.0, semester: "Spring 2026" },
  { student: "Sarah Kim", id: "STU-002", course: "Data Structures", code: "CS201", instructor: "Dr. Smith", grade: "B+", gpa: 3.3, semester: "Spring 2026" },
  { student: "James Williams", id: "STU-003", course: "Algorithms", code: "CS301", instructor: "Dr. Smith", grade: "C+", gpa: 2.3, semester: "Spring 2026" },
  { student: "Maria Garcia", id: "STU-004", course: "Database Systems", code: "CS220", instructor: "Dr. Johnson", grade: "A", gpa: 4.0, semester: "Spring 2026" },
  { student: "David Brown", id: "STU-005", course: "AI Foundations", code: "CS250", instructor: "Dr. Lee", grade: "F", gpa: 0.0, semester: "Spring 2026" },
  { student: "Emma Davis", id: "STU-006", course: "Linear Algebra", code: "MATH301", instructor: "Prof. Adams", grade: "A-", gpa: 3.7, semester: "Spring 2026" },
];

export default function GradesView() {
  const [search, setSearch] = useState("");
  const filtered = grades.filter(g =>
    g.student.toLowerCase().includes(search.toLowerCase()) || g.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Grades Overview" description="View all student grades across courses" />

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
                {["Student", "Course", "Instructor", "Semester", "Grade", "GPA Points"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((g, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{g.student}</p>
                    <p className="text-xs text-muted-foreground">{g.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{g.course}</p>
                    <p className="text-xs text-muted-foreground">{g.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.instructor}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{g.semester}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={g.grade === "F" ? "danger" : g.grade.startsWith("A") ? "success" : g.grade.startsWith("B") ? "info" : "warning"}>
                      {g.grade}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{g.gpa.toFixed(1)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
