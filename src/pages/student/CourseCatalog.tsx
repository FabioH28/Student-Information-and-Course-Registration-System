import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, GraduationCap, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/formatters";

interface SelectedCourse {
  enrollment_id: number;
  offering_id: number;
  enrollment_status: string;
  code: string;
  title: string;
  description: string | null;
  credit_hours: number;
  ects_credits: number | string;
  section_code: string;
  delivery_mode: string;
  status: string;
  recommended_term_number: number | null;
  requirement_type: string | null;
  instructor_name: string | null;
  meeting_summary: string | null;
}

interface CurriculumCourse {
  course_id: number;
  code: string;
  title: string;
  description: string | null;
  credit_hours: number;
  ects_credits: number | string;
  course_type: string;
  recommended_term_number: number | null;
  requirement_type: string | null;
  prerequisite_codes: string | null;
  selected_offering_id: number | null;
  selected_enrollment_status: string | null;
  is_selected: boolean | number;
}

interface CourseCatalogResponse {
  student_id: number;
  program_name: string;
  current_semester: number;
  selected_courses: SelectedCourse[];
  curriculum: CurriculumCourse[];
}

function getStatusVariant(status: string | null | undefined) {
  if (status === "enrolled" || status === "completed") {
    return "success" as const;
  }

  if (status === "pending" || status === "waitlisted") {
    return "warning" as const;
  }

  return "default" as const;
}

