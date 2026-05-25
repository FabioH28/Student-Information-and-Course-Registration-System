import { motion } from "framer-motion";
import { BookOpen, CalendarDays, FileText, GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { offeringsApi } from "@/lib/api";

export default function StudentMyCoursesPage() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-my-courses"],
    queryFn: offeringsApi.studentMyCourses,
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading courses...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Courses where you are enrolled" />
      {courses.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">You are not enrolled in any active courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course, index) => {
            const pct = Math.min(100, Math.round((course.student_count / course.student_capacity) * 100));
            return (
              <motion.article
                key={course.course_offering_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => navigate(`/student/courses/${course.course_offering_id}`)}
                className="cursor-pointer rounded-lg border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{course.course_name}</h3>
                        <StatusBadge variant="success">{course.status}</StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground">{course.course_code} - {course.credits ?? "-"} credits - {course.teacher_name ?? "Instructor"}</p>
                      <p className="text-xs text-muted-foreground">{course.faculty_name} - {course.degree_name} - {course.group_name}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <span className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />{course.schedule_summary}</span>
                    <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{course.student_count}/{course.student_capacity}</span>
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/student/courses/${course.course_offering_id}?tab=materials`)}><FileText className="mr-2 h-4 w-4" />Materials</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/student/courses/${course.course_offering_id}?tab=grades`)}><GraduationCap className="mr-2 h-4 w-4" />Grades</Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
