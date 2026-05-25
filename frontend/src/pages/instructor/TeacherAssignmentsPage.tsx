import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, Download, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState, openProtectedFile } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { assignmentsApi, materialApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type SubmissionTab = "submitted" | "missing";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function splitDateTime(value?: string | null) {
  if (!value) return { date: "", time: "" };
  const [date, rawTime = ""] = value.split("T");
  return { date, time: rawTime.slice(0, 5) };
}

export default function TeacherAssignmentsPage({ initialOfferingId }: { initialOfferingId?: number } = {}) {
  const [searchParams] = useSearchParams();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [programStudyLevel, setProgramStudyLevel] = useState("");
  const [academicYearSemester, setAcademicYearSemester] = useState("");
  const [assignmentId, setAssignmentId] = useState<number | null>(initialOfferingId ?? null);
  const [weekId, setWeekId] = useState<number | null>(searchParams.get("weekId") ? Number(searchParams.get("weekId")) : null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [submissionTab, setSubmissionTab] = useState<SubmissionTab>("submitted");
  const [scores, setScores] = useState<Record<number, { score: string; feedback: string }>>({});
  const [savedStudents, setSavedStudents] = useState<Set<number>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: filters, isLoading: filtersLoading, error: filtersError } = useQuery({ queryKey: ["teacher-assignment-filters"], queryFn: materialApi.getTeacherMaterialFilters });
  const selectedProgramStudy = filters?.programStudyLevels.find((item) => item.id === programStudyLevel);
  const programStudyOptions = useMemo(() => (filters?.programStudyLevels ?? []).filter((item) => !facultyId || item.faculty_id === facultyId), [filters, facultyId]);

  const { data: termsResult, isLoading: termsLoading } = useQuery({
    queryKey: ["teacher-assignment-terms", facultyId, programStudyLevel],
    queryFn: () => materialApi.getTeacherMaterialTerms({
      faculty_id: facultyId!,
      program_id: selectedProgramStudy!.program_id,
      study_level: selectedProgramStudy!.study_level,
    }),
    enabled: Boolean(facultyId && selectedProgramStudy),
  });
  const terms = termsResult?.terms ?? [];
  const selectedYearSemester = terms.find((item) => item.value === academicYearSemester);

  const { data: courses = [] } = useQuery({
    queryKey: ["teacher-assignment-courses", facultyId, programStudyLevel, academicYearSemester],
    queryFn: () => materialApi.getTeacherMaterialCourses({
      faculty_id: facultyId!,
      program_id: selectedProgramStudy!.program_id,
      study_level: selectedProgramStudy!.study_level,
      academic_year: selectedYearSemester!.academic_year_name,
      semester_id: selectedYearSemester!.semester_id,
    }),
    enabled: Boolean(facultyId && selectedProgramStudy && selectedYearSemester),
  });

  const { data: weeks = [] } = useQuery({
    queryKey: ["teacher-assignment-weeks", assignmentId],
    queryFn: () => materialApi.getTeacherMaterialWeeks(assignmentId!),
    enabled: Boolean(assignmentId),
  });

  useEffect(() => {
    if (!weekId && weeks.length) setWeekId(weeks[0].week_id);
  }, [weekId, weeks]);

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ["teacher-assignment-overview", assignmentId, weekId],
    queryFn: () => materialApi.getTeacherMaterialOverview(assignmentId!, weekId!),
    enabled: Boolean(assignmentId && weekId),
  });

  useEffect(() => {
    if (!topicId && overview?.days.length) {
      const requestedDate = searchParams.get("date");
      setTopicId((requestedDate ? overview.days.find((day) => day.date === requestedDate)?.topic_id : null) ?? overview.days[0].topic_id);
    }
  }, [overview, topicId, searchParams]);

  const selectedTopic = overview?.days.find((day) => day.topic_id === topicId);
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ["teacher-assignments-page", assignmentId, weekId],
    queryFn: () => assignmentsApi.teacherList(assignmentId!, weekId!),
    enabled: Boolean(assignmentId && weekId),
  });
  const existingAssignment = assignments[0];
  const start = splitDateTime(existingAssignment?.start_at);
  const end = splitDateTime(existingAssignment?.end_at ?? (existingAssignment?.due_date ? `${existingAssignment.due_date}T${existingAssignment.due_time ?? "23:59"}` : null));

  const { data: submissions = [] } = useQuery({
    queryKey: ["teacher-assignment-submissions", selectedAssignmentId],
    queryFn: () => assignmentsApi.submissions(selectedAssignmentId!),
    enabled: Boolean(selectedAssignmentId),
  });
  const submitted = submissions.filter((item) => item.status !== "not_submitted" && (item.submitted_at || item.submitted_text || item.submitted_file_original_name));
  const missing = submissions.filter((item) => item.status === "not_submitted" || (!item.submitted_at && !item.submitted_text && !item.submitted_file_original_name));
  const visibleSubmissions = submissionTab === "submitted" ? submitted : missing;

  const createMutation = useMutation({
    mutationFn: (form: FormData) => assignmentsApi.create(assignmentId!, form),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments-page", assignmentId, weekId] });
      setSelectedAssignmentId(saved.id);
      toast({ title: existingAssignment ? "Assignment updated" : "Assignment created" });
    },
    onError: (err: Error) => toast({ title: "Assignment failed", description: err.message, variant: "destructive" }),
  });

  const scoreMutation = useMutation({
    mutationFn: ({ assignmentId, studentId, score, feedback }: { assignmentId: number; studentId: number; score?: number; feedback?: string }) =>
      assignmentsApi.scoreStudentSubmission(assignmentId, studentId, { score, feedback }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignment-submissions", selectedAssignmentId] });
      setSavedStudents((current) => new Set(current).add(variables.studentId));
      window.setTimeout(() => setSavedStudents((current) => {
        const next = new Set(current);
        next.delete(variables.studentId);
        return next;
      }), 1800);
      toast({ title: "Submission grade saved and published to the student." });
    },
    onError: (err: Error) => toast({ title: "Score failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: assignmentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-assignments-page", assignmentId, weekId] }),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assignmentId || !weekId || !topicId) {
      toast({ title: "Select a course and week with a scheduled session first.", variant: "destructive" });
      return;
    }
    const form = new FormData(e.currentTarget);
    const startAt = new Date(`${form.get("start_date")}T${form.get("start_time")}`);
    const endAt = new Date(`${form.get("end_date")}T${form.get("end_time")}`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt < startAt) {
      toast({ title: "End date/time cannot be before start date/time.", variant: "destructive" });
      return;
    }
    form.set("week_number", String(weekId));
    form.set("class_session_id", String(topicId));
    form.set("visibility_mode", "publish_now");
    form.set("max_points", "100");
    createMutation.mutate(form);
  }

  async function downloadSubmission(submission: typeof submissions[number]) {
    if (submission.submitted_file_original_name && submission.id) {
      await openProtectedFile(assignmentsApi.submissionDownloadUrl(submission.id), true);
      return;
    }
    toast({ title: "No file submitted", description: "This submission does not include an uploaded file.", variant: "destructive" });
  }

  if (filtersLoading) return <LoadingState label="Loading assigned course contexts..." />;
  if (filtersError) return <ErrorState message={(filtersError as Error).message} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Assignments" description="Create and score one weekly assignment for each course" />

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-foreground">Select Course & Term</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <select value={facultyId ?? ""} onChange={(e) => { setFacultyId(e.target.value ? Number(e.target.value) : null); setProgramStudyLevel(""); setAcademicYearSemester(""); setAssignmentId(null); setWeekId(null); setTopicId(null); }} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Faculty</option>
            {(filters?.faculties ?? []).map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
          </select>
          <select value={programStudyLevel} onChange={(e) => { setProgramStudyLevel(e.target.value); setAcademicYearSemester(""); setAssignmentId(null); setWeekId(null); setTopicId(null); }} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!facultyId}>
            <option value="">Program & Study Level</option>
            {programStudyOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select value={academicYearSemester} onChange={(e) => { setAcademicYearSemester(e.target.value); setAssignmentId(null); setWeekId(null); setTopicId(null); }} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!programStudyLevel}>
            <option value="">{termsLoading ? "Loading terms..." : "Academic Year & Semester"}</option>
            {terms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={assignmentId ?? ""} onChange={(e) => { setAssignmentId(e.target.value ? Number(e.target.value) : null); setWeekId(null); setTopicId(null); }} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!academicYearSemester}>
            <option value="">Course</option>
            {courses.map((course) => <option key={course.teacher_course_assignment_id} value={course.teacher_course_assignment_id}>{course.label}</option>)}
          </select>
          <select value={weekId ?? ""} onChange={(e) => { setWeekId(e.target.value ? Number(e.target.value) : null); setTopicId(null); }} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!assignmentId}>
            <option value="">Week</option>
            {weeks.map((week) => <option key={week.week_id} value={week.week_id}>{week.name}: {week.start_date} - {week.end_date}</option>)}
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
          <div>
            <h3 className="font-semibold">Weekly Assignment</h3>
            <p className="text-sm text-muted-foreground">One assignment is allowed for the selected course and week.</p>
          </div>
          {!assignmentId || !weekId ? <EmptyState label="Select filters to load data." /> : overviewLoading ? <LoadingState label="Loading scheduled sessions..." /> : overviewError ? <ErrorState message={(overviewError as Error).message} /> : overview?.days.length === 0 ? <EmptyState label="No scheduled session found for this week." /> : (
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="font-medium">{selectedTopic ? `${formatDate(selectedTopic.date)}${selectedTopic.start_time && selectedTopic.end_time ? `, ${selectedTopic.start_time} - ${selectedTopic.end_time}` : ""}` : "Scheduled lecture"}</p>
              <p className="text-muted-foreground">Topic: {selectedTopic?.topic_title?.trim() || "Topic not entered yet."}</p>
            </div>
          )}
          {!weekId ? null : isLoading ? <LoadingState label="Loading assignment..." /> : error ? <ErrorState message={(error as Error).message} /> : assignments.length === 0 ? <EmptyState label="No assignment created for this week." /> : assignments.slice(0, 1).map((assignment) => (
            <article key={assignment.id} className={cn("rounded-lg border bg-background p-4", selectedAssignmentId === assignment.id && "border-purple-500")}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-foreground">{assignment.title}</h4>
                    <StatusBadge variant={assignment.status === "published" ? "success" : "warning"}>{assignment.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{assignment.description || "No description added."}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Open {assignment.start_at ? new Date(assignment.start_at).toLocaleString() : "-"} to {assignment.end_at ? new Date(assignment.end_at).toLocaleString() : `${assignment.due_date ?? "-"} ${assignment.due_time ?? ""}`} · Max points: 100 · {assignment.submissions_count ?? 0} submitted
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAssignmentId(assignment.id); setSubmissionTab("submitted"); }}>Submissions</Button>
                  <Button size="sm" variant="destructive" title="Delete assignment" aria-label="Delete assignment" onClick={() => deleteMutation.mutate(assignment.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </article>
          ))}

          {selectedAssignmentId && (
            <div className="rounded-lg border bg-background">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-semibold">Submissions</h4>
                <div className="flex rounded-md border bg-card p-1">
                  {(["submitted", "missing"] as SubmissionTab[]).map((tab) => (
                    <button key={tab} type="button" onClick={() => setSubmissionTab(tab)} className={cn("rounded px-3 py-1.5 text-xs font-medium", submissionTab === tab ? "bg-purple-600 text-white" : "text-muted-foreground hover:bg-muted")}>
                      {tab === "submitted" ? `Submitted Students (${submitted.length})` : `Missing Submissions (${missing.length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y">
                {visibleSubmissions.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No students in this view.</p> : visibleSubmissions.map((submission) => {
                  const draft = scores[submission.student_id] ?? { score: submission.score?.toString() ?? "", feedback: submission.feedback ?? "" };
                  const isSaved = savedStudents.has(submission.student_id);
                  const hasFileSubmission = Boolean(submission.submitted_file_original_name && submission.id);
                  return (
                    <div key={`${submission.assignment_id}-${submission.student_id}`} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_8rem_7rem_minmax(12rem,1fr)_auto] lg:items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{submission.student_name}</p>
                        <p className="text-xs text-muted-foreground">{submission.student_code} · {submissionTab === "submitted" ? submission.submission_type ?? "Text" : "Not submitted"}</p>
                        {submissionTab === "submitted" && !hasFileSubmission && <p className="mt-1 text-xs text-muted-foreground">No file submitted</p>}
                      </div>
                      {submissionTab === "submitted" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!hasFileSubmission}
                            title={hasFileSubmission ? "Download submitted file" : "No file submitted"}
                            onClick={() => downloadSubmission(submission).catch((error) => toast({ title: "Download failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }))}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Input type="number" min={0} max={100} value={draft.score} onChange={(e) => setScores((prev) => ({ ...prev, [submission.student_id]: { ...draft, score: e.target.value } }))} placeholder="0-100" />
                          <Input value={draft.feedback} onChange={(e) => setScores((prev) => ({ ...prev, [submission.student_id]: { ...draft, feedback: e.target.value } }))} placeholder="Comment" />
                          <Button size="sm" className={cn(isSaved && "bg-emerald-600 text-white hover:bg-emerald-700")} onClick={() => {
                            if (draft.score === "") {
                              toast({ title: "Score is required", variant: "destructive" });
                              return;
                            }
                            const score = Number(draft.score);
                            if (Number.isNaN(score) || score < 0 || score > Number(existingAssignment?.max_points ?? 100)) {
                              toast({ title: "Invalid score", description: `Score must be between 0 and ${existingAssignment?.max_points ?? 100}.`, variant: "destructive" });
                              return;
                            }
                            scoreMutation.mutate({ assignmentId: selectedAssignmentId, studentId: submission.student_id, score, feedback: draft.feedback });
                          }}>
                            {isSaved ? <><Check className="mr-2 h-4 w-4" />Saved</> : "Save"}
                          </Button>
                        </>
                      ) : (
                        <div className="lg:col-span-4"><StatusBadge variant="warning">Not submitted</StatusBadge></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
          <h3 className="font-semibold">{assignments.length ? "Edit Assignment" : "Create Assignment"}</h3>
          {assignmentId && weekId && overview?.days.length === 0 && <p className="text-sm text-muted-foreground">No scheduled session exists for this course/week, so assignment creation is disabled.</p>}
          <Input name="title" placeholder="Assignment title" defaultValue={existingAssignment?.title ?? selectedTopic?.topic_title ?? ""} key={`${existingAssignment?.id ?? "new"}-${selectedTopic?.topic_id ?? "assignment-title"}`} required />
          <Textarea name="description" placeholder="Description" defaultValue={existingAssignment?.description ?? ""} key={`desc-${existingAssignment?.id ?? "new"}`} />
          <Textarea name="instructions" placeholder="Instructions" defaultValue={existingAssignment?.instructions ?? ""} key={`inst-${existingAssignment?.id ?? "new"}`} />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm"><span className="font-medium">Start date</span><Input name="start_date" type="date" defaultValue={start.date} required /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">Start time</span><Input name="start_time" type="time" defaultValue={start.time} required /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">End date</span><Input name="end_date" type="date" defaultValue={end.date} required /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">End time</span><Input name="end_time" type="time" defaultValue={end.time} required /></label>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">Max points: <span className="font-medium text-foreground">100</span></div>
          <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled={!assignmentId || !weekId || !topicId || createMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />{existingAssignment ? "Save Assignment" : "Create Assignment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
