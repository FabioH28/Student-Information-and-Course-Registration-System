import { motion } from "framer-motion";
import { CheckCircle2, Trash2, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  registrationsApi, offeringsApi, coursesApi, semestersApi, CourseOut,
} from "@/lib/api";

const CREDIT_LIMIT = 30;

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

  const dropMutation = useMutation({
    mutationFn: (id: number) => registrationsApi.drop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations-me"] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      toast({ title: "Course dropped" });
    },
    onError: (err: Error) => toast({ title: "Drop failed", description: err.message, variant: "destructive" }),
  });

  const totalCredits = activeRegs.reduce((sum, r) => {
    const offering = offeringMap[r.offering_id];
    const course = offering ? courseMap[offering.course_id] : null;
    return sum + (course?.credits ?? 3);
  }, 0);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading registrations…</div>;
  }

  const semesterLabel = activeSemester?.name ?? "Current semester";
  const dropDeadline = activeSemester?.drop_deadline;

  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description={`Manage your course enrollment for ${semesterLabel}`} />

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
                  return (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{course?.name ?? `Course #${offering?.course_id ?? "?"}`}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {course?.code ?? `Offering #${reg.offering_id}`} · {course?.credits ?? "?"} credits · {offering?.schedule ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge variant="success">Active</StatusBadge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => dropMutation.mutate(reg.id)}
                          disabled={dropMutation.isPending}
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
                <span className="font-semibold text-foreground">{totalCredits}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalCredits > CREDIT_LIMIT ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min((totalCredits / CREDIT_LIMIT) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Semester limit: {CREDIT_LIMIT} credits</p>
            </div>
          </div>

          {activeSemester && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" /> Semester Info
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Semester</dt>
                  <dd className="font-medium text-foreground">{activeSemester.name}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Starts</dt>
                  <dd className="font-medium text-foreground">{activeSemester.start_date}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Ends</dt>
                  <dd className="font-medium text-foreground">{activeSemester.end_date}</dd>
                </div>
                {dropDeadline && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Drop deadline</dt>
                    <dd className="font-medium text-foreground">{dropDeadline}</dd>
                  </div>
                )}
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
    </div>
  );
}
