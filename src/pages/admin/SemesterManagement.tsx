import { motion } from "framer-motion";
import { Plus, Calendar, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

const semesters = [
  { name: "Spring 2026", status: "Active", start: "Jan 15, 2026", end: "May 30, 2026", regStart: "Dec 1, 2025", regEnd: "Jan 20, 2026", courses: 86, students: 1247 },
  { name: "Fall 2025", status: "Completed", start: "Aug 20, 2025", end: "Dec 15, 2025", regStart: "Jul 1, 2025", regEnd: "Aug 25, 2025", courses: 82, students: 1198 },
  { name: "Spring 2025", status: "Completed", start: "Jan 12, 2025", end: "May 28, 2025", regStart: "Dec 1, 2024", regEnd: "Jan 18, 2025", courses: 79, students: 1145 },
];

export default function SemesterManagement() {
  return (
    <div className="space-y-6">
      <PageHeader title="Semester Management" description="Manage academic semesters and registration periods">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> New Semester</Button>
      </PageHeader>

      <div className="space-y-4">
        {semesters.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{s.name}</h4>
                    <StatusBadge variant={s.status === "Active" ? "success" : "default"}>{s.status}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground mt-2">
                    <span>Start: {s.start}</span><span>End: {s.end}</span>
                    <span>Reg Start: {s.regStart}</span><span>Reg End: {s.regEnd}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{s.courses}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{s.students.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <Button variant="outline" size="sm"><Edit2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
