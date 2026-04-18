import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = ["CS201 — Data Structures", "CS201L — Data Structures Lab", "CS301 — Algorithms"];

const students = [
  { id: "STU-001", name: "Alex Johnson", email: "alex.j@university.edu", dept: "Computer Science", semester: 6, gpa: 3.72, attendance: "95%" },
  { id: "STU-002", name: "Sarah Kim", email: "sarah.k@university.edu", dept: "Computer Science", semester: 4, gpa: 3.45, attendance: "88%" },
  { id: "STU-003", name: "James Williams", email: "james.w@university.edu", dept: "Mathematics", semester: 5, gpa: 2.85, attendance: "72%" },
  { id: "STU-004", name: "Maria Garcia", email: "maria.g@university.edu", dept: "Information Systems", semester: 3, gpa: 3.90, attendance: "98%" },
  { id: "STU-005", name: "David Brown", email: "david.b@university.edu", dept: "Computer Science", semester: 7, gpa: 2.10, attendance: "61%" },
  { id: "STU-006", name: "Emma Davis", email: "emma.d@university.edu", dept: "Data Science", semester: 2, gpa: 3.55, attendance: "90%" },
];

export default function Roster() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [search, setSearch] = useState("");

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  const attendancePct = (a: string) => parseInt(a);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Roster" description="Enrolled students across your course offerings">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{filtered.length} students</span>
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm">
          {courses.map(c => <option key={c}>{c}</option>)}
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
                {["Student", "Department", "Sem", "GPA", "Attendance", "Standing"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => {
                const att = attendancePct(s.attendance);
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.dept}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.semester}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.gpa}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: s.attendance }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{s.attendance}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={s.gpa >= 3.0 && att >= 75 ? "success" : att < 75 ? "danger" : "warning"}>
                        {s.gpa >= 3.0 && att >= 75 ? "Good" : att < 75 ? "At Risk" : "Watch"}
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
