import { motion } from "framer-motion";
import {
  BookOpen, CalendarDays, FileText, GraduationCap, Users,
  Building2, Layers, ArrowRight,
} from "lucide-react";
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
      <PageHeader title="My Courses" description={`${courses.length} enrolled course${courses.length === 1 ? "" : "s"} this semester`} />
      {courses.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">You are not enrolled in any active courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course, index) => {
            const cap = course.student_capacity || 1;
            const pct = Math.min(100, Math.round((course.student_count / cap) * 100));
            return (
              <motion.article
                key={course.course_offering_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => navigate(`/student/courses/${course.course_offering_id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold leading-tight text-foreground">{course.course_name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono font-medium">{course.course_code}</span>
                        <span className="mx-1.5">·</span>
                        <span>{course.credits ?? "—"} credits</span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge variant="success">{course.status}</StatusBadge>
                </div>

                {/* Meta grid */}
                <div className="space-y-1.5 px-5 pb-3 text-xs text-muted-foreground">
                  <MetaRow icon={GraduationCap} text={course.teacher_name ?? "Instructor TBA"} />
                  <MetaRow icon={Building2} text={`${course.faculty_name} · ${course.degree_name}`} truncate />
                  <MetaRow icon={Layers} text={`Group ${course.group_name}`} />
                  <MetaRow icon={CalendarDays} text={course.schedule_summary} truncate />
                </div>

                {/* Capacity */}
                <div className="px-5 pb-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{course.student_count}</span> / {course.student_capacity}
                    </span>
                    <span className="text-muted-foreground">{pct}% full</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => navigate(`/student/courses/${course.course_offering_id}?tab=materials`)}>
                      <FileText className="mr-1.5 h-3.5 w-3.5" /> Materials
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => navigate(`/student/courses/${course.course_offering_id}?tab=grades`)}>
                      <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Grades
                    </Button>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon: Icon, text, truncate = false }: { icon: React.ElementType; text: string | null | undefined; truncate?: boolean }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
      <span className={truncate ? "truncate" : "min-w-0"}>{text}</span>
    </div>
  );
}
