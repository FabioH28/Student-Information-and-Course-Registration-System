import { motion } from "framer-motion";
import { BookOpen, FileText, GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { offeringsApi } from "@/lib/api";

function percent(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-purple-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ["teacher-my-courses"],
    queryFn: offeringsApi.teacherMyCourses,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Loading courses...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Timetable-based course offerings assigned to you" />

      {offerings.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">No course offerings assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offerings.map((offering, index) => {
            const completedWeeks = offering.completedWeeks ?? 0;
            const totalWeeks = offering.totalWeeks ?? 0;
            const weeksPct = offering.weekProgressPercentage ?? offering.weeksProgressPercentage ?? percent(completedWeeks, totalWeeks);
            const statusVariant = offering.status === "full" ? "warning" : offering.status === "cancelled" ? "danger" : "success";
            const details = [
              offering.faculty_name,
              offering.program_name,
              offering.academic_year,
              offering.group_name,
            ].filter(Boolean).join(" / ");

            return (
              <motion.article
                key={offering.course_offering_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => navigate(`/instructor/courses/${offering.course_offering_id}`)}
                className="cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground">{offering.course_name}</h3>
                          <StatusBadge variant={statusVariant}>{offering.status}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{offering.course_code} - {offering.credits ?? "-"} credits</p>
                        <p className="mt-1 text-xs text-muted-foreground">{details}</p>
                      </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <p><span className="font-medium text-foreground">Students:</span> {offering.student_count} / {offering.student_capacity}</p>
                    <p className="truncate" title={offering.room ?? "No room assigned"}><span className="font-medium text-foreground">Room:</span> {offering.room ?? "No room assigned"}</p>
                    <p><span className="font-medium text-foreground">Week progress:</span> {totalWeeks ? `${completedWeeks} / ${totalWeeks} weeks` : "No weeks scheduled"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium uppercase tracking-wide text-muted-foreground">Week progress</span>
                      <span className="text-muted-foreground">{weeksPct}%</span>
                    </div>
                    <ProgressBar value={weeksPct} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3" onClick={(event) => event.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/instructor/courses/${offering.course_offering_id}?tab=materials`)}>
                        <FileText className="mr-2 h-4 w-4" />Materials
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/instructor/courses/${offering.course_offering_id}?tab=attendance`)}>
                        <Users className="mr-2 h-4 w-4" />Attendance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/instructor/courses/${offering.course_offering_id}?tab=grades`)}>
                        <GraduationCap className="mr-2 h-4 w-4" />Grades
                      </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
