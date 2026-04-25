import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, CheckCircle2, Inbox, Users } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatTimeValue, titleize } from "@/lib/formatters";

interface TeacherDashboardResponse {
  teacher: {
    teacher_id: number;
    employee_number: string;
    title: string | null;
    office_location: string | null;
    employment_status: string;
    department_name: string;
  };
  summary: {
    assigned_courses: number;
    active_students: number;
    scheduled_meetings: number;
    published_final_grades: number;
    unread_notifications: number;
  };
  today_schedule: Array<{
    offering_id: number;
    code: string;
    title: string;
    section_code: string;
    start_time: string;
    end_time: string;
    room_name: string | null;
  }>;
  course_health: Array<{
    code: string;
    title: string;
    section_code: string;
    status: string;
    enrolled_count: number;
    capacity: number;
  }>;
}

function getCourseVariant(status: string) {
  if (status === "open" || status === "in_progress" || status === "completed") {
    return "success" as const;
  }

  if (status === "draft" || status === "closed") {
    return "warning" as const;
  }

  return "default" as const;
}

export default function TeacherDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ["instructor", "dashboard"],
    queryFn: () => apiGet<TeacherDashboardResponse>("/instructors/me/dashboard"),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        description={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Instructor dashboard could not be loaded."}
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  const data = dashboardQuery.data;
  if (!data) {
    return <EmptyState title="No instructor dashboard found" description="Instructor profile data is not available yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <p className="text-sm font-medium text-muted-foreground">{data.teacher.department_name}</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{data.teacher.title || "Faculty Member"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Employee ID {data.teacher.employee_number}
          {data.teacher.office_location ? ` - Office ${data.teacher.office_location}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Assigned Courses" value={data.summary.assigned_courses} icon={BookOpen} variant="primary" />
        <StatCard title="Active Students" value={data.summary.active_students} icon={Users} variant="info" />
        <StatCard title="Scheduled Meetings" value={data.summary.scheduled_meetings} icon={CalendarDays} variant="warning" />
        <StatCard title="Published Finals" value={data.summary.published_final_grades} icon={CheckCircle2} variant="success" />
        <StatCard title="Unread Inbox" value={data.summary.unread_notifications} icon={Inbox} variant="default" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
            <StatusBadge variant="default">{data.today_schedule.length} items</StatusBadge>
          </div>

          {data.today_schedule.length === 0 ? (
            <EmptyState
              title="No sessions today"
              description="Once meetings are assigned to your offerings, today's teaching schedule will appear here."
            />
          ) : (
            <div className="mt-4 space-y-3">
              {data.today_schedule.map((session) => (
                <div key={`${session.offering_id}-${session.start_time}`} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {session.code} - {session.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Section {session.section_code}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatTimeValue(session.start_time)} - {formatTimeValue(session.end_time)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{session.room_name || "Room to be assigned"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Course Health</h3>
            <StatusBadge variant="default">{data.course_health.length} tracked</StatusBadge>
          </div>

          {data.course_health.length === 0 ? (
            <EmptyState
              title="No assigned offerings"
              description="When the registrar assigns course offerings to this instructor, they will appear here automatically."
            />
          ) : (
            <div className="mt-4 space-y-3">
              {data.course_health.map((course) => (
                <div key={`${course.code}-${course.section_code}`} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {course.code} - {course.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Section {course.section_code}</p>
                    </div>
                    <StatusBadge variant={getCourseVariant(course.status)}>{titleize(course.status)}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {course.enrolled_count}/{course.capacity} students enrolled
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
