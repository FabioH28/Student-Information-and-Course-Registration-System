import { useQuery } from "@tanstack/react-query";

import { ErrorState, LoadingState } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { instructorApi } from "@/lib/api";

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function InstructorProfilePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["instructor-profile"], queryFn: instructorApi.profile });

  if (isLoading) return <LoadingState label="Loading profile..." />;
  if (error) return <ErrorState message={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your instructor account and teaching assignments" />

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{data.full_name}</h3>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
          <StatusBadge variant="info">{data.role || "Instructor"}</StatusBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Title" value={data.title} />
          <Info label="Faculty" value={data.faculty} />
          <Info label="Department" value={data.department} />
          <Info label="Phone" value={data.phone} />
          <Info label="Office / Room" value={data.office} />
          <Info label="Account Status" value={data.account_status} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Assigned Courses</h3>
        <div className="mt-4 space-y-3">
          {data.assigned_courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active course assignments found.</p>
          ) : data.assigned_courses.map((course) => (
            <article key={course.id} className="rounded-md border bg-background p-4">
              <p className="font-medium">{course.course_code} - {course.course_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[course.program, course.academic_year, course.semester, course.schedule, course.room].filter(Boolean).join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
