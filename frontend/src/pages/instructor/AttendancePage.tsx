import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Search, Check, X, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const courses = ["CS201 — Data Structures", "CS201L — Data Structures Lab", "CS301 — Algorithms"];

const students = [
  { id: "STU-001", name: "Alex Johnson" },
  { id: "STU-002", name: "Sarah Kim" },
  { id: "STU-003", name: "James Williams" },
  { id: "STU-004", name: "Maria Garcia" },
  { id: "STU-005", name: "David Brown" },
  { id: "STU-006", name: "Emma Davis" },
  { id: "STU-007", name: "Chris Lee" },
  { id: "STU-008", name: "Anna White" },
];

type AttendanceStatus = "present" | "absent" | "late" | null;

export default function AttendancePage() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const mark = (id: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  const summary = {
    present: Object.values(attendance).filter(v => v === "present").length,
    absent: Object.values(attendance).filter(v => v === "absent").length,
    late: Object.values(attendance).filter(v => v === "late").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Mark attendance for today's sessions">
        <Button onClick={handleSave} size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          {saved ? "Saved!" : "Save Attendance"}
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSaved(false); }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground flex-1 max-w-sm">
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Present", count: summary.present, variant: "success" as const },
          { label: "Absent", count: summary.absent, variant: "danger" as const },
          { label: "Late", count: summary.late, variant: "warning" as const },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{s.count}</p>
            <StatusBadge variant={s.variant} className="mt-1">{s.label}</StatusBadge>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "ID", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => {
                const status = attendance[s.id] ?? null;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-3">
                      {status ? (
                        <StatusBadge variant={status === "present" ? "success" : status === "absent" ? "danger" : "warning"}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not marked</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => mark(s.id, "present")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "present" ? "bg-success/20 text-success" : "hover:bg-muted text-muted-foreground"}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => mark(s.id, "absent")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "absent" ? "bg-destructive/20 text-destructive" : "hover:bg-muted text-muted-foreground"}`}>
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => mark(s.id, "late")}
                          className={`p-1.5 rounded-lg transition-colors ${status === "late" ? "bg-warning/20 text-warning" : "hover:bg-muted text-muted-foreground"}`}>
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
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
