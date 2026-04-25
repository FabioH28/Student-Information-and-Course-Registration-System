import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, titleize } from "@/lib/formatters";

interface StudentProfileResponse {
  cumulative_gpa: number;
  earned_credits: number;
}

interface StudentGradesResponse {
  student_id: number;
  final_grades: Array<{
    code: string;
    title: string;
    numeric_grade: number | null;
    letter_grade: string;
    grade_points: number | null;
    status: string;
    published_at: string | null;
  }>;
  grade_components: Array<{
    code: string;
    title: string;
    component_name: string;
    component_type: string;
    max_points: number;
    score_awarded: number | null;
    percentage: number | null;
    letter_grade: string | null;
    published_at: string | null;
  }>;
}

function getGradeVariant(grade: string | null) {
  if (!grade) {
    return "default" as const;
  }

  if (grade.startsWith("A")) {
    return "success" as const;
  }

  if (grade.startsWith("B")) {
    return "info" as const;
  }

  if (grade.startsWith("C")) {
    return "warning" as const;
  }

  return "danger" as const;
}

export default function GradesPage() {
  const profileQuery = useQuery({
    queryKey: ["student", "profile", "grades-summary"],
    queryFn: () => apiGet<StudentProfileResponse>("/students/me/profile"),
  });
  const gradesQuery = useQuery({
    queryKey: ["student", "grades"],
    queryFn: () => apiGet<StudentGradesResponse>("/students/me/grades"),
  });

  if (profileQuery.isLoading || gradesQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (profileQuery.isError || gradesQuery.isError) {
    const error = profileQuery.error ?? gradesQuery.error;
    return (
      <ErrorState
        description={error instanceof Error ? error.message : "Grade data could not be loaded."}
        onRetry={() => {
          void profileQuery.refetch();
          void gradesQuery.refetch();
        }}
      />
    );
  }

  const profile = profileQuery.data;
  const grades = gradesQuery.data;
  if (!profile || !grades) {
    return <EmptyState title="No grade data yet" description="Published assessments and final grades will appear here once they are available." />;
  }

  const passedCourses = grades.final_grades.filter((item) => item.letter_grade && !["F", "W"].includes(item.letter_grade)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Grades" description="Track your academic performance across final grades and published assessments" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 rounded-xl border bg-card p-5 shadow-card sm:flex-row"
      >
        <div className="flex-1 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Cumulative GPA</p>
          <p className="text-3xl font-bold text-primary">{Number(profile.cumulative_gpa || 0).toFixed(2)}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-success">
            <TrendingUp className="h-3 w-3" /> Live from your student profile
          </p>
        </div>

        <div className="flex-1 rounded-lg bg-muted/50 p-4 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Credits Completed</p>
          <p className="text-3xl font-bold text-foreground">{profile.earned_credits}</p>
          <p className="mt-1 text-xs text-muted-foreground">Current recorded credits</p>
        </div>

        <div className="flex-1 rounded-lg bg-muted/50 p-4 text-center">
          <p className="mb-1 text-xs text-muted-foreground">Courses Passed</p>
          <p className="text-3xl font-bold text-foreground">{passedCourses}</p>
          <p className="mt-1 text-xs text-muted-foreground">Across final grade records</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-xl border bg-card shadow-card"
      >
        <div className="flex flex-col gap-2 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-foreground">Final Grades</h3>
          <StatusBadge variant="info">{grades.final_grades.length} records</StatusBadge>
        </div>

        {grades.final_grades.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No final grades published" description="Final grades will show here once they are published to your transcript." />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grades.final_grades.map((course) => (
              <div key={`${course.code}-${course.published_at}`} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.code} - {course.numeric_grade !== null ? `${course.numeric_grade}%` : "Score pending"} - {formatDate(course.published_at, "Pending publication")}
                  </p>
                </div>

                <StatusBadge variant={getGradeVariant(course.letter_grade)}>{course.letter_grade}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-xl border bg-card shadow-card"
      >
        <div className="flex flex-col gap-2 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-foreground">Recent Grade Components</h3>
          <StatusBadge variant="default">{grades.grade_components.length} assessments</StatusBadge>
        </div>

        {grades.grade_components.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No component grades published" description="Assessment-level grades will appear here once faculty publish them." />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grades.grade_components.map((item) => (
              <div key={`${item.code}-${item.component_name}-${item.published_at}`} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.component_name} - {titleize(item.component_type)} - {item.score_awarded ?? "-"} / {item.max_points}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.letter_grade && <StatusBadge variant={getGradeVariant(item.letter_grade)}>{item.letter_grade}</StatusBadge>}
                  <span className="text-xs text-muted-foreground">{item.percentage !== null ? `${item.percentage}%` : "Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
