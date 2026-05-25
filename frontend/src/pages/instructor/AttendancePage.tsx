import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle, Minus, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, LoadingState } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attendanceApi, materialApi, TeacherAttendanceSessionOut, TeacherClassSessionOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AttStatus = "present" | "absent" | "late" | "excused";

const ACTIONS: { status: AttStatus; label: string; icon: ElementType; variant: string }[] = [
  { status: "present", label: "Present", icon: Check, variant: "text-success bg-success/10 hover:bg-success/20" },
  { status: "absent", label: "Absent", icon: X, variant: "text-destructive bg-destructive/10 hover:bg-destructive/20" },
  { status: "late", label: "Late", icon: Minus, variant: "text-warning bg-warning/10 hover:bg-warning/20" },
  { status: "excused", label: "Excused", icon: Circle, variant: "text-primary bg-primary/10 hover:bg-primary/20" },
];

function formatDate(value?: string | null) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function weekNumberForDate(value: string) {
  const semesterStart = new Date("2026-02-16T00:00:00");
  const sessionDate = new Date(`${value}T00:00:00`);
  return Math.max(1, Math.floor((sessionDate.getTime() - semesterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function roomLabel(session?: TeacherAttendanceSessionOut | null) {
  if (!session) return "";
  const label = session.room_type === "lab" ? "Lab" : session.room_type === "auditorium" ? "Auditorium" : "Classroom";
  return `${label}: ${session.room_name ?? "Not assigned"}`;
}

export default function AttendancePage({ initialOfferingId }: { initialOfferingId?: number } = {}) {
  const [searchParams] = useSearchParams();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [programStudyLevel, setProgramStudyLevel] = useState("");
  const [academicYearSemester, setAcademicYearSemester] = useState("");
  const [offeringId, setOfferingId] = useState<number | "">(initialOfferingId ?? (searchParams.get("offeringId") ? Number(searchParams.get("offeringId")) : ""));
  const [weekNumber, setWeekNumber] = useState<number>(searchParams.get("weekId") ? Number(searchParams.get("weekId")) : searchParams.get("date") ? weekNumberForDate(searchParams.get("date")!) : 0);
  const [sessionId, setSessionId] = useState<number | "">("");
  const [attendance, setAttendance] = useState<Record<number, AttStatus>>({});
  const [startSession, setStartSession] = useState<TeacherClassSessionOut | null>(null);
  const [topicAttendanceSession, setTopicAttendanceSession] = useState<TeacherAttendanceSessionOut | null>(null);
  const [topicMode, setTopicMode] = useState<"start" | "edit-today" | "edit-attendance" | null>(null);
  const [startTopic, setStartTopic] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: todaySessions = [] } = useQuery({ queryKey: ["teacher-today-sessions"], queryFn: materialApi.getTodaySessions });
  const { data: filters, isLoading } = useQuery({ queryKey: ["teacher-attendance-shared-filters"], queryFn: materialApi.getTeacherMaterialFilters });
  const selectedProgramStudy = filters?.programStudyLevels.find((item) => item.id === programStudyLevel);
  const programStudyOptions = useMemo(() => (filters?.programStudyLevels ?? []).filter((item) => !facultyId || item.faculty_id === facultyId), [filters, facultyId]);

  const { data: termsResult, isLoading: termsLoading } = useQuery({
    queryKey: ["teacher-attendance-terms", facultyId, programStudyLevel],
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
    queryKey: ["teacher-attendance-courses", facultyId, programStudyLevel, academicYearSemester],
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
    queryKey: ["teacher-attendance-weeks", offeringId],
    queryFn: () => materialApi.getTeacherMaterialWeeks(Number(offeringId)),
    enabled: Boolean(offeringId),
  });

  useEffect(() => {
    if (!weekNumber && weeks.length) setWeekNumber(weeks[0].week_number);
  }, [weekNumber, weeks]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["teacher-attendance-sessions", offeringId, weekNumber],
    queryFn: () => attendanceApi.teacherSessions(Number(offeringId), weekNumber),
    enabled: Boolean(offeringId && weekNumber),
  });

  const requestedSessionIds = useMemo(() => new Set((searchParams.get("sessionIds") ?? "").split(",").map((item) => Number(item)).filter(Boolean)), [searchParams]);
  const visibleSessions = useMemo(() => {
    const filtered = requestedSessionIds.size > 0 ? sessions.filter((session) => requestedSessionIds.has(session.timetable_entry_id)) : [...sessions];
    return filtered.sort((a, b) => (a.timetable_date ?? "").localeCompare(b.timetable_date ?? "") || a.start_time.localeCompare(b.start_time));
  }, [requestedSessionIds, sessions]);

  useEffect(() => {
    if (sessionId || visibleSessions.length === 0) return;
    setSessionId(visibleSessions[0].timetable_entry_id);
  }, [sessionId, visibleSessions]);

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["teacher-attendance-session", sessionId],
    queryFn: () => attendanceApi.teacherSession(Number(sessionId)),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (!detail) return;
    setAttendance(Object.fromEntries(detail.students.map((student) => [student.student_id, (student.status ?? "present") as AttStatus])));
  }, [detail]);

  const selectedSession = detail?.session ?? visibleSessions.find((session) => session.timetable_entry_id === sessionId) ?? null;
  const locked = Boolean(selectedSession && !selectedSession.is_editable);
  const summary = {
    present: Object.values(attendance).filter((value) => value === "present").length,
    absent: Object.values(attendance).filter((value) => value === "absent").length,
    late: Object.values(attendance).filter((value) => value === "late").length,
    excused: Object.values(attendance).filter((value) => value === "excused").length,
  };

  const saveMutation = useMutation({
    mutationFn: () => attendanceApi.teacherBulkSave(Number(sessionId), Object.entries(attendance).map(([student_id, status]) => ({ student_id: Number(student_id), status }))),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-session", sessionId] });
      toast({ title: `Attendance saved for ${data.saved} student(s)` });
    },
    onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });
  const startMutation = useMutation({
    mutationFn: ({ sessionId, topic }: { sessionId: number; topic: string }) => materialApi.startSession(sessionId, { topic_title: topic }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-today-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-session"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-material-overview"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignment-overview"] });
      setOfferingId(session.course_offering_id);
      setWeekNumber(session.week_number);
      if (session.timetable_entry_id) setSessionId(session.timetable_entry_id);
      setStartSession(null);
      setTopicMode(null);
      setStartTopic("");
      toast({ title: "Session started" });
    },
    onError: (err: Error) => toast({ title: "Could not start session", description: err.message, variant: "destructive" }),
  });

  function openStartSession(session: TeacherClassSessionOut) {
    setStartSession(session);
    setTopicAttendanceSession(null);
    setTopicMode("start");
    setStartTopic(session.topic_title?.trim() ?? "");
  }

  function openEditTodayTopic(session: TeacherClassSessionOut) {
    setStartSession(session);
    setTopicAttendanceSession(null);
    setTopicMode("edit-today");
    setStartTopic(session.topic_title?.trim() ?? "");
  }

  function openEditAttendanceTopic(session: TeacherAttendanceSessionOut) {
    setStartSession(null);
    setTopicAttendanceSession(session);
    setTopicMode("edit-attendance");
    setStartTopic(session.topic_title?.trim() ?? "");
  }

  const topicMutation = useMutation({
    mutationFn: ({ topic }: { topic: string }) => {
      if (topicMode === "edit-today" && startSession) return materialApi.updateSessionTopic(startSession.id, { topic_title: topic });
      if (topicMode === "edit-attendance" && topicAttendanceSession) return attendanceApi.updateTopic(topicAttendanceSession.timetable_entry_id, { topic_title: topic });
      throw new Error("No session selected");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-today-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-session"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-material-overview"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignment-overview"] });
      setStartSession(null);
      setTopicAttendanceSession(null);
      setTopicMode(null);
      setStartTopic("");
      toast({ title: "Topic saved" });
    },
    onError: (err: Error) => toast({ title: "Topic save failed", description: err.message, variant: "destructive" }),
  });

  function submitTopicForm() {
    const topic = startTopic.trim();
    if (!topic) {
      toast({ title: "Topic is required before starting attendance.", variant: "destructive" });
      return;
    }
    if (topicMode === "start" && startSession) startMutation.mutate({ sessionId: startSession.id, topic });
    else topicMutation.mutate({ topic });
  }

  if (isLoading) return <LoadingState label="Loading attendance filters..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Select the timetable session before marking attendance" />

      <section className="rounded-lg border bg-card p-4 shadow-card">
        <div className="mb-3">
          <h3 className="font-semibold">Today's Sessions</h3>
          <p className="text-sm text-muted-foreground">Start or mark attendance for today's real scheduled classes.</p>
        </div>
        {todaySessions.length === 0 ? <EmptyState label="No teaching sessions scheduled for today." /> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {todaySessions.map((session) => (
              <article key={session.id} className="rounded-lg border bg-background p-4">
                <div className="space-y-1">
                  <p className="font-semibold">{session.course_code} - {session.course_name}</p>
                  <p className="text-sm text-muted-foreground">{session.start_time}-{session.end_time} · {session.room ?? "Room not assigned"}</p>
                  <p className="text-sm"><span className="font-medium">Topic:</span> {session.topic_title?.trim() || "Topic not entered yet"}</p>
                  <p className="text-xs text-muted-foreground">{session.students_count ?? 0} approved student(s)</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => openStartSession(session)} disabled={startMutation.isPending || session.status === "started"}>Start Session</Button>
                  <Button size="sm" variant="outline" onClick={() => openEditTodayTopic(session)}>{session.topic_title?.trim() ? "Edit Topic" : "Add Topic"}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setOfferingId(session.course_offering_id); setWeekNumber(session.week_number); if (session.timetable_entry_id) setSessionId(session.timetable_entry_id); }}>Mark Attendance</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-lg border bg-card p-4 shadow-card md:grid-cols-2 xl:grid-cols-6">
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={facultyId ?? ""} onChange={(e) => { setFacultyId(e.target.value ? Number(e.target.value) : null); setProgramStudyLevel(""); setAcademicYearSemester(""); setOfferingId(""); setWeekNumber(0); setSessionId(""); }}>
          <option value="">Faculty</option>
          {filters?.faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={programStudyLevel} onChange={(e) => { setProgramStudyLevel(e.target.value); setAcademicYearSemester(""); setOfferingId(""); setWeekNumber(0); setSessionId(""); }} disabled={!facultyId}>
          <option value="">Program & Study Level</option>
          {programStudyOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={academicYearSemester} onChange={(e) => { setAcademicYearSemester(e.target.value); setOfferingId(""); setWeekNumber(0); setSessionId(""); }} disabled={!programStudyLevel}>
          <option value="">{termsLoading ? "Loading terms..." : "Academic Year & Semester"}</option>
          {terms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={offeringId} onChange={(e) => { setOfferingId(e.target.value ? Number(e.target.value) : ""); setWeekNumber(0); setSessionId(""); }} disabled={!academicYearSemester}>
          <option value="">Course / Subject</option>
          {courses.map((item) => <option key={item.course_offering_id} value={item.course_offering_id}>{item.course_code} - {item.course_name}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={weekNumber || ""} onChange={(e) => { setWeekNumber(Number(e.target.value)); setSessionId(""); }} disabled={!offeringId}>
          <option value="">Week</option>
          {weeks.map((week) => <option key={week.week_id} value={week.week_number}>{week.name}: {week.start_date} - {week.end_date}</option>)}
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={sessionId} onChange={(e) => setSessionId(e.target.value ? Number(e.target.value) : "")} disabled={!offeringId || !weekNumber}>
          <option value="">Topic / Class Session</option>
          {visibleSessions.map((session) => <option key={session.id} value={session.id}>{formatDate(session.timetable_date)}, {session.start_time}-{session.end_time}</option>)}
        </select>
      </section>

      {selectedSession && (
        <section className="rounded-lg border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{selectedSession.course_code} - {selectedSession.course_name}</p>
              <p className="text-sm text-muted-foreground">{formatDate(selectedSession.timetable_date)} · {selectedSession.start_time}-{selectedSession.end_time} · Building: {selectedSession.building_code ?? "Not assigned"} · {roomLabel(selectedSession)}</p>
              <p className="mt-1 text-sm"><span className="font-medium">Topic:</span> {selectedSession.topic_title?.trim() || "Topic not entered yet"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => openEditAttendanceTopic(selectedSession)}>{selectedSession.topic_title?.trim() ? "Edit Topic" : "Add Topic"}</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={locked || saveMutation.isPending || !detail}>Save Attendance</Button>
            </div>
          </div>
          {locked && <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{selectedSession.locked_message ?? "Attendance can only be marked on the actual session date."}</p>}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["present", "absent", "late", "excused"] as AttStatus[]).map((status) => (
          <div key={status} className={`rounded-lg border bg-card p-4 text-center shadow-card ${!selectedSession ? "opacity-50" : ""}`}>
            <p className="text-2xl font-bold">{selectedSession ? summary[status] : 0}</p>
            <StatusBadge variant={status === "present" ? "success" : status === "absent" ? "danger" : status === "late" ? "warning" : "info"}>{status}</StatusBadge>
          </div>
        ))}
      </div>

      {offeringId && weekNumber && visibleSessions.length === 0 && <EmptyState label="No scheduled topics found for this week." />}

      {!selectedSession ? <EmptyState label="Select filters to load data." /> : loadingDetail ? <LoadingState label="Loading students..." /> : detail?.students.length === 0 ? <EmptyState label="No students approved for this course." /> : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>{["Student", "Code", "Status", "Actions"].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {detail?.students.map((student) => {
                const status = attendance[student.student_id];
                return (
                  <tr key={student.student_id}>
                    <td className="px-4 py-3 text-sm font-medium">{student.first_name} {student.last_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{student.student_code}</td>
                    <td className="px-4 py-3"><StatusBadge variant={status === "present" ? "success" : status === "absent" ? "danger" : status === "late" ? "warning" : "info"}>{status ?? "Not marked"}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ACTIONS.map(({ status: next, label, icon: Icon, variant }) => (
                          <button key={next} title={`Mark ${label}`} aria-label={`Mark ${label}`} disabled={locked} onClick={() => setAttendance((prev) => ({ ...prev, [student.student_id]: next }))} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variant}`}>
                            <Icon className="h-3.5 w-3.5" /> {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {topicMode && (startSession || topicAttendanceSession) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg">
            <h3 className="font-semibold">{topicMode === "start" ? "Start Attendance Session" : "Edit Topic"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{(startSession ?? topicAttendanceSession)?.course_code} - {(startSession ?? topicAttendanceSession)?.course_name} · {(startSession ?? topicAttendanceSession)?.start_time}-{(startSession ?? topicAttendanceSession)?.end_time}</p>
            <label className="mt-4 block space-y-1.5 text-sm">
              <span className="font-medium">Teaching topic</span>
              <Input value={startTopic} onChange={(event) => setStartTopic(event.target.value)} placeholder="Database normalization and ERD review" autoFocus />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">One topic is shared by Attendance, Materials, and Assignments for this course week.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setStartSession(null); setTopicAttendanceSession(null); setTopicMode(null); }}>Cancel</Button>
              <Button type="button" onClick={submitTopicForm} disabled={startMutation.isPending || topicMutation.isPending || !startTopic.trim()}>{startMutation.isPending || topicMutation.isPending ? "Saving..." : topicMode === "start" ? "Start Session" : "Save Topic"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
