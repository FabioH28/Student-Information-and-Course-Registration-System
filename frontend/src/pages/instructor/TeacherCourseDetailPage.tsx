import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleSlash, ClipboardList, ExternalLink, FileText, GraduationCap, Minus, Plus, Save, Trash2, Users, X } from "lucide-react";

import { DownloadButton, EmptyState, ErrorState, FileTypeBadge, LoadingState, MaterialViewButton, WeekSelector, WeeklyTopicCard } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { assignmentsApi, attendanceApi, gradesApi, materialApi, offeringsApi, registrationsApi, studentsApi } from "@/lib/api";
import WeeklyMaterialsPage from "./WeeklyMaterialsPage";
import TeacherAssignmentsPage from "./TeacherAssignmentsPage";
import AttendancePage from "./AttendancePage";
import GradesManagement from "./GradesManagement";

type Tab = "materials" | "assignments" | "attendance" | "grades";
type AttStatus = "present" | "absent" | "late" | "excused";

function tabFromSearch(value: string | null): Tab {
  return value === "assignments" || value === "attendance" || value === "grades" ? value : "materials";
}

function calcFinalGrade(total: number) {
  if (total < 45) return { grade: 4, status: "failed" };
  if (total <= 54) return { grade: 5, status: "passed" };
  if (total <= 64) return { grade: 6, status: "passed" };
  if (total <= 74) return { grade: 7, status: "passed" };
  if (total <= 84) return { grade: 8, status: "passed" };
  if (total <= 94) return { grade: 9, status: "passed" };
  return { grade: 10, status: "passed" };
}

function shortDay(value: string) {
  return value.slice(0, 3);
}

function roomLabel(entry: { room_name?: string | null; room?: string | null; room_type?: string | null }) {
  if (entry.room_name) return entry.room_name;
  return entry.room ?? "Room pending";
}

export default function TeacherCourseDetailPage() {
  const { courseOfferingId } = useParams();
  const offeringId = Number(courseOfferingId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabFromSearch(searchParams.get("tab"));
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["teacher-course-offering", offeringId],
    queryFn: () => offeringsApi.teacherCourseOffering(offeringId),
    enabled: Number.isFinite(offeringId),
  });

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params);
  }

  if (isLoading) return <LoadingState label="Loading course..." />;
  if (error || !course) return <ErrorState message={(error as Error)?.message ?? "Course not found"} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={course.course_name} description={`${course.course_code} - ${course.faculty_name} - ${course.degree_name}`}>
        <Button variant="outline" size="sm" onClick={() => navigate("/instructor/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
      </PageHeader>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={course.status === "active" ? "success" : course.status === "full" ? "warning" : "danger"}>{course.status}</StatusBadge>
              <span className="text-sm text-muted-foreground">{course.credits ?? "-"} credits</span>
              <span className="text-sm text-muted-foreground">{course.group_name}</span>
              <span className="text-sm text-muted-foreground">{course.academic_year}</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</p>
              <div className="flex flex-wrap gap-2">
                {course.schedule.slice(0, 3).map((item, index) => (
                  <span key={`${item.day_of_week}-${item.start_time}-${index}`} title={`${item.day_of_week} ${item.start_time}-${item.end_time} ${course.group_name} ${roomLabel(item)}`} className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{shortDay(item.day_of_week)}</span> · {item.start_time}-{item.end_time} · {course.group_name} · {roomLabel(item)}
                  </span>
                ))}
                {course.schedule.length > 3 && <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">+ {course.schedule.length - 3} more</span>}
                {course.schedule.length === 0 && <span className="text-sm text-muted-foreground">Schedule pending</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Students</p><p className="font-semibold">{course.student_count}/{course.student_capacity}</p></div>
            <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Semester</p><p className="font-semibold">{course.semester ?? "-"}</p></div>
            <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Program</p><p className="font-semibold">{course.program_name}</p></div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          ["materials", FileText, "Materials"],
          ["assignments", ClipboardList, "Assignments"],
          ["attendance", Users, "Attendance"],
          ["grades", GraduationCap, "Grades"],
        ].map(([key, Icon, label]) => (
          <Button key={key as string} variant={tab === key ? "default" : "outline"} onClick={() => setTab(key as Tab)}>
            <Icon className="mr-2 h-4 w-4" />{label as string}
          </Button>
        ))}
      </div>

      {tab === "materials" && <WeeklyMaterialsPage initialOfferingId={offeringId} />}
      {tab === "assignments" && <TeacherAssignmentsPage initialOfferingId={offeringId} />}
      {tab === "attendance" && <AttendancePage initialOfferingId={offeringId} />}
      {tab === "grades" && <GradesManagement initialOfferingId={offeringId} />}
    </div>
  );
}

