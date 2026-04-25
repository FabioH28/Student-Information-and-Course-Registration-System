import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/formatters";

interface TeacherCoursesResponse {
  items: Array<{
    offering_id: number;
    code: string;
    title: string;
    credit_hours: number;
    term_name: string;
    section_code: string;
    delivery_mode: string;
    capacity: number;
    status: string;
    enrolled_count: number;
    meeting_summary: string | null;
  }>;
}

function getVariant(status: string) {
  if (status === "open" || status === "in_progress" || status === "completed") {
    return "success" as const;
  }

  if (status === "draft" || status === "closed") {
    return "warning" as const;
  }

  return "default" as const;
}

export default function TeacherCourses() {
  const [search, setSearch] = useState("");
  const coursesQuery = useQuery({
    queryKey: ["instructor", "courses"],
    queryFn: () => apiGet<TeacherCoursesResponse>("/instructors/me/courses"),
  });

  const filtered = useMemo(
    () =>
      (coursesQuery.data?.items ?? []).filter((course) =>
        `${course.code} ${course.title} ${course.section_code} ${course.term_name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [coursesQuery.data?.items, search],
  );

  if (coursesQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (coursesQuery.isError) {
    return (
      <ErrorState
        description={coursesQuery.error instanceof Error ? coursesQuery.error.message : "Assigned courses could not be loaded."}
        onRetry={() => void coursesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assigned Courses" description="Every offering already linked to this instructor account appears here." />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assigned courses..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No assigned courses" description="Once offerings are assigned by the academic team, they will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((course) => (
            <div key={course.offering_id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {course.code} - Section {course.section_code}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{course.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge variant={getVariant(course.status)}>{titleize(course.status)}</StatusBadge>
                  <StatusBadge variant="default">{titleize(course.delivery_mode)}</StatusBadge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Term</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{course.term_name}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Enrollment</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {course.enrolled_count}/{course.capacity}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                <p className="mt-2 text-sm text-foreground">{course.meeting_summary || "Meetings still need to be scheduled."}</p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{course.credit_hours} credit hours</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
