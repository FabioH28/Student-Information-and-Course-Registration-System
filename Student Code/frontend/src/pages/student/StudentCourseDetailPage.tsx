import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, FileText, GraduationCap, Users } from "lucide-react";

import { DownloadButton, EmptyState, ErrorState, FileTypeBadge, LoadingState, MaterialViewButton, WeekSelector, WeeklyTopicCard } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { assignmentsApi, attendanceApi, gradesApi, materialApi, offeringsApi } from "@/lib/api";
import { useState } from "react";

type Tab = "materials" | "assignments" | "attendance" | "grades";

function tabFromSearch(value: string | null): Tab {
  return value === "assignments" || value === "attendance" || value === "grades" ? value : "materials";
}

export default function StudentCourseDetailPage() {
  const { courseOfferingId } = useParams();
  const offeringId = Number(courseOfferingId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabFromSearch(searchParams.get("tab"));
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["student-course-offering", offeringId],
    queryFn: () => offeringsApi.studentCourseOffering(offeringId),
    enabled: Number.isFinite(offeringId),
  });

  if (isLoading) return <LoadingState label="Loading course..." />;
  if (error || !course) return <ErrorState message={(error as Error)?.message ?? "Course not found"} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={course.course_name} description={`${course.course_code} - ${course.teacher_name ?? "Instructor"}`}>
        <Button variant="outline" size="sm" onClick={() => navigate("/student/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
      </PageHeader>

      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Faculty</p><p className="font-medium">{course.faculty_name}</p></div>
          <div><p className="text-xs text-muted-foreground">Program</p><p className="font-medium">{course.degree_name}</p></div>
          <div><p className="text-xs text-muted-foreground">Year / Group</p><p className="font-medium">{course.academic_year} - {course.group_name}</p></div>
          <div><p className="text-xs text-muted-foreground">Schedule</p><p className="font-medium">{course.schedule_summary}</p></div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "materials", label: "Materials", icon: FileText },
          { key: "assignments", label: "Assignments", icon: ClipboardList },
          { key: "attendance", label: "Attendance", icon: Users },
          { key: "grades", label: "Grades", icon: GraduationCap },
        ].map(({ key, label, icon: Icon }) => (
          <Button key={key} variant={tab === key ? "default" : "outline"} onClick={() => setSearchParams({ tab: key })}>
            <Icon className="mr-2 h-4 w-4" />{label}
          </Button>
        ))}
      </div>

      {tab === "materials" && <StudentMaterialsTab offeringId={offeringId} />}
      {tab === "assignments" && <StudentAssignmentsTab offeringId={offeringId} />}
      {tab === "attendance" && <StudentAttendanceTab offeringId={offeringId} />}
      {tab === "grades" && <StudentGradesTab offeringId={offeringId} />}
    </div>
  );
}

function StudentMaterialsTab({ offeringId }: { offeringId: number }) {
  const [week, setWeek] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-week-materials", offeringId, week],
    queryFn: () => materialApi.studentWeek(offeringId, week),
  });

  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Materials</h3>
          <p className="text-sm text-muted-foreground">Published weekly materials for this enrolled course</p>
        </div>
        <div className="w-40"><WeekSelector value={week} onChange={setWeek} /></div>
      </div>
      <div className="space-y-4 p-5">
        {isLoading ? <LoadingState label="Loading materials..." /> : error ? <ErrorState message={(error as Error).message} /> : (
          <>
          <WeeklyTopicCard week={week} topic={data?.topic} />
          {data?.materials.length ? data.materials.map((material) => (
          <article key={material.id} className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium">{material.title}</h4>
                  <FileTypeBadge material={material} />
                </div>
                <p className="text-xs text-muted-foreground">Teacher: {material.teacher_name ?? "Instructor"} - Uploaded {new Date(material.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MaterialViewButton material={material} url={materialApi.viewUrl(material.id)} />
                {material.material_kind === "file" && <DownloadButton url={materialApi.downloadUrl(material.id)} />}
              </div>
            </div>
          </article>
          )) : <EmptyState label={`No published materials for Week ${week}.`} />}
          </>
        )}
      </div>
    </section>
  );
}

