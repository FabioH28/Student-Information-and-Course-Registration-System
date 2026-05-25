import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, LoadingState } from "@/components/academic/AcademicShared";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { attendanceApi, registrationsApi } from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function roomLabel(record: { classroom_name?: string | null; lab_name?: string | null; auditorium_name?: string | null }) {
  if (record.lab_name) return `Lab: ${record.lab_name}`;
  if (record.auditorium_name) return `Auditorium: ${record.auditorium_name}`;
  return `Classroom: ${record.classroom_name ?? "Not assigned"}`;
}

export default function AttendanceViewPage() {
  const [offeringId, setOfferingId] = useState<number | undefined>();
  const { data: registrations = [] } = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const { data: records = [], isLoading } = useQuery({ queryKey: ["student-attendance"], queryFn: attendanceApi.studentGrouped });
  const { data: eligibility } = useQuery({
    queryKey: ["exam-eligibility", offeringId],
    queryFn: () => attendanceApi.examEligibility(offeringId!),
    enabled: Boolean(offeringId),
  });

  const courseOptions = useMemo(() => {
    const seen = new Map<number, string>();
    records.forEach((record) => {
      if (record.course_offering_id) seen.set(record.course_offering_id, `${record.course_code} — ${record.course_name}`);
    });
    registrations.forEach((reg) => {
      if (!seen.has(reg.offering_id)) seen.set(reg.offering_id, `Offering #${reg.offering_id}`);
    });
    return [...seen.entries()];
  }, [records, registrations]);

  const visibleRecords = offeringId ? records.filter((record) => record.course_offering_id === offeringId) : records;

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance / Absence" description="Your weekly attendance records" />

      <select value={offeringId ?? ""} onChange={(e) => setOfferingId(e.target.value ? Number(e.target.value) : undefined)} className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="">All enrolled courses</option>
        {courseOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>

      {eligibility && (
        <section className="rounded-lg border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Exam eligibility</p>
              <p className="text-sm text-muted-foreground">Absence percentage: {eligibility.absence_percentage}%</p>
            </div>
            <StatusBadge variant={eligibility.can_take_exam ? "success" : "danger"}>{eligibility.can_take_exam ? "Eligible for exam" : "Not eligible for exam"}</StatusBadge>
          </div>
          {!eligibility.can_take_exam && <p className="mt-2 text-sm text-muted-foreground">Failed due to absences. Retake allowed next academic year.</p>}
        </section>
      )}

      {isLoading ? <LoadingState label="Loading attendance..." /> : visibleRecords.length === 0 ? <EmptyState label="No attendance records yet." /> : (
        <div className="grid gap-3">
          {visibleRecords.map((record) => (
            <article key={record.id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{record.course_code} — {record.course_name}</p>
                  <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <p>Week {record.week_number ?? "-"}</p>
                    <p>Date: {formatDate(record.attendance_date ?? record.session_date)}</p>
                    <p>Time: {record.start_time ?? "-"} – {record.end_time ?? "-"}</p>
                    <p>Building: {record.building_code ?? "Not assigned"}</p>
                    <p>{roomLabel(record)}</p>
                    <p>Notes: {record.notes ?? "-"}</p>
                  </div>
                </div>
                <StatusBadge variant={record.status === "present" ? "success" : record.status === "absent" ? "danger" : record.status === "late" ? "warning" : "info"}>{record.status}</StatusBadge>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
