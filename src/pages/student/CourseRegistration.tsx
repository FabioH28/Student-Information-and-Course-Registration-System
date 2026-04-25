import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Filter, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { titleize } from "@/lib/formatters";

interface RegistrationCourse {
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
  recommended_term_number: number | null;
  requirement_type: string | null;
  instructor_name: string | null;
  meeting_summary: string | null;
}

interface SuggestedCourse {
  id: number;
  offering_id: number | null;
  code: string;
  title: string;
  description: string | null;
  credit_hours: number;
  ects_credits: number | string;
  reason: string;
  priority: number;
  priority_label: "high" | "medium" | "low";
  status: string;
}

interface AvailableCourse {
  offering_id: number;
  course_id: number;
  code: string;
  title: string;
  description: string | null;
  credit_hours: number;
  ects_credits: number | string;
  section_code: string;
  delivery_mode: string;
  capacity: number;
  status: string;
  recommended_term_number: number | null;
  requirement_type: string | null;
  instructor_name: string | null;
  enrolled_count: number;
  meeting_summary: string | null;
}

interface RegistrationResponse {
  student_id: number;
  program_name: string;
  current_semester: number;
  registered_courses: RegistrationCourse[];
  suggested_courses: SuggestedCourse[];
  available_courses: AvailableCourse[];
}

interface EnrollmentActionResponse {
  status: string;
  message: string;
}

function getStatusVariant(status: string) {
  if (status === "enrolled") {
    return "success" as const;
  }

  if (status === "waitlisted" || status === "pending") {
    return "warning" as const;
  }

  return "info" as const;
}

function getPriorityVariant(priority: SuggestedCourse["priority_label"]) {
  if (priority === "high") {
    return "success" as const;
  }

  if (priority === "medium") {
    return "info" as const;
  }

  return "warning" as const;
}

