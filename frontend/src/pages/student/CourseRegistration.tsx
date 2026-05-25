import { motion } from "framer-motion";
import {
  CheckCircle2, Trash2, Calendar as CalendarIcon, ArrowRight,
  AlertTriangle, Clock, Info,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  registrationsApi, offeringsApi, coursesApi, semestersApi, CourseOut,
} from "@/lib/api";

const CREDIT_LIMIT = 30;
const MIN_FULL_TIME_CREDITS = 12;

function daysBetween(target: string) {
  const t = new Date(target + "T23:59:59").getTime();
  const now = Date.now();
  return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
}

export default function CourseRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: semesters = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: semestersApi.list,
    retry: false,
  });
  const activeSemester = useMemo(() => {
    if (!semesters.length) return null;
    return semesters.find((s) => s.is_active) ?? semesters[semesters.length - 1];
  }, [semesters]);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["registrations-me"],
    queryFn: registrationsApi.my,
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["offerings", "all"],
    queryFn: () => offeringsApi.list(),
  });

  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.list });

  const courseMap = Object.fromEntries(courses.map((c: CourseOut) => [c.id, c]));
  const offeringMap = Object.fromEntries(offerings.map((o) => [o.id, o]));

  const activeRegs = registrations.filter((r) => r.status === "active");

  // Drop deadline rules
  const dropDeadline = activeSemester?.drop_deadline ?? null;
  const daysUntilDrop = dropDeadline ? daysBetween(dropDeadline) : null;
  const dropsClosed = daysUntilDrop !== null && daysUntilDrop < 0;
  const dropsClosingSoon = daysUntilDrop !== null && daysUntilDrop >= 0 && daysUntilDrop <= 7;

  const [dropTarget, setDropTarget] = useState<{ id: number; courseName: string; courseCode: string } | null>(null);

  const dropMutation = useMutation({
    mutationFn: (id: number) => registrationsApi.drop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations-me"] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      toast({ title: "Course dropped", description: dropTarget ? `${dropTarget.courseCode} — ${dropTarget.courseName} removed.` : undefined });
      setDropTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Drop failed", description: err.message, variant: "destructive" });
      setDropTarget(null);
    },
  });

  const totalCredits = activeRegs.reduce((sum, r) => {
    const offering = offeringMap[r.offering_id];
    const course = offering ? courseMap[offering.course_id] : null;
    return sum + (course?.credits ?? 3);
  }, 0);
  const wouldDropBelowFullTime = dropTarget
    ? totalCredits - (() => {
        const reg = registrations.find((r) => r.id === dropTarget.id);
        const off = reg ? offeringMap[reg.offering_id] : null;
        const c = off ? courseMap[off.course_id] : null;
        return c?.credits ?? 3;
      })() < MIN_FULL_TIME_CREDITS
    : false;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading registrations…</div>;
  }

  const semesterLabel = activeSemester?.name ?? "Current semester";

  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description={`Manage your course enrollment for ${semesterLabel}`} />

      {/* Period rule banner */}
      {dropDeadline && (
        dropsClosed ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Drop period closed</p>
              <p className="text-xs text-muted-foreground">
                The drop deadline ({dropDeadline}) has passed. Courses can no longer be dropped from this page — contact academic staff if you need to withdraw.
              </p>
            </div>
          </div>
        ) : dropsClosingSoon ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Drop deadline approaching</p>
              <p className="text-xs text-muted-foreground">
                You have <strong>{daysUntilDrop} day{daysUntilDrop === 1 ? "" : "s"}</strong> left to drop courses without penalty (until {dropDeadline}).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="text-foreground">
                <strong>{daysUntilDrop} days</strong> left to drop courses (deadline {dropDeadline}). After that you'll need to submit a withdrawal request to academic staff.
              </p>
            </div>
          </div>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Registered Courses</h3>
                <p className="text-xs text-muted-foreground">{activeRegs.length} active enrollment{activeRegs.length === 1 ? "" : "s"}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/student/available-subjects")}>
                Browse subjects <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            {activeRegs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No active registrations. Open <button className="font-medium text-primary hover:underline" onClick={() => navigate("/student/available-subjects")}>Available Subjects</button> to request enrollment.
              </div>
            ) : (
              <div className="space-y-3">
                {activeRegs.map((reg, i) => {
                  const offering = offeringMap[reg.offering_id];
                  const course = offering ? courseMap[offering.course_id] : null;
                  const courseName = course?.name ?? `Course #${offering?.course_id ?? "?"}`;
                  const courseCode = course?.code ?? `Offering #${reg.offering_id}`;
                  return (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{courseName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {courseCode} · {course?.credits ?? "?"} credits · {offering?.schedule ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge variant="success">Active</StatusBadge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                          onClick={() => setDropTarget({ id: reg.id, courseName, courseCode })}
                          disabled={dropMutation.isPending || dropsClosed}
                          title={dropsClosed ? "Drop period has closed" : "Drop this course"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-foreground">Workload Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Courses</span>
                <span className="font-semibold text-foreground">{activeRegs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Credits</span>
                <span className={`font-semibold ${totalCredits < MIN_FULL_TIME_CREDITS ? "text-warning" : "text-foreground"}`}>{totalCredits}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalCredits > CREDIT_LIMIT ? "bg-destructive"
                    : totalCredits < MIN_FULL_TIME_CREDITS ? "bg-warning"
                    : "bg-primary"
                  }`}
                  style={{ width: `${Math.min((totalCredits / CREDIT_LIMIT) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Full-time: {MIN_FULL_TIME_CREDITS}–{CREDIT_LIMIT} credits per semester.
                {totalCredits < MIN_FULL_TIME_CREDITS && <span className="ml-1 text-warning">Below full-time threshold.</span>}
                {totalCredits > CREDIT_LIMIT && <span className="ml-1 text-destructive">Over semester limit.</span>}
              </p>
            </div>
          </div>

          {activeSemester && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" /> Semester Rules
              </h3>
              <dl className="space-y-2 text-sm">
                <Row label="Semester" value={activeSemester.name} />
                <Row label="Starts" value={activeSemester.start_date} />
                <Row label="Ends" value={activeSemester.end_date} />
                <Row label="Registration deadline" value={activeSemester.registration_deadline} />
                {dropDeadline && (
                  <Row label="Drop deadline" value={
                    <span className={dropsClosed ? "text-destructive" : dropsClosingSoon ? "text-warning" : "text-foreground"}>
                      {dropDeadline}{daysUntilDrop !== null && !dropsClosed && ` (${daysUntilDrop}d left)`}
                    </span>
                  } />
                )}
                <Row label="Credit range" value={`${MIN_FULL_TIME_CREDITS}–${CREDIT_LIMIT} cr / semester`} />
              </dl>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-success/20 bg-success/5 p-4"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">{activeRegs.length} Course{activeRegs.length !== 1 ? "s" : ""} Active</p>
                <p className="text-xs text-muted-foreground">Your current registrations for this semester.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ConfirmDialog
        open={dropTarget !== null}
        destructive
        title="Drop this course?"
        confirmLabel="Yes, drop course"
        cancelLabel="Keep enrolled"
        loading={dropMutation.isPending}
        description={dropTarget && (
          <div className="space-y-2">
            <p>
              You're about to drop <strong className="text-foreground">{dropTarget.courseCode} — {dropTarget.courseName}</strong>.
            </p>
            <ul className="ml-4 list-disc text-xs">
              <li>You'll lose access to this course's materials, attendance and grades.</li>
              <li>If you change your mind you can re-register <strong>before {dropDeadline ?? "the deadline"}</strong>.</li>
              {wouldDropBelowFullTime && (
                <li className="text-warning">
                  This will put you below the full-time threshold ({MIN_FULL_TIME_CREDITS} credits). You may lose your full-time student status.
                </li>
              )}
            </ul>
          </div>
        )}
        onConfirm={() => dropTarget && dropMutation.mutate(dropTarget.id)}
        onCancel={() => setDropTarget(null)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
