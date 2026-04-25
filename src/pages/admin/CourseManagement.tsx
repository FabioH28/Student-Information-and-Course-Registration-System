import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Edit2, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { CourseOfferingDialog, type AdminCourseItem } from "@/components/admin/CourseOfferingDialog";
import { type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDateTime, formatTimeValue, titleize } from "@/lib/formatters";

interface AdminCoursesResponse {
  items: AdminCourseItem[];
}

function getCourseVariant(status: string) {
  if (status === "open" || status === "completed") {
    return "success" as const;
  }

  if (status === "draft" || status === "in_progress") {
    return "warning" as const;
  }

  return "info" as const;
}

export default function CourseManagement() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<AdminCourseItem | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["academic", "courses"],
    queryFn: () => apiGet<AdminCoursesResponse>("/academic/courses"),
  });

  const referenceDataQuery = useQuery({
    queryKey: ["academic", "reference-data"],
    queryFn: () => apiGet<AdminReferenceData>("/academic/reference-data"),
  });

  const filtered = useMemo(
    () =>
      (coursesQuery.data?.items ?? []).filter((course) =>
        `${course.title} ${course.code} ${course.section_code} ${course.term_name} ${course.instructor_name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [coursesQuery.data?.items, search],
  );

  if (coursesQuery.isLoading || referenceDataQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (coursesQuery.isError) {
    return (
      <ErrorState
        description={coursesQuery.error instanceof Error ? coursesQuery.error.message : "Course data could not be loaded."}
        onRetry={() => void coursesQuery.refetch()}
      />
    );
  }

  if (referenceDataQuery.isError || !referenceDataQuery.data) {
    return (
      <ErrorState
        description={
          referenceDataQuery.error instanceof Error
            ? referenceDataQuery.error.message
            : "Academic reference data could not be loaded."
        }
        onRetry={() => void referenceDataQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Course Catalog & Offerings" description="Manage course offerings, instructor assignments, registration windows, and the primary teaching schedule">
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => {
            setSelectedOffering(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Offering
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search courses, terms, sections..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No course offerings found" description="Create the first offering to populate instructor and student workflows." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course, index) => (
            <motion.div
              key={course.offering_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getCourseVariant(course.status)}>{titleize(course.status)}</StatusBadge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOffering(course);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>

              <p className="font-mono text-xs text-muted-foreground">
                {course.code} - Section {course.section_code}
              </p>
              <h4 className="mt-1 font-semibold text-foreground">{course.title}</h4>
              <p className="mt-2 text-xs text-muted-foreground">
                {course.instructor_name || "Instructor pending"} - {course.credit_hours} credits
              </p>
              <p className="text-xs text-muted-foreground">{course.term_name}</p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Enrollment</p>
                  <p className="mt-2 text-foreground">
                    {course.enrolled_count}/{course.capacity}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Delivery</p>
                  <p className="mt-2 text-foreground">{titleize(course.delivery_mode)}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Registration Window</p>
                <p className="mt-2 text-sm text-foreground">
                  {course.registration_opens_at ? formatDateTime(course.registration_opens_at) : "Not scheduled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {course.registration_closes_at ? `to ${formatDateTime(course.registration_closes_at)}` : "Add dates in Edit to open registration."}
                </p>
              </div>

              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary Meeting</p>
                <p className="mt-2 text-sm text-foreground">
                  {course.meeting_day_of_week
                    ? `${titleize(course.meeting_day_of_week)} · ${formatTimeValue(course.meeting_start_time)} - ${formatTimeValue(course.meeting_end_time)}`
                    : "Schedule pending"}
                </p>
                <p className="text-sm text-muted-foreground">{course.meeting_summary || course.schedule_notes || "No meeting notes yet."}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CourseOfferingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        referenceData={referenceDataQuery.data}
        offering={selectedOffering}
      />
    </div>
  );
}