export default function CourseCatalog() {
  const [search, setSearch] = useState("");
  const coursesQuery = useQuery({
    queryKey: ["student", "courses"],
    queryFn: () => apiGet<CourseCatalogResponse>("/students/me/courses"),
  });

  const filteredCurriculum = useMemo(() => {
    const items = coursesQuery.data?.curriculum ?? [];
    return items.filter((course) => {
      const query = search.toLowerCase();
      if (!query) {
        return true;
      }

      return course.title.toLowerCase().includes(query) || course.code.toLowerCase().includes(query);
    });
  }, [coursesQuery.data?.curriculum, search]);

  const groupedCurriculum = useMemo(() => {
    const groups = new Map<number, CurriculumCourse[]>();
    filteredCurriculum.forEach((course) => {
      const semester = course.recommended_term_number ?? 0;
      const existing = groups.get(semester) ?? [];
      existing.push(course);
      groups.set(semester, existing);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredCurriculum]);

  if (coursesQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (coursesQuery.isError) {
    return (
      <ErrorState
        description={coursesQuery.error instanceof Error ? coursesQuery.error.message : "Course data could not be loaded."}
        onRetry={() => void coursesQuery.refetch()}
      />
    );
  }

  const data = coursesQuery.data;
  if (!data) {
    return <EmptyState title="No course information yet" description="Your selected courses and curriculum plan will appear here once your student account is fully configured." />;
  }

  const selectedByCode = new Map(data.selected_courses.map((course) => [course.code, course]));
  const selectedCredits = data.selected_courses.reduce((sum, course) => sum + Number(course.credit_hours || 0), 0);
  const selectedEcts = data.selected_courses.reduce((sum, course) => sum + Number(course.ects_credits || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Review the courses you have already chosen and inspect the full curriculum path for your program" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Selected Courses</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  These are the courses currently attached to your live registration record for {data.program_name}.
                </p>
              </div>
              <StatusBadge variant="info">Semester {data.current_semester}</StatusBadge>
            </div>

            {data.selected_courses.length === 0 ? (
              <EmptyState title="No courses selected yet" description="Head to Registration to add current-term offerings from your curriculum." />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.selected_courses.map((course, index) => (
                  <motion.div
                    key={course.enrollment_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                          {course.code} · Section {course.section_code}
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-foreground">{course.title}</h4>
                      </div>
                      <StatusBadge variant={getStatusVariant(course.enrollment_status)}>{titleize(course.enrollment_status)}</StatusBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{course.credit_hours} credits</span>
                      <span>{Number(course.ects_credits || 0)} ECTS</span>
                      <span>{titleize(course.delivery_mode)}</span>
                      <span>{titleize(course.requirement_type ?? "core")}</span>
                    </div>

                    {course.description ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p> : null}

                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p>{course.instructor_name || "Instructor pending"}</p>
                      <p>{course.meeting_summary || "Meeting details will appear when scheduling is finalized."}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Curriculum Map</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any curriculum course to inspect its role in the program, credit load, and whether you have already selected it.
                </p>
              </div>
              <div className="relative max-w-md min-w-0 sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the curriculum..." className="pl-9" />
              </div>
            </div>

            {groupedCurriculum.length === 0 ? (
              <EmptyState title="No curriculum matches your search" description="Try another course code or title." />
            ) : (
              <div className="space-y-5">
                {groupedCurriculum.map(([semester, courses]) => (
                  <div key={semester} className="rounded-xl border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-foreground">Semester {semester || "-"}</h4>
                      <span className="text-xs text-muted-foreground">{courses.length} course{courses.length === 1 ? "" : "s"}</span>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      {courses.map((course) => {
                        const selectedCourse = selectedByCode.get(course.code);
                        const selected = Boolean(course.is_selected);
                        return (
                          <AccordionItem key={course.course_id} value={String(course.course_id)}>
                            <AccordionTrigger className="py-4 text-left hover:no-underline">
                              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-mono text-xs text-muted-foreground">{course.code}</p>
                                  <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <StatusBadge variant={course.requirement_type === "elective" ? "info" : "default"}>
                                    {titleize(course.requirement_type ?? "core")}
                                  </StatusBadge>
                                  {selected ? (
                                    <StatusBadge variant={getStatusVariant(course.selected_enrollment_status ?? "completed")}>
                                      {titleize(course.selected_enrollment_status ?? "completed")}
                                    </StatusBadge>
                                  ) : null}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              <div className="space-y-4 text-sm text-muted-foreground">
                                <div className="flex flex-wrap gap-3">
                                  <span>{course.credit_hours} credits</span>
                                  <span>{Number(course.ects_credits || 0)} ECTS</span>
                                  <span>{titleize(course.course_type)}</span>
                                  <span>Recommended semester {course.recommended_term_number ?? "-"}</span>
                                </div>

                                <p>{course.description || "No curriculum description has been stored for this course yet."}</p>

                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <p className="font-medium text-foreground">Curriculum details</p>
                                  <p className="mt-2">Prerequisites: {course.prerequisite_codes || "None recorded"}</p>
                                  <p className="mt-1">Selection status: {selected ? titleize(course.selected_enrollment_status ?? "completed") : "Not selected yet"}</p>
                                  {selectedCourse ? (
                                    <>
                                      <p className="mt-1">Current section: {selectedCourse.section_code}</p>
                                      <p className="mt-1">Delivery mode: {titleize(selectedCourse.delivery_mode)}</p>
                                      <p className="mt-1">Meeting pattern: {selectedCourse.meeting_summary || "Meeting details pending"}</p>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Program Snapshot</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program</span>
                <span className="max-w-[60%] text-right font-medium text-foreground">{data.program_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Semester</span>
                <span className="font-medium text-foreground">{data.current_semester}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chosen Courses</span>
                <span className="font-medium text-foreground">{data.selected_courses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Credits</span>
                <span className="font-medium text-foreground">{selectedCredits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current ECTS</span>
                <span className="font-medium text-foreground">{selectedEcts}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Courses page is now a planning view</p>
                <p className="text-xs text-muted-foreground">
                  Registration is where you add or drop offerings. This page is now focused on what you already chose and how it fits into the curriculum.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Curriculum Reading Tip</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Open any curriculum item to inspect prerequisites, see whether it is already selected, and compare it against your current semester path before making changes in Registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
