import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, TrendingDown, ShieldAlert, Activity, BookX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/academic/AcademicShared";
import {
  studentsApi, gradesApi, attendanceApi, offeringsApi, progressionApi,
} from "@/lib/api";
import { gpaScale, gpaSeverity } from "@/lib/utils";

const ABSENCE_WARN = 10;
const ABSENCE_CRITICAL = 15;

type Severity = "ok" | "warn" | "critical";

interface RiskFinding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  hint?: string;
}

export default function RiskWarning() {
  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ["student-me"], queryFn: studentsApi.me });
  const { data: grades = [], isLoading: gradesLoading } = useQuery({ queryKey: ["grades-me"], queryFn: gradesApi.my });
  const { data: attendance = [], isLoading: attLoading } = useQuery({ queryKey: ["student-attendance"], queryFn: attendanceApi.studentGrouped });
  const { data: courses = [], isLoading: coursesLoading } = useQuery({ queryKey: ["student-my-courses"], queryFn: offeringsApi.studentMyCourses });
  const { data: progression } = useQuery({ queryKey: ["student-progression"], queryFn: progressionApi.me });

  const isLoading = profileLoading || gradesLoading || attLoading || coursesLoading;
  if (isLoading) return <LoadingState label="Computing your academic risk profile..." />;

  const gpa = Number(profile?.gpa ?? 0);
  const { warn: GPA_WARN, critical: GPA_CRITICAL, scale: GPA_SCALE } = gpaScale(gpa);
  const gpaSev = gpaSeverity(gpa);
  const findings: RiskFinding[] = [];

  if (gpaSev === "critical") {
    findings.push({
      id: "gpa",
      severity: "critical",
      title: "GPA below academic standing",
      detail: `Your cumulative GPA is ${gpa.toFixed(2)} (threshold: ${GPA_CRITICAL.toFixed(2)} on a ${GPA_SCALE}-point scale).`,
      hint: "Speak to your academic advisor about a recovery plan and tutoring options.",
    });
  } else if (gpaSev === "warn") {
    findings.push({
      id: "gpa",
      severity: "warn",
      title: "GPA approaching warning zone",
      detail: `Your cumulative GPA is ${gpa.toFixed(2)} (warning threshold: ${GPA_WARN.toFixed(2)} on a ${GPA_SCALE}-point scale).`,
      hint: "Aim to lift it next term — consider extra study groups or office hours.",
    });
  }

  // Per-course attendance
  const courseStats = new Map<number, { code: string; name: string; present: number; absent: number; late: number; total: number }>();
  for (const rec of attendance) {
    if (!rec.course_offering_id) continue;
    const cur = courseStats.get(rec.course_offering_id) ?? {
      code: rec.course_code ?? "—",
      name: rec.course_name ?? `Offering #${rec.course_offering_id}`,
      present: 0, absent: 0, late: 0, total: 0,
    };
    cur.total += 1;
    if (rec.status === "present") cur.present += 1;
    else if (rec.status === "absent") cur.absent += 1;
    else if (rec.status === "late") cur.late += 1;
    courseStats.set(rec.course_offering_id, cur);
  }

  const attendanceRows = [...courseStats.entries()].map(([offeringId, stat]) => {
    const rate = stat.total > 0 ? (stat.absent / stat.total) * 100 : 0;
    const severity: Severity = rate >= ABSENCE_CRITICAL ? "critical" : rate >= ABSENCE_WARN ? "warn" : "ok";
    return { offeringId, ...stat, rate, severity };
  });

  attendanceRows
    .filter((row) => row.severity !== "ok")
    .forEach((row) => {
      findings.push({
        id: `att-${row.offeringId}`,
        severity: row.severity,
        title: `${row.code} — ${row.severity === "critical" ? "absence over 15%" : "absences building up"}`,
        detail: `${row.absent} absent of ${row.total} sessions (${row.rate.toFixed(1)}%).`,
        hint: row.severity === "critical"
          ? "You may lose exam eligibility for this course. Contact the instructor immediately."
          : "Keep attendance up to stay clear of the 15% exam-block threshold.",
      });
    });

  // Failed/at-risk grades
  const failedGrades = grades.filter((g) => g.pass_status === "failed" || g.exam_blocked_due_to_absence);
  failedGrades.forEach((g) => {
    findings.push({
      id: `grade-${g.id}`,
      severity: "critical",
      title: `${g.course_code ?? `Registration #${g.registration_id}`} — failed`,
      detail: g.exam_blocked_due_to_absence
        ? "Exam blocked due to absences over 15%."
        : g.failure_reason ?? `Final grade: ${g.final_grade ?? "—"}.`,
      hint: g.retake_allowed_next_academic_year
        ? "Retake is allowed in the next academic year."
        : "Discuss your options with the academic office.",
    });
  });

  // Low-grade warnings (course grades use 0-10 scale per Albanian convention)
  grades
    .filter((g) => !failedGrades.includes(g) && g.final_grade !== null && g.final_grade < 6)
    .forEach((g) => {
      findings.push({
        id: `low-${g.id}`,
        severity: "warn",
        title: `${g.course_code ?? `Registration #${g.registration_id}`} — borderline grade`,
        detail: `Final grade: ${g.final_grade}. Recovery still possible.`,
      });
    });

  // Progression
  if (progression && !progression.can_progress_to_next_year && !progression.graduation_eligible) {
    findings.push({
      id: "progression",
      severity: "warn",
      title: "Year progression at risk",
      detail: progression.message || `You've passed ${progression.total_passed_credits} of ${progression.required_for_next_year} required credits.`,
      hint: "Pass enough credits this semester to advance to the next academic year.",
    });
  }

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warnCount = findings.filter((f) => f.severity === "warn").length;
  const overall: Severity = criticalCount > 0 ? "critical" : warnCount > 0 ? "warn" : "ok";

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Warning" description="Live snapshot of your academic standing" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border p-6 shadow-card ${
          overall === "critical" ? "bg-gradient-to-br from-destructive/15 via-card to-card"
          : overall === "warn" ? "bg-gradient-to-br from-warning/15 via-card to-card"
          : "bg-gradient-to-br from-success/15 via-card to-card"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${
              overall === "critical" ? "bg-destructive/20 text-destructive"
              : overall === "warn" ? "bg-warning/20 text-warning"
              : "bg-success/20 text-success"
            }`}>
              {overall === "ok" ? <CheckCircle2 className="h-7 w-7" /> : overall === "warn" ? <AlertTriangle className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {overall === "ok" ? "You're on track" : overall === "warn" ? "Some areas need attention" : "Action required"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {overall === "ok"
                  ? "No academic risk indicators above the warning threshold."
                  : `${criticalCount} critical and ${warnCount} warning ${(criticalCount + warnCount) === 1 ? "indicator" : "indicators"} detected.`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Pill tone="critical" count={criticalCount} label="Critical" />
            <Pill tone="warn" count={warnCount} label="Warnings" />
            <Pill tone="ok" count={attendanceRows.length - attendanceRows.filter(r => r.severity !== "ok").length} label="OK courses" />
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RiskMetric
          icon={TrendingDown}
          label="Cumulative GPA"
          value={gpa.toFixed(2)}
          severity={gpaSev}
          threshold={`Warn ${GPA_WARN.toFixed(2)} · Fail ${GPA_CRITICAL.toFixed(2)} (${GPA_SCALE}-pt)`}
        />
        <RiskMetric
          icon={Activity}
          label="Overall attendance"
          value={`${attendance.length ? Math.round((attendance.filter(a => a.status === "present").length / attendance.length) * 100) : 0}%`}
          severity={(() => {
            const total = attendance.length;
            if (!total) return "ok";
            const absRate = (attendance.filter(a => a.status === "absent").length / total) * 100;
            return absRate >= ABSENCE_CRITICAL ? "critical" : absRate >= ABSENCE_WARN ? "warn" : "ok";
          })()}
          threshold={`Absence cap ${ABSENCE_CRITICAL}%`}
        />
        <RiskMetric
          icon={BookX}
          label="Failed / blocked courses"
          value={String(failedGrades.length)}
          severity={failedGrades.length > 0 ? "critical" : "ok"}
          threshold={`${courses.length} enrolled`}
        />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 font-semibold text-foreground">Attendance by course</h3>
        {attendanceRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          <div className="space-y-3">
            {attendanceRows.map((row) => (
              <div key={row.offeringId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row.code} — {row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.absent} absent · {row.late} late · {row.present} present of {row.total}
                    </p>
                  </div>
                  <StatusBadge variant={row.severity === "critical" ? "danger" : row.severity === "warn" ? "warning" : "success"}>
                    {row.rate.toFixed(1)}%
                  </StatusBadge>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${
                    row.severity === "critical" ? "bg-destructive"
                    : row.severity === "warn" ? "bg-warning"
                    : "bg-success"
                  }`} style={{ width: `${Math.min(100, row.rate)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-foreground">Findings</h3>
        {findings.length === 0 ? (
          <div className="rounded-xl border bg-success/5 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 text-sm font-medium text-foreground">Nothing to flag right now.</p>
            <p className="mt-1 text-xs text-muted-foreground">Keep up the steady attendance and grades.</p>
          </div>
        ) : (
          findings.map((f, i) => (
            <motion.article
              key={f.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border-l-4 bg-card p-4 shadow-card ${
                f.severity === "critical" ? "border-l-destructive" : "border-l-warning"
              }`}
            >
              <div className="flex items-start gap-3">
                {f.severity === "critical"
                  ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                  {f.hint && <p className="mt-2 text-xs text-foreground/80"><span className="font-medium">Suggestion: </span>{f.hint}</p>}
                </div>
              </div>
            </motion.article>
          ))
        )}
      </section>
    </div>
  );
}

function RiskMetric({ icon: Icon, label, value, severity, threshold }: {
  icon: React.ElementType; label: string; value: string; severity: Severity; threshold: string;
}) {
  const accent = severity === "critical" ? "from-destructive/15 to-destructive/5 text-destructive"
    : severity === "warn" ? "from-warning/15 to-warning/5 text-warning"
    : "from-success/15 to-success/5 text-success";
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${accent} p-5 shadow-card`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{threshold}</p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Pill({ tone, count, label }: { tone: Severity; count: number; label: string }) {
  const cls = tone === "critical" ? "bg-destructive/15 text-destructive"
    : tone === "warn" ? "bg-warning/15 text-warning"
    : "bg-success/15 text-success";
  return (
    <div className={`rounded-lg p-2 ${cls}`}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px] uppercase tracking-wide">{label}</p>
    </div>
  );
}
