import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Link as LinkIcon, Play, Plus, Trash2, Type } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, FileTypeBadge, LoadingState, MaterialViewButton } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CourseMaterialOut, materialApi } from "@/lib/api";

type MaterialType = "file" | "link" | "video" | "text";
type VisibilityStatus = "published" | "draft" | "scheduled";

const TYPE_OPTIONS: { value: MaterialType; label: string; icon: typeof FileText }[] = [
  { value: "file", label: "File", icon: FileText },
  { value: "link", label: "Link", icon: LinkIcon },
  { value: "video", label: "Video", icon: Play },
  { value: "text", label: "Text", icon: Type },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatWeekDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function materialUrl(material: CourseMaterialOut) {
  if (material.material_kind === "video") return material.video_url ?? material.external_url;
  if (material.material_kind === "link") return material.link_url ?? material.external_url;
  return material.external_url;
}

function topicLabel(topic?: string | null) {
  return topic?.trim() || "Topic not entered yet";
}

export default function WeeklyMaterialsPage({ initialOfferingId }: { initialOfferingId?: number } = {}) {
  const [searchParams] = useSearchParams();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [programStudyLevel, setProgramStudyLevel] = useState("");
  const [academicYearSemester, setAcademicYearSemester] = useState("");
  const [assignmentId, setAssignmentId] = useState<number | null>(initialOfferingId ?? null);
  const [weekId, setWeekId] = useState<number | null>(searchParams.get("weekId") ? Number(searchParams.get("weekId")) : null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [materialType, setMaterialType] = useState<MaterialType>("file");
  const [visibilityStatus, setVisibilityStatus] = useState<VisibilityStatus>("published");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: filters, isLoading: filtersLoading, error: filtersError } = useQuery({
    queryKey: ["teacher-material-filters"],
    queryFn: materialApi.getTeacherMaterialFilters,
  });

  const selectedProgramStudy = filters?.programStudyLevels.find((item) => item.id === programStudyLevel);

  const programStudyOptions = useMemo(() => (filters?.programStudyLevels ?? []).filter((item) => !facultyId || item.faculty_id === facultyId), [filters, facultyId]);

  const { data: termsResult, isLoading: termsLoading } = useQuery({
    queryKey: ["teacher-material-terms", facultyId, programStudyLevel],
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
    queryKey: ["teacher-material-context-courses", facultyId, programStudyLevel, academicYearSemester],
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
    queryKey: ["teacher-material-weeks", assignmentId],
    queryFn: () => materialApi.getTeacherMaterialWeeks(assignmentId!),
    enabled: Boolean(assignmentId),
  });

  useEffect(() => {
    if (!weekId && weeks.length) setWeekId(weeks[Math.min(10, weeks.length - 1)].week_id);
  }, [weekId, weeks]);

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ["teacher-material-overview", assignmentId, weekId],
    queryFn: () => materialApi.getTeacherMaterialOverview(assignmentId!, weekId!),
    enabled: Boolean(assignmentId && weekId),
  });

  useEffect(() => {
    if (!topicId && overview?.days.length) {
      const requestedDate = searchParams.get("date");
      setTopicId((requestedDate ? overview.days.find((day) => day.date === requestedDate)?.topic_id : null) ?? overview.days[0].topic_id);
    }
  }, [overview, topicId, searchParams]);

  const selectedWeek = weeks.find((week) => week.week_id === weekId);
  const selectedTopic = overview?.days.find((day) => day.topic_id === topicId);
  const overviewQueryKey = ["teacher-material-overview", assignmentId, weekId];

  const createMutation = useMutation({
    mutationFn: (form: FormData) => materialApi.createTeacherMaterial(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      formRef.current?.reset();
      setFile(null);
      setMaterialType("file");
      setVisibilityStatus("published");
      setPublishDate("");
      setPublishTime("");
      toast({ title: "Material added" });
    },
    onError: (err: Error) => toast({ title: "Material failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: materialApi.deleteTeacherMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      toast({ title: "Material deleted" });
    },
    onError: (err: Error) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "published" | "hidden" }) => materialApi.updateTeacherMaterialVisibility(id, { visibility_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: overviewQueryKey }),
    onError: (err: Error) => toast({ title: "Visibility failed", description: err.message, variant: "destructive" }),
  });

  function resetAfterFaculty(id: number | null) {
    setFacultyId(id);
    setProgramStudyLevel("");
    setAcademicYearSemester("");
    setAssignmentId(null);
    setWeekId(null);
    setTopicId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentId || !weekId || !topicId || !selectedTopic) {
      toast({ title: "Select a course and week with a scheduled session first.", variant: "destructive" });
      return;
    }
    if (materialType === "file" && !file) {
      toast({ title: "Choose a file to upload.", description: "Allowed files: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, ZIP. Max 50MB.", variant: "destructive" });
      return;
    }
    if (visibilityStatus === "scheduled" && (!publishDate || !publishTime)) {
      toast({ title: "Choose schedule date and time.", variant: "destructive" });
      return;
    }

    const form = new FormData(event.currentTarget);
    form.set("teacher_course_assignment_id", String(assignmentId));
    form.set("week_id", String(weekId));
    form.set("class_session_id", String(topicId));
    form.set("material_type", materialType);
    form.set("visibility_status", visibilityStatus);
    if (visibilityStatus === "scheduled") form.set("scheduled_publish_at", new Date(`${publishDate}T${publishTime}`).toISOString());
    if (materialType === "file" && file) form.set("file", file);
    createMutation.mutate(form);
  }

  if (filtersLoading) return <LoadingState label="Loading assigned course contexts..." />;
  if (filtersError) return <ErrorState message={(filtersError as Error).message} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Weekly Course Materials" description="Share and manage learning materials for your classes" />

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-semibold text-foreground">1. Select Course & Term</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Faculty</span>
            <select value={facultyId ?? ""} onChange={(event) => resetAfterFaculty(event.target.value ? Number(event.target.value) : null)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select faculty</option>
              {(filters?.faculties ?? []).map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Program & Study Level</span>
            <select value={programStudyLevel} onChange={(event) => { setProgramStudyLevel(event.target.value); setAcademicYearSemester(""); setAssignmentId(null); setWeekId(null); setTopicId(null); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm" disabled={!facultyId}>
              <option value="">Select program</option>
              {programStudyOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Academic Year & Semester</span>
            <select value={academicYearSemester} onChange={(event) => { setAcademicYearSemester(event.target.value); setAssignmentId(null); setWeekId(null); setTopicId(null); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm" disabled={!programStudyLevel}>
              <option value="">{termsLoading ? "Loading terms..." : "Select academic year & semester"}</option>
              {terms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            {!termsLoading && programStudyLevel && terms.length === 0 && <p className="text-xs text-destructive">No academic year and semester found for this teaching context.</p>}
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Course</span>
            <select value={assignmentId ?? ""} onChange={(event) => { setAssignmentId(event.target.value ? Number(event.target.value) : null); setWeekId(null); setTopicId(null); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm" disabled={!academicYearSemester}>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course.teacher_course_assignment_id} value={course.teacher_course_assignment_id}>{course.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-foreground">2. Select Week</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekId((current) => Math.max(1, (current ?? 1) - 1))} disabled={!weekId}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekId((current) => Math.min(weeks.length || 1, (current ?? 1) + 1))} disabled={!weekId}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {weeks.length === 0 ? <p className="text-sm text-muted-foreground">Select a course to load semester weeks.</p> : weeks.map((week) => (
            <button
              key={week.week_id}
              onClick={() => { setWeekId(week.week_id); setTopicId(null); }}
              className={cn(
                "min-w-[9.5rem] rounded-lg border px-4 py-3 text-left transition-colors",
                week.week_id === weekId ? "border-purple-500 bg-purple-600 text-white shadow-sm" : "bg-background hover:bg-muted"
              )}
            >
              <p className="text-sm font-semibold">Week {week.week_number}</p>
              <p className={cn("text-xs", week.week_id === weekId ? "text-white/80" : "text-muted-foreground")}>{formatWeekDate(week.start_date)} - {formatWeekDate(week.end_date)}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="rounded-lg border bg-card shadow-card">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                {overview?.week ? `${overview.week.name}: ${formatDate(overview.week.start_date)} - ${formatDate(overview.week.end_date)}` : selectedWeek ? `${selectedWeek.name}: ${formatDate(selectedWeek.start_date)} - ${formatDate(selectedWeek.end_date)}` : "Select a week"}
              </h3>
              <p className="text-sm text-muted-foreground">Materials and links for this week</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setExpanded(new Set((overview?.days ?? []).map((day) => day.topic_id)))}>Expand All</Button>
          </div>
          <div className="space-y-3 p-5">
            {!assignmentId || !weekId ? <EmptyState label="Select filters to load data." /> : overviewLoading ? <LoadingState label="Loading weekly materials..." /> : overviewError ? <ErrorState message={(overviewError as Error).message} /> : overview?.days.length === 0 ? <EmptyState label="No scheduled topics found for this course in the selected week." /> : overview?.days.map((day, index) => {
              const isOpen = expanded.has(day.topic_id);
              return (
                <article key={day.topic_id} className="rounded-lg border bg-background">
                  <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => {
                    setTopicId(day.topic_id);
                    setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(day.topic_id)) next.delete(day.topic_id); else next.add(day.topic_id);
                    return next;
                    });
                  }}>
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500"][index % 5])} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground">{day.day}, {formatDate(day.date)}</span>
                      <span className="block truncate text-sm text-muted-foreground">{day.start_time && day.end_time ? `${day.start_time} - ${day.end_time}` : ""}{day.session_count && day.session_count > 1 ? ` · ${day.session_count} timetable hours grouped` : ""}</span>
                    </span>
                      <span className="block truncate text-sm font-medium text-foreground">Topic: {topicLabel(day.topic_title)}</span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{day.materials_count} {day.materials_count === 1 ? "Material" : "Materials"}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t p-4">
                      {day.materials.length === 0 ? <p className="text-sm text-muted-foreground">No materials uploaded for this topic.</p> : day.materials.map((material) => (
                        <div key={material.id} className="rounded-md border bg-card p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{material.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {material.material_kind.toUpperCase()} - Status: {material.status} - Uploaded: {new Date(material.created_at).toLocaleString()}
                              </p>
                              {material.material_kind === "text" && material.text_content && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{material.text_content}</p>}
                              {(material.material_kind === "link" || material.material_kind === "video") && materialUrl(material) && <p className="mt-1 truncate text-sm text-muted-foreground">{materialUrl(material)}</p>}
                              {material.material_kind === "file" && <FileTypeBadge material={material} />}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {material.material_kind !== "text" && <MaterialViewButton material={material} url={materialApi.viewUrl(material.id)} />}
                              <Button size="sm" variant="outline" onClick={() => visibilityMutation.mutate({ id: material.id, status: material.status === "published" ? "hidden" : "published" })}>
                                {material.status === "published" ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {material.status === "published" ? "Hide" : "Publish"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(material.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
            <p className="pt-2 text-xs text-muted-foreground">Materials are visible to students after you publish them.</p>
          </div>
        </section>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
          <div>
            <h3 className="font-semibold text-foreground">Add New Material</h3>
            <p className="text-sm text-muted-foreground">Add materials for the selected grouped teaching session</p>
          </div>
          {selectedTopic && (
            <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              Target: <span className="font-medium text-foreground">{selectedTopic.day}, {formatDate(selectedTopic.date)}</span>
              {selectedTopic.start_time && selectedTopic.end_time ? ` · ${selectedTopic.start_time} - ${selectedTopic.end_time}` : ""}
              <span className="mt-1 block">Topic: <span className="font-medium text-foreground">{topicLabel(selectedTopic.topic_title)}</span></span>
            </div>
          )}
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Material Title</span>
            <Input name="title" placeholder="Lecture Notes - Introduction to Databases" required />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Type</span>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setMaterialType(value)} className={cn("rounded-md border px-2 py-2 text-xs font-medium", materialType === value ? "border-purple-500 bg-purple-600 text-white" : "bg-background hover:bg-muted")}>
                  <Icon className="mx-auto mb-1 h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>
          {materialType === "file" && (
            <label className="block rounded-lg border border-dashed bg-background p-5 text-center text-sm">
              <Input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mx-auto max-w-full" />
              <span className="mt-2 block text-xs text-muted-foreground">PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, ZIP. Max 50MB.</span>
            </label>
          )}
          {materialType === "link" && <Input name="link_url" type="url" placeholder="https://..." required />}
          {materialType === "video" && <Input name="video_url" type="url" placeholder="https://video.example.com/..." required />}
          {materialType === "text" && <Textarea name="text_content" placeholder="Write material text..." rows={7} required />}
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Visibility</span>
            <select value={visibilityStatus} onChange={(event) => setVisibilityStatus(event.target.value as VisibilityStatus)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="published">Publish now</option>
              <option value="draft">Save as draft</option>
              <option value="scheduled">Schedule publish</option>
            </select>
          </label>
          {visibilityStatus === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} required />
              <Input type="time" value={publishTime} onChange={(event) => setPublishTime(event.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled={createMutation.isPending || !assignmentId || !weekId || !topicId}>
            <Plus className="mr-2 h-4 w-4" />{createMutation.isPending ? "Adding..." : "Add Material"}
          </Button>
        </form>
      </div>
    </div>
  );
}
