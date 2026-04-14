import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp } from "lucide-react";

const semesters = [
  {
    name: "Spring 2026 (Current)",
    gpa: "3.80",
    courses: [
      { name: "Data Structures", code: "CS201", grade: "A", credits: 3 },
      { name: "Linear Algebra", code: "MATH301", grade: "A-", credits: 4 },
      { name: "AI Foundations", code: "CS250", grade: "In Progress", credits: 3 },
      { name: "Database Systems", code: "CS220", grade: "In Progress", credits: 3 },
      { name: "Technical Writing", code: "ENG101", grade: "In Progress", credits: 2 },
    ],
  },
  {
    name: "Fall 2025",
    gpa: "3.65",
    courses: [
      { name: "Web Development", code: "CS210", grade: "A-", credits: 3 },
      { name: "Statistics", code: "MATH201", grade: "B+", credits: 4 },
      { name: "Digital Logic", code: "CS150", grade: "A", credits: 3 },
      { name: "English II", code: "ENG100", grade: "B+", credits: 3 },
    ],
  },
];

export default function GradesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Academic Grades" description="Track your academic performance across semesters" />

      {/* GPA Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border p-5 shadow-card flex flex-col sm:flex-row gap-6">
        <div className="flex-1 text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Cumulative GPA</p>
          <p className="text-3xl font-bold text-primary">3.72</p>
          <p className="text-xs text-success flex items-center justify-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +0.05 from last semester</p>
        </div>
        <div className="flex-1 text-center p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Credits Completed</p>
          <p className="text-3xl font-bold text-foreground">78</p>
          <p className="text-xs text-muted-foreground mt-1">of 130 required</p>
        </div>
        <div className="flex-1 text-center p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Courses Passed</p>
          <p className="text-3xl font-bold text-foreground">24</p>
          <p className="text-xs text-muted-foreground mt-1">0 failed</p>
        </div>
      </motion.div>

      {/* Semester Cards */}
      {semesters.map((sem, si) => (
        <motion.div key={sem.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + si * 0.1 }}
          className="bg-card rounded-xl border shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">{sem.name}</h3>
            <StatusBadge variant="info">GPA: {sem.gpa}</StatusBadge>
          </div>
          <div className="divide-y divide-border">
            {sem.courses.map(c => (
              <div key={c.code} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code} • {c.credits} credits</p>
                </div>
                <StatusBadge variant={c.grade === "In Progress" ? "warning" : c.grade.startsWith("A") ? "success" : "info"}>
                  {c.grade}
                </StatusBadge>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