export default function CourseRegistration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [requirementFilter, setRequirementFilter] = useState<"all" | "core" | "elective">("all");

  const registrationQuery = useQuery({
    queryKey: ["student", "registration"],
    queryFn: () => apiGet<RegistrationResponse>("/students/me/registration"),
  });

  const enrollMutation = useMutation({
    mutationFn: (offeringId: number) => apiPost<EnrollmentActionResponse>("/students/me/registration/enroll", { offering_id: offeringId }),
    onSuccess: (payload) => {
      toast({
        title: "Course added",
        description: payload.message,
      });
      void queryClient.invalidateQueries({ queryKey: ["student", "registration"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "courses"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "timetable"] });
    },
    onError: (error) => {
      toast({
        title: "Could not add course",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const dropMutation = useMutation({
    mutationFn: (enrollmentId: number) => apiPost<EnrollmentActionResponse>(`/students/me/registration/${enrollmentId}/drop`, {}),
    onSuccess: (payload) => {
      toast({
        title: "Course dropped",
        description: payload.message,
      });
      void queryClient.invalidateQueries({ queryKey: ["student", "registration"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "courses"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "timetable"] });
    },
    onError: (error) => {
      toast({
        title: "Could not drop course",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const filteredAvailableCourses = useMemo(() => {
    const items = registrationQuery.data?.available_courses ?? [];
    return items.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.code.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (requirementFilter === "all") {
        return true;
      }

      return (course.requirement_type ?? "core") === requirementFilter;
    });
  }, [registrationQuery.data?.available_courses, requirementFilter, search]);

  if (registrationQuery.isLoading) {
    return <LoadingState lines={6} />;
  }

  if (registrationQuery.isError) {
    return (
      <ErrorState
        description={registrationQuery.error instanceof Error ? registrationQuery.error.message : "Registration data could not be loaded."}
        onRetry={() => void registrationQuery.refetch()}
      />
    );
  }

  const registration = registrationQuery.data;
  if (!registration) {
    return <EmptyState title="No registration data yet" description="Current-term registrations and available offerings will appear here once your account is active." />;
  }

  const totalCredits = registration.registered_courses.reduce((sum, course) => sum + Number(course.credit_hours || 0), 0);
  const totalEcts = registration.registered_courses.reduce((sum, course) => sum + Number(course.ects_credits || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description="Choose current-term offerings from your curriculum and manage the courses you have already selected" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Available to Register</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing open offerings aligned with {registration.program_name}. Semester {registration.current_semester} students can review upcoming core and elective options here.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search available courses..." className="pl-9" />
                </div>
                <Select value={requirementFilter} onValueChange={(value) => setRequirementFilter(value as typeof requirementFilter)}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Requirement" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredAvailableCourses.length === 0 ? (
              <EmptyState title="No registerable courses found" description="Try changing the search or filter, or come back when more offerings are opened for your program." />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredAvailableCourses.map((course, index) => {
                  const seatsRemaining = Number(course.capacity || 0) - Number(course.enrolled_count || 0);
                  return (
                    <motion.div
                      key={course.offering_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-xl border bg-background p-4 shadow-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">
                            {course.code} · Section {course.section_code}
                          </p>
                          <h4 className="mt-1 text-base font-semibold text-foreground">{course.title}</h4>
                        </div>
                        <StatusBadge variant={course.requirement_type === "elective" ? "info" : "default"}>
                          {titleize(course.requirement_type ?? "core")}
                        </StatusBadge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{course.credit_hours} credits</span>
                        <span>{Number(course.ects_credits || 0)} ECTS</span>
                        <span>Semester {course.recommended_term_number ?? "-"}</span>
                        <span>{titleize(course.delivery_mode)}</span>
                      </div>

                      {course.description ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p> : null}

                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <p>{course.instructor_name || "Instructor pending"}</p>
                        <p>{course.meeting_summary || "Meeting details will be published soon."}</p>
                        <p>
                          Seats: {course.enrolled_count}/{course.capacity}
                          {seatsRemaining > 0 ? ` · ${seatsRemaining} remaining` : " · waitlist only"}
                        </p>
                      </div>

                      <Button className="mt-4 w-full" onClick={() => enrollMutation.mutate(course.offering_id)} disabled={enrollMutation.isPending || course.status !== "open"}>
                        <Plus className="h-4 w-4" /> Register
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-card p-5 shadow-card"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-foreground">Suggested Next Courses</h3>
            </div>

            {registration.suggested_courses.length === 0 ? (
              <EmptyState title="No suggestions right now" description="Recommendation records will appear here when the advising workflow has a clear next-step suggestion for you." />
            ) : (
              <div className="space-y-3">
                {registration.suggested_courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + index * 0.05 }}
                    className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {course.code} · {course.credit_hours} credits · {Number(course.ects_credits || 0)} ECTS
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-foreground">{course.title}</h4>
                        <p className="mt-2 text-sm text-muted-foreground">{course.reason}</p>
                      </div>

                      <StatusBadge variant={getPriorityVariant(course.priority_label)}>
                        {titleize(course.priority_label)} priority
                      </StatusBadge>
                    </div>

                    <Button
                      className="mt-4 w-full sm:w-auto"
                      disabled={!course.offering_id || enrollMutation.isPending}
                      onClick={() => course.offering_id && enrollMutation.mutate(course.offering_id)}
                    >
                      <Plus className="h-4 w-4" /> Add Suggested Course
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-foreground">Current Selection</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registered Courses</span>
                <span className="font-semibold text-foreground">{registration.registered_courses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-semibold text-foreground">{totalCredits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total ECTS</span>
                <span className="font-semibold text-foreground">{totalEcts}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min((totalCredits / 21) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">This summary reflects the courses currently attached to your live backend registration record.</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-foreground">Registered Now</h3>
            {registration.registered_courses.length === 0 ? (
              <EmptyState title="Nothing selected yet" description="Once you register for current-term offerings, they will appear in this summary." />
            ) : (
              <div className="space-y-3">
                {registration.registered_courses.map((course, index) => (
                  <motion.div
                    key={course.enrollment_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.code} · Section {course.section_code} · {course.credit_hours} credits
                        </p>
                      </div>
                      <StatusBadge variant={getStatusVariant(course.enrollment_status)}>{titleize(course.enrollment_status)}</StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{course.meeting_summary || "Meeting details will appear once scheduling is finalized."}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => dropMutation.mutate(course.enrollment_id)}
                      disabled={dropMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" /> Drop Course
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {totalCredits <= 21 ? "Current load is within the recommended range" : "Current load is above the recommended range"}
                </p>
                <p className="text-xs text-muted-foreground">Use the Courses page if you want to inspect the full curriculum path and see how your chosen courses fit into it.</p>
              </div>
            </div>
          </div>

          <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90" onClick={() => navigate("/student/timetable")}>
            Review Timetable
          </Button>
        </div>
      </div>
    </div>
  );
}
