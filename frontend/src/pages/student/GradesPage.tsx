import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { gradesApi, studentsApi } from "@/lib/api";

export default function GradesPage() {
  const { data: profile } = useQuery({
    queryKey: ["student-me"],
    queryFn: studentsApi.me,
  });

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades-me"],
    queryFn: gradesApi.my,
  });

  const gpa = profile ? Number(profile.gpa).toFixed(2) : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Grades" description="Track your academic performance" />

      {/* GPA Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border p-5 shadow-card flex flex-col sm:flex-row gap-6">
        <div className="flex-1 text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Cumulative GPA</p>
          <p className="text-3xl font-bold text-primary">{gpa}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Based on registered courses
          </p>
        </div>
        <div className="flex-1 text-center p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Semester</p>
          <p className="text-3xl font-bold text-foreground">{profile?.current_semester ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Current semester</p>
        </div>
        <div className="flex-1 text-center p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Published Grades</p>
          <p className="text-3xl font-bold text-foreground">{grades.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Available to view</p>
        </div>
      </motion.div>

      {/* Grades List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading grades…</p>
      ) : grades.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-10 shadow-card text-center">
          <p className="text-muted-foreground">No published grades yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Grades will appear here once your instructor publishes them.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">Published Grades</h3>
          </div>
          <div className="divide-y divide-border">
            {grades.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Registration #{g.registration_id}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    {g.midterm_score != null && <span>Midterm: {g.midterm_score}</span>}
                    {g.assignment_score != null && <span>Assignment: {g.assignment_score}</span>}
                    {g.final_score != null && <span>Final: {g.final_score}</span>}
                    {g.total_score != null && <span>Total: {g.total_score}</span>}
                  </div>
                </div>
                {g.letter_grade ? (
                  <StatusBadge variant={g.letter_grade.startsWith("A") ? "success" : g.letter_grade.startsWith("B") ? "info" : g.letter_grade.startsWith("C") ? "warning" : "danger"}>
                    {g.letter_grade}
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="warning">Pending</StatusBadge>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