function TeacherMaterialsTab({ offeringId }: { offeringId: number }) {
  const [week, setWeek] = useState(1);
  const [kind, setKind] = useState<"file" | "link">("file");
  const [visibilityMode, setVisibilityMode] = useState<"publish_now" | "schedule_later">("publish_now");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["teacher-materials", offeringId, week];
  const topicKey = ["teacher-topic", offeringId, week];

  const { data: materials = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => materialApi.teacherList({ offering_id: offeringId, week_number: week }),
  });
  const { data: topic } = useQuery({ queryKey: topicKey, queryFn: () => materialApi.getTeacherTopic(offeringId, week) });

  const uploadMutation = useMutation({
    mutationFn: (form: FormData) => materialApi.createTeacherMaterial(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      formRef.current?.reset();
      setFile(null);
      setKind("file");
      setVisibilityMode("publish_now");
      setPublishDate("");
      setPublishTime("");
      toast({ title: "Material saved" });
    },
    onError: (err: Error) => toast({ title: "Material failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: materialApi.deleteTeacherMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Material deleted" });
    },
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kind === "file" && !file) {
      toast({ title: "Upload a file first", variant: "destructive" });
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("offering_id", String(offeringId));
    form.set("week_number", String(week));
    form.set("material_kind", kind);
    form.set("visibility_mode", visibilityMode);
    if (visibilityMode === "schedule_later") form.set("publish_at", new Date(`${publishDate}T${publishTime}`).toISOString());
    if (kind === "file" && file) form.set("file", file);
    uploadMutation.mutate(form);
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="rounded-lg border bg-card shadow-card">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h3 className="font-semibold">Materials</h3>
            <p className="text-sm text-muted-foreground">Weekly files and links for the selected topic</p>
          </div>
          <div className="w-40"><WeekSelector value={week} onChange={setWeek} /></div>
        </div>
        <div className="space-y-3 p-5">
          <WeeklyTopicEditor offeringId={offeringId} week={week} topic={topic} />
          {isLoading ? <LoadingState label="Loading materials..." /> : error ? <ErrorState message={(error as Error).message} /> : materials.length === 0 ? <EmptyState label={`No materials yet for Week ${week}.`} /> : materials.map((material) => (
            <article key={material.id} className="rounded-lg border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium">{material.title}</h4>
                    <FileTypeBadge material={material} />
                    <StatusBadge variant={material.status === "published" ? "success" : "warning"}>{material.status}</StatusBadge>
                  </div>
                  {material.status === "scheduled" && material.publish_at && <p className="text-xs text-muted-foreground">Scheduled for {new Date(material.publish_at).toLocaleString()}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <MaterialViewButton material={material} url={materialApi.viewUrl(material.id)} />
                  {material.material_kind === "file" && <DownloadButton url={materialApi.downloadUrl(material.id)} />}
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(material.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Add Material</h3>
        <Input name="title" placeholder="Material title" required />
        <select value={kind} onChange={(e) => setKind(e.target.value as "file" | "link")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="file">File upload</option>
          <option value="link">External link</option>
        </select>
        {kind === "file" ? <Input type="file" accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /> : (
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="external_url" type="url" placeholder="https://..." className="pl-9" required />
          </div>
        )}
        <select value={visibilityMode} onChange={(e) => setVisibilityMode(e.target.value as "publish_now" | "schedule_later")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="publish_now">Publish now</option>
          <option value="schedule_later">Schedule for later</option>
        </select>
        {visibilityMode === "schedule_later" && (
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required />
            <Input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} required />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={uploadMutation.isPending}><Plus className="mr-2 h-4 w-4" />Save Material</Button>
      </form>
    </div>
  );
}

function WeeklyTopicEditor({ offeringId, week, topic }: { offeringId: number; week: number; topic: Awaited<ReturnType<typeof materialApi.getTeacherTopic>> | undefined }) {
  const [title, setTitle] = useState(topic?.topic_title ?? "");
  const [description, setDescription] = useState(topic?.topic_description ?? "");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useEffect(() => {
    setTitle(topic?.topic_title ?? "");
    setDescription(topic?.topic_description ?? "");
  }, [topic?.id, topic?.topic_title, topic?.topic_description]);
  const mutation = useMutation({
    mutationFn: () => materialApi.saveTeacherTopic(offeringId, week, { topic_title: title, topic_description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-topic", offeringId, week] });
      queryClient.invalidateQueries({ queryKey: ["student-week-materials", offeringId, week] });
      toast({ title: "Week topic saved" });
    },
    onError: (err: Error) => toast({ title: "Topic failed", description: err.message, variant: "destructive" }),
  });
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Week {week} Topic</h4>
          <p className="text-sm text-muted-foreground">{topic ? topic.topic_title : "No topic added for this week yet."}</p>
        </div>
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending || !title.trim()}><Save className="mr-2 h-4 w-4" />Save Week Topic</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Introduction to Algorithms" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional topic description" />
      </div>
    </div>
  );
}

function TeacherAssignmentsTab({ offeringId }: { offeringId: number }) {
  const [week, setWeek] = useState(1);
  const [visibilityMode, setVisibilityMode] = useState<"publish_now" | "schedule_later">("publish_now");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["teacher-assignments", offeringId, week];
  const { data: topic } = useQuery({ queryKey: ["teacher-topic", offeringId, week], queryFn: () => materialApi.getTeacherTopic(offeringId, week) });
  const { data: assignments = [], isLoading, error } = useQuery({ queryKey, queryFn: () => assignmentsApi.teacherList(offeringId, week) });
  const createMutation = useMutation({
    mutationFn: (form: FormData) => assignmentsApi.create(offeringId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      formRef.current?.reset();
      setFile(null);
      setVisibilityMode("publish_now");
      toast({ title: "Assignment saved" });
    },
    onError: (err: Error) => toast({ title: "Assignment failed", description: err.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: assignmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Assignment deleted" });
    },
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("week_number", String(week));
    form.set("visibility_mode", visibilityMode);
    form.set("max_points", String(Math.min(Number(form.get("max_points") || 100), 100)));
    if (visibilityMode === "schedule_later") form.set("publish_at", new Date(`${publishDate}T${publishTime}`).toISOString());
    if (file) form.set("file", file);
    createMutation.mutate(form);
  }
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="rounded-lg border bg-card shadow-card">
        <div className="flex items-center justify-between border-b p-5">
          <div><h3 className="font-semibold">Assignments</h3><p className="text-sm text-muted-foreground">Weekly assignments linked to course topics</p></div>
          <div className="w-40"><WeekSelector value={week} onChange={setWeek} /></div>
        </div>
        <div className="space-y-3 p-5">
          <WeeklyTopicCard week={week} topic={topic} />
          {isLoading ? <LoadingState label="Loading assignments..." /> : error ? <ErrorState message={(error as Error).message} /> : assignments.length === 0 ? <EmptyState label={`No assignments yet for Week ${week}.`} /> : assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-lg border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2"><h4 className="font-medium">{assignment.title}</h4><StatusBadge variant={assignment.status === "published" ? "success" : "warning"}>{assignment.status}</StatusBadge></div>
                  {assignment.description && <p className="text-sm text-muted-foreground">{assignment.description}</p>}
                  {assignment.instructions && <p className="text-sm text-muted-foreground">{assignment.instructions}</p>}
                  <p className="text-xs text-muted-foreground">Due {assignment.due_date ?? "-"} {assignment.due_time ?? ""} - {assignment.max_points}/100 max</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(assignment.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
        <h3 className="font-semibold">Create Assignment</h3>
        <Input name="title" placeholder="Assignment title" required />
        <Textarea name="description" placeholder="Description" />
        <Textarea name="instructions" placeholder="Instructions" />
        <div className="grid grid-cols-2 gap-3"><Input name="due_date" type="date" /><Input name="due_time" type="time" /></div>
        <Input name="max_points" type="number" min={0} max={100} defaultValue={100} />
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <select value={visibilityMode} onChange={(e) => setVisibilityMode(e.target.value as "publish_now" | "schedule_later")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="publish_now">Publish now</option>
          <option value="schedule_later">Schedule for later</option>
        </select>
        {visibilityMode === "schedule_later" && <div className="grid grid-cols-2 gap-3"><Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required /><Input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} required /></div>}
        <Button type="submit" className="w-full" disabled={createMutation.isPending}><Plus className="mr-2 h-4 w-4" />Create Assignment</Button>
      </form>
    </div>
  );
}

function TeacherAttendanceTab({ offeringId }: { offeringId: number }) {
  const [attendance, setAttendance] = useState<Record<number, AttStatus>>({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sessions = [] } = useQuery({ queryKey: ["attendance-sessions", offeringId], queryFn: () => attendanceApi.sessions(offeringId) });
  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-offering", offeringId], queryFn: () => registrationsApi.list({ offering_id: offeringId }) });
  const { data: allStudents = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const students = allStudents.filter((student) => registrations.some((reg) => reg.status === "active" && reg.student_id === student.id));
  const currentSession = activeSessionId ? sessions.find((session) => session.id === activeSessionId) : sessions.find((session) => session.session_date === date) ?? sessions[sessions.length - 1];

  const createSessionMutation = useMutation({
    mutationFn: () => attendanceApi.createSession(offeringId, { session_date: date, week_number: 1, topic: "Class session" }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", offeringId] });
      setActiveSessionId(session.id);
    },
  });
  const submitMutation = useMutation({
    mutationFn: (sessionId: number) => attendanceApi.submit(sessionId, students.map((student) => ({ student_id: student.id, status: attendance[student.id] ?? "absent" }))),
    onSuccess: (data) => toast({ title: `Attendance saved for ${data.saved} student(s)` }),
    onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold">Attendance</h3><p className="text-sm text-muted-foreground">Mark enrolled students for this course only</p></div>
        <div className="flex gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Button onClick={() => currentSession ? submitMutation.mutate(currentSession.id) : createSessionMutation.mutate()}>{currentSession ? "Save Attendance" : "Start Session"}</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">{["Student", "Code", "Status", "Actions"].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>)}</tr></thead>
          <tbody className="divide-y">
            {students.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No enrolled students.</td></tr> : students.map((student) => {
              const status = attendance[student.id];
              return (
                <tr key={student.id}>
                  <td className="px-4 py-3 text-sm font-medium">{student.first_name} {student.last_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{student.student_code}</td>
                  <td className="px-4 py-3">{status ? <StatusBadge variant={status === "present" ? "success" : status === "absent" ? "danger" : status === "late" ? "warning" : "info"}>{status}</StatusBadge> : <span className="text-xs text-muted-foreground">Not marked</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {[
                        ["present", Check],
                        ["absent", X],
                        ["late", Minus],
                        ["excused", CircleSlash],
                      ].map(([next, Icon]) => <button key={next as string} onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: next as AttStatus }))} className="rounded-md p-1.5 hover:bg-muted"><Icon className="h-4 w-4" /></button>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TeacherGradesTab({ offeringId }: { offeringId: number }) {
  const [localGrades, setLocalGrades] = useState<Record<number, { midterm: string; project: string; quiz: string; final: string }>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-offering", offeringId], queryFn: () => registrationsApi.list({ offering_id: offeringId }) });
  const { data: grades = [] } = useQuery({ queryKey: ["grades-offering", offeringId], queryFn: () => gradesApi.forOffering(offeringId) });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const gradeByRegId = Object.fromEntries(grades.map((grade) => [grade.registration_id, grade]));
  const activeRegs = registrations.filter((reg) => reg.status === "active");

  const saveMutation = useMutation({
    mutationFn: ({ regId, data }: { regId: number; data: { midterm_score?: number; project_score?: number; quiz_score?: number; final_exam_score?: number } }) => gradesApi.upsert(offeringId, regId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grades-offering", offeringId] }),
    onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });
  const publishMutation = useMutation({
    mutationFn: (ids: number[]) => gradesApi.publish(ids),
    onSuccess: (data) => toast({ title: `Published ${data.published} grade(s)` }),
  });

  function save(regId: number) {
    const local = localGrades[regId];
    if (!local) return;
    const data = {
      midterm_score: local.midterm ? Number(local.midterm) : undefined,
      project_score: local.project ? Number(local.project) : undefined,
      quiz_score: local.quiz ? Number(local.quiz) : undefined,
      final_exam_score: local.final ? Number(local.final) : undefined,
    };
    saveMutation.mutate({ regId, data });
  }

  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="flex items-center justify-between border-b p-5">
        <div><h3 className="font-semibold">Grades</h3><p className="text-sm text-muted-foreground">Midterm /15, project /15, quiz /10, final exam /60</p></div>
        <Button onClick={() => publishMutation.mutate(activeRegs.map((reg) => reg.id))}><Save className="mr-2 h-4 w-4" />Publish All</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">{["Student", "Midterm", "Project", "Quiz", "Final", "Total", "Grade", ""].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>)}</tr></thead>
          <tbody className="divide-y">
            {activeRegs.map((reg) => {
              const student = studentMap[reg.student_id];
              const existing = gradeByRegId[reg.id];
              const local = localGrades[reg.id] ?? { midterm: "", project: "", quiz: "", final: "" };
              const total = (local.midterm ? Number(local.midterm) : Number(existing?.midterm_score ?? 0)) + (local.project ? Number(local.project) : Number(existing?.project_score ?? 0)) + (local.quiz ? Number(local.quiz) : Number(existing?.quiz_score ?? 0)) + (local.final ? Number(local.final) : Number(existing?.final_exam_score ?? 0));
              const grade = calcFinalGrade(total);
              return (
                <tr key={reg.id}>
                  <td className="px-4 py-3 text-sm font-medium">{student ? `${student.first_name} ${student.last_name}` : `Student #${reg.student_id}`}</td>
                  <td className="px-4 py-3"><Input type="number" min={0} max={15} value={local.midterm} placeholder={existing?.midterm_score ? String(existing.midterm_score) : "0"} onChange={(e) => setLocalGrades((prev) => ({ ...prev, [reg.id]: { ...local, midterm: e.target.value } }))} className="h-8 w-20" /></td>
                  <td className="px-4 py-3"><Input type="number" min={0} max={15} value={local.project} placeholder={existing?.project_score ? String(existing.project_score) : "0"} onChange={(e) => setLocalGrades((prev) => ({ ...prev, [reg.id]: { ...local, project: e.target.value } }))} className="h-8 w-20" /></td>
                  <td className="px-4 py-3"><Input type="number" min={0} max={10} value={local.quiz} placeholder={existing?.quiz_score ? String(existing.quiz_score) : "0"} onChange={(e) => setLocalGrades((prev) => ({ ...prev, [reg.id]: { ...local, quiz: e.target.value } }))} className="h-8 w-20" /></td>
                  <td className="px-4 py-3"><Input type="number" min={0} max={60} value={local.final} placeholder={existing?.final_exam_score ? String(existing.final_exam_score) : "0"} onChange={(e) => setLocalGrades((prev) => ({ ...prev, [reg.id]: { ...local, final: e.target.value } }))} className="h-8 w-20" /></td>
                  <td className="px-4 py-3 text-sm">{total.toFixed(1)}</td>
                  <td className="px-4 py-3"><StatusBadge variant={grade.status === "failed" ? "danger" : grade.grade >= 8 ? "success" : "info"}>{grade.grade}</StatusBadge></td>
                  <td className="px-4 py-3"><Button size="sm" variant="outline" onClick={() => save(reg.id)} disabled={!localGrades[reg.id]}>Save</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