function StudentAssignmentsTab({ offeringId }: { offeringId: number }) {
  const [week, setWeek] = useState(1);
  const { data: topic } = useQuery({ queryKey: ["student-topic", offeringId, week], queryFn: () => materialApi.getStudentTopic(offeringId, week) });
  const { data: assignments = [], isLoading, error } = useQuery({ queryKey: ["student-assignments", offeringId, week], queryFn: () => assignmentsApi.studentList(offeringId, week) });
  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold">Assignments</h3><p className="text-sm text-muted-foreground">Published assignments for this enrolled course</p></div>
        <div className="w-40"><WeekSelector value={week} onChange={setWeek} /></div>
      </div>
      <div className="space-y-4 p-5">
        <WeeklyTopicCard week={week} topic={topic} />
        {isLoading ? <LoadingState label="Loading assignments..." /> : error ? <ErrorState message={(error as Error).message} /> : assignments.length === 0 ? <EmptyState label={`No published assignments for Week ${week}.`} /> : assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-lg border bg-background p-4">
            <div className="space-y-2">
              <h4 className="font-medium">{assignment.title}</h4>
              {assignment.description && <p className="text-sm text-muted-foreground">{assignment.description}</p>}
              {assignment.instructions && <p className="text-sm text-muted-foreground">{assignment.instructions}</p>}
              <p className="text-xs text-muted-foreground">Due {assignment.due_date ?? "-"} {assignment.due_time ?? ""} - {assignment.max_points}/100 max</p>
              {assignment.attachment_original_name && <p className="text-xs text-muted-foreground">Attachment: {assignment.attachment_original_name}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudentAttendanceTab({ offeringId }: { offeringId: number }) {
  const { data: records = [], isLoading } = useQuery({ queryKey: ["attendance-me", offeringId], queryFn: () => attendanceApi.my(offeringId) });
  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="border-b p-5"><h3 className="font-semibold">Attendance</h3><p className="text-sm text-muted-foreground">Only your records for this course</p></div>
      {isLoading ? <LoadingState label="Loading attendance..." /> : records.length === 0 ? <div className="p-5"><EmptyState label="No attendance records yet." /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/30">{["Date", "Week", "Status", "Notes"].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>)}</tr></thead>
            <tbody className="divide-y">{records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-sm">{record.session_date}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{record.week_number ?? "-"}</td>
                <td className="px-4 py-3"><StatusBadge variant={record.status === "present" ? "success" : record.status === "absent" ? "danger" : record.status === "late" ? "warning" : "info"}>{record.status}</StatusBadge></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{record.notes ?? "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StudentGradesTab({ offeringId }: { offeringId: number }) {
  const { data: grades = [], isLoading } = useQuery({ queryKey: ["student-course-grades", offeringId], queryFn: () => gradesApi.myCourse(offeringId) });
  return (
    <section className="rounded-lg border bg-card shadow-card">
      <div className="border-b p-5"><h3 className="font-semibold">Grades</h3><p className="text-sm text-muted-foreground">Only your published grade for this course</p></div>
      <div className="p-5">
        {isLoading ? <LoadingState label="Loading grades..." /> : grades.length === 0 ? <EmptyState label="No published grades for this course yet." /> : grades.map((grade) => (
          <div key={grade.id} className="grid gap-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-7">
            <div><p className="text-xs text-muted-foreground">Midterm /15</p><p className="font-medium">{grade.midterm_score ?? "-"}</p></div>
            <div><p className="text-xs text-muted-foreground">Project /15</p><p className="font-medium">{grade.project_score ?? "-"}</p></div>
            <div><p className="text-xs text-muted-foreground">Quiz /10</p><p className="font-medium">{grade.quiz_score ?? "-"}</p></div>
            <div><p className="text-xs text-muted-foreground">Final Exam /60</p><p className="font-medium">{grade.final_exam_score ?? "-"}</p></div>
            <div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium">{grade.total_score ?? "-"}</p></div>
            <div><p className="text-xs text-muted-foreground">Final Grade</p><StatusBadge variant={grade.pass_status === "failed" ? "danger" : "success"}>{grade.final_grade ?? "-"}</StatusBadge></div>
            <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{grade.pass_status ?? "-"}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
