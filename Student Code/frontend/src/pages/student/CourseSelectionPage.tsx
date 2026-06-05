import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState, EmptyState } from "@/components/academic/AcademicShared";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { courseSelectionApi } from "@/lib/api";

export default function CourseSelectionPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dropTarget, setDropTarget] = useState<{ id: number; code: string; name: string; status: string } | null>(null);

  const { data = [], isLoading } = useQuery({ queryKey: ["course-selections"], queryFn: courseSelectionApi.mine });

  const dropMutation = useMutation({
    mutationFn: courseSelectionApi.drop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-selections"] });
      queryClient.invalidateQueries({ queryKey: ["available-subjects"] });
      toast({
        title: dropTarget?.status === "enrolled" || dropTarget?.status === "approved"
          ? "Course dropped"
          : "Request cancelled",
        description: dropTarget ? `${dropTarget.code} — ${dropTarget.name}` : undefined,
      });
      setDropTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
      setDropTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Selected Subjects" description="Selection requests and enrollment decisions" />

      {isLoading ? <LoadingState label="Loading selections..." /> : data.length === 0 ? <EmptyState label="No selected subjects yet." /> : (
        <div className="grid gap-3">
          {data.map((selection) => {
            const isApproved = selection.status === "enrolled" || selection.status === "approved";
            const isPending = selection.status === "pending" || selection.status === "waitlisted";
            return (
              <article key={selection.id} className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{selection.course_code} — {selection.course_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Selected: {selection.selected_at}</p>
                    {selection.reason && <p className="mt-1 text-sm text-muted-foreground">{selection.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={selection.status === "rejected" ? "danger" : isApproved ? "success" : "warning"}>{selection.status}</StatusBadge>
                    {selection.status !== "dropped" && selection.status !== "rejected" && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setDropTarget({
                          id: selection.id,
                          code: selection.course_code ?? "—",
                          name: selection.course_name ?? "",
                          status: selection.status,
                        })}
                      >
                        {isPending ? "Cancel" : "Drop"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={dropTarget !== null}
        destructive
        title={dropTarget?.status === "pending" || dropTarget?.status === "waitlisted"
          ? "Cancel this request?"
          : "Drop this subject?"}
        confirmLabel={dropTarget?.status === "pending" || dropTarget?.status === "waitlisted"
          ? "Yes, cancel request"
          : "Yes, drop subject"}
        cancelLabel="Keep"
        loading={dropMutation.isPending}
        description={dropTarget && (
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">{dropTarget.code} — {dropTarget.name}</strong>
            </p>
            <ul className="ml-4 list-disc text-xs">
              {dropTarget.status === "pending" || dropTarget.status === "waitlisted" ? (
                <>
                  <li>Your pending request will be withdrawn.</li>
                  <li>You can submit a new request from Available Subjects.</li>
                </>
              ) : (
                <>
                  <li>You'll lose access to this course's materials, attendance and grades.</li>
                  <li>Re-enrollment requires submitting a new request and staff approval.</li>
                </>
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
