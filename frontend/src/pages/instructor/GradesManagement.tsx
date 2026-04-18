import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = ["CS201 — Data Structures", "CS301 — Algorithms"];

const students = [
  { id: "STU-001", name: "Alex Johnson", midterm: 88, assignment: 92, final: null },
  { id: "STU-002", name: "Sarah Kim", midterm: 76, assignment: 85, final: null },
  { id: "STU-003", name: "James Williams", midterm: 65, assignment: 70, final: null },
  { id: "STU-004", name: "Maria Garcia", midterm: 95, assignment: 98, final: null },
  { id: "STU-005", name: "David Brown", midterm: 52, assignment: 60, final: null },
  { id: "STU-006", name: "Emma Davis", midterm: 81, assignment: 88, final: null },
];

const letterGrade = (score: number) => {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 70) return "C";
  return "F";
};

export default function GradesManagement() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [search, setSearch] = useState("");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const average = (s: typeof students[0]) => Math.round((s.midterm * 0.4 + s.assignment * 0.3 + (grades[s.id] ? Number(grades[s.id]) : 0) * 0.3));

  return (
    <div className="space-y-6">
      <PageHeader title="Grades Management" description="Enter and publish student grades">
        <Button onClick={() => setSaved(true)} size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          <Save className="w-4 h-4 mr-2" />{saved ? "Saved!" : "Publish Grades"}
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSaved(false); }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground max-w-sm">
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-card text-xs text-muted-foreground flex gap-6">
        <span>Midterm: <strong className="text-foreground">40%</strong></span>
        <span>Assignments: <strong className="text-foreground">30%</strong></span>
        <span>Final Exam: <strong className="text-foreground">30%</strong></span>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Midterm (40%)", "Assignments (30%)", "Final Exam (30%)", "Average", "Grade"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => {
                const finalScore = grades[s.id] ? Number(grades[s.id]) : null;
                const avg = finalScore !== null ? average(s) : null;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{s.midterm}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{s.assignment}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number" min={0} max={100} placeholder="0–100"
                        value={grades[s.id] ?? ""}
                        onChange={e => { setGrades(prev => ({ ...prev, [s.id]: e.target.value })); setSaved(false); }}
                        className="w-20 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {avg !== null ? avg : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {avg !== null ? (
                        <StatusBadge variant={avg >= 80 ? "success" : avg >= 70 ? "warning" : "danger"}>
                          {letterGrade(avg)}
                        </StatusBadge>
                      ) : <span className="text-xs text-muted-foreground">Pending</span>}
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
