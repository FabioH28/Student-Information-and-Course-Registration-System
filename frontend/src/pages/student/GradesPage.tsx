import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { gradesApi, progressionApi, studentsApi } from "@/lib/api";

export default function GradesPage() {
  const { data: profile } = useQuery({
    queryKey: ["student-me"],
    queryFn: studentsApi.me,
  });

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades-me"],
    queryFn: gradesApi.my,
  });
  const { data: progression } = useQuery({
    queryKey: ["student-progression"],
    queryFn: progressionApi.me,
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

      {progression && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Academic Progress</h3>
              <p className="text-sm text-muted-foreground">{progression.degree_level} - {progression.current_academic_year}</p>
            </div>
            <StatusBadge variant={progression.graduation_eligible || progression.can_progress_to_next_year ? "success" : "warning"}>
              {progression.graduation_eligible ? "Graduation eligible" : progression.can_progress_to_next_year ? "Can progress" : "In progress"}
            </StatusBadge>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (progression.total_passed_credits / progression.graduation_required_credits) * 100)}%` }} />
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Passed credits</p><p className="font-medium">{progression.total_passed_credits}</p></div>
            <div><p className="text-xs text-muted-foreground">Next year requirement</p><p className="font-medium">{progression.required_for_next_year}</p></div>
            <div><p className="text-xs text-muted-foreground">Graduation requirement</p><p className="font-medium">{progression.graduation_required_credits}</p></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{progression.message}</p>
        </motion.div>
      )}

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
                  <p className="text-sm font-medium text-foreground">{g.course_code ? `${g.course_code} - ${g.course_name}` : `Registration #${g.registration_id}`}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    {g.midterm_score != null && <span>Midterm: {g.midterm_score}</span>}
                    {g.project_score != null && <span>Project /15: {g.project_score}</span>}
                    {g.quiz_score != null && <span>Quiz /10: {g.quiz_score}</span>}
                    {g.final_exam_score != null && <span>Final Exam /60: {g.final_exam_score}</span>}
                    {g.total_score != null && <span>Total: {g.total_score}</span>}
                    {g.pass_status && <span>{g.pass_status}</span>}
                  </div>
                  {g.feedback && <p className="mt-1 text-xs text-muted-foreground">Feedback: {g.feedback}</p>}
                  {g.exam_blocked_due_to_absence && (
                    <p className="mt-1 text-xs text-destructive">
                      Failed due to absences · Exam eligibility: Not eligible · Retake allowed next academic year
                    </p>
                  )}
                </div>
                {g.final_grade ? (
                  <StatusBadge variant={g.pass_status === "failed" ? "danger" : g.final_grade >= 8 ? "success" : "info"}>
                    {g.exam_blocked_due_to_absence ? "Failed: Absences over 15%" : `Grade ${g.final_grade}`}
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="warning">Pending</StatusBadge>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Albanian grade scale: 45-54 = 5, 55-64 = 6, 65-74 = 7, 75-84 = 8, 85-94 = 9, 95-100 = 10. Below 45 = 4 / failed.
      </div>
    </div>
  );
}
