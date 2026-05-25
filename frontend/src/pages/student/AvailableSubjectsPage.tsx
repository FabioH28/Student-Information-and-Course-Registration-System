import { useMemo } from "react";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, LoadingState } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { courseSelectionApi, semestersApi } from "@/lib/api";

function daysBetween(target: string) {
  const t = new Date(target + "T23:59:59").getTime();
  const now = Date.now();
  return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
}

export default function AvailableSubjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({ queryKey: ["available-subjects"], queryFn: courseSelectionApi.available });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list, retry: false });

  const activeSemester = useMemo(() =>
    semesters.find((s) => s.is_active) ?? semesters[semesters.length - 1] ?? null,
  [semesters]);

  const regDeadline = activeSemester?.registration_deadline ?? null;
  const daysLeft = regDeadline ? daysBetween(regDeadline) : null;
  const registrationClosed = daysLeft !== null && daysLeft < 0;
  const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const selectMutation = useMutation({
    mutationFn: courseSelectionApi.select,
    onSuccess: (result, offeringId) => {
      queryClient.invalidateQueries({ queryKey: ["available-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["course-selections"] });
      const subject = data.find((s) => s.course_offering_id === offeringId);
      toast({
        title: result.success ? "Subject request submitted" : "Selection blocked",
        description: result.message || (result.success
          ? `${subject?.course_code ?? "Subject"} — academic staff will review and approve.`
          : "The system blocked this selection. See the reason on the card."),
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (err: Error) => toast({ title: "Selection failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Available Subjects" description="Choose from scheduled subjects allowed for your program and year" />

      {/* Registration period rules */}
      {regDeadline && (
        registrationClosed ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Registration period closed</p>
              <p className="text-xs text-muted-foreground">
                The registration deadline ({regDeadline}) has passed. Late registration must go through academic staff.
              </p>
            </div>
          </div>
        ) : closingSoon ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Registration deadline approaching</p>
              <p className="text-xs text-muted-foreground">
                You have <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong> left to request subjects for {activeSemester?.name} (deadline {regDeadline}).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm text-foreground">
              <strong>{daysLeft} days</strong> left to request subjects for {activeSemester?.name} (deadline {regDeadline}).
              Submitted requests go to academic staff for approval.
            </div>
          </div>
        )
      )}

      {isLoading ? <LoadingState label="Loading subjects..." /> : data.length === 0 ? <EmptyState label="No available subjects found." /> : (
        <div className="grid gap-3">
          {data.map((subject) => {
            const disabled = !subject.can_select || selectMutation.isPending || registrationClosed;
            return (
              <article key={subject.course_offering_id} className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{subject.course_code} - {subject.course_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {subject.academic_period} - {subject.academic_year} - {subject.credits ?? "?"} credits - Seats {subject.enrolled}/{subject.capacity}
                    </p>
                    {subject.blocked_reason && <p className="mt-1 text-sm text-destructive">{subject.blocked_reason}</p>}
                    {registrationClosed && subject.can_select && (
                      <p className="mt-1 text-sm text-destructive">Registration period has ended — contact academic staff for late enrollment.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={subject.can_select && !registrationClosed ? "success" : "danger"}>
                      {registrationClosed ? "Closed" : subject.can_select ? "Allowed" : "Blocked"}
                    </StatusBadge>
                    <Button
                      size="sm"
                      disabled={disabled}
                      onClick={() => selectMutation.mutate(subject.course_offering_id)}
                      title={registrationClosed ? "Registration period has ended" : ""}
                    >
                      {selectMutation.isPending ? "Sending..." : "Request"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
