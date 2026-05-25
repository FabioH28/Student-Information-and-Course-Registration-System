import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState, EmptyState } from "@/components/academic/AcademicShared";
import { staffApi } from "@/lib/api";

export default function StaffCourseOfferingsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["staff-course-offerings"], queryFn: staffApi.courseOfferings });

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Course Offerings" description="Offerings, capacity, and enrollment availability for your faculty" />
      {isLoading ? <LoadingState label="Loading offerings..." /> : data.length === 0 ? <EmptyState label="No course offerings found." /> : (
        <div className="grid gap-3">
          {data.map((offering) => (
            <article key={offering.id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{offering.course_code} — {offering.course_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{offering.program_name} · {offering.faculty_name} · {offering.academic_period} · {offering.academic_year}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Teacher: {offering.teacher_name} · Capacity: {offering.enrolled}/{offering.capacity}</p>
                </div>
                <StatusBadge variant={offering.status === "active" && offering.enrollment_open ? "success" : offering.status === "full" ? "warning" : "danger"}>
                  {offering.status === "active" && offering.enrollment_open ? "Enrollment open" : offering.status}
                </StatusBadge>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
