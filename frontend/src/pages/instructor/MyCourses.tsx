import { motion } from "framer-motion";
import { BookOpen, Users, CalendarDays } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { offeringsApi, coursesApi, CourseOut } from "@/lib/api";

export default function MyCourses() {
  const navigate = useNavigate();

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ["offerings-my"],
    queryFn: offeringsApi.my,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.list,
  });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading courses…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Course offerings assigned to you this semester" />

      {offerings.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center shadow-card">
          <p className="text-muted-foreground">No course offerings assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offerings.map((o, i) => {
            const course = courseMap[o.course_id];
            const pct = Math.round((o.enrolled / o.capacity) * 100);
            const statusLabel = o.status === "full" ? "Full" : o.status === "cancelled" ? "Cancelled" : "Active";
            const statusVariant = o.status === "full" ? "warning" : o.status === "cancelled" ? "danger" : "success";

            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{course?.name ?? `Course #${o.course_id}`}</h3>
                        <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground">{course?.code ?? "—"} • {course?.credits ?? "?"} credits</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 sm:gap-8 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{o.schedule ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{o.enrolled}/{o.capacity} students</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate("/instructor/attendance")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors">
                        Attendance
                      </button>
                      <button onClick={() => navigate("/instructor/grades")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-medium transition-colors">
                        Grades
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Enrollment</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
