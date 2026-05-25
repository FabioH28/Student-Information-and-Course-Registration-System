import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, LoadingState } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { courseSelectionApi } from "@/lib/api";

export default function AvailableSubjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data = [], isLoading } = useQuery({ queryKey: ["available-subjects"], queryFn: courseSelectionApi.available });
  const selectMutation = useMutation({
    mutationFn: courseSelectionApi.select,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["available-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["course-selections"] });
      toast({ title: result.success ? "Subject request sent" : "Selection blocked", description: result.message, variant: result.success ? "default" : "destructive" });
    },
    onError: (err: Error) => toast({ title: "Selection failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Available Subjects" description="Choose from scheduled subjects allowed for your program and year" />
      {isLoading ? <LoadingState label="Loading subjects..." /> : data.length === 0 ? <EmptyState label="No available subjects found." /> : (
        <div className="grid gap-3">
          {data.map((subject) => (
            <article key={subject.course_offering_id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{subject.course_code} - {subject.course_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subject.academic_period} - {subject.academic_year} - {subject.credits ?? "?"} credits - Seats {subject.enrolled}/{subject.capacity}
                  </p>
                  {subject.blocked_reason && <p className="mt-1 text-sm text-destructive">{subject.blocked_reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={subject.can_select ? "success" : "danger"}>{subject.can_select ? "Allowed" : "Blocked"}</StatusBadge>
                  <Button size="sm" disabled={!subject.can_select || selectMutation.isPending} onClick={() => selectMutation.mutate(subject.course_offering_id)}>Request</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
