import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState, EmptyState } from "@/components/academic/AcademicShared";
import { courseSelectionApi } from "@/lib/api";

export default function CourseSelectionPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["course-selections"], queryFn: courseSelectionApi.mine });
  const dropMutation = useMutation({
    mutationFn: courseSelectionApi.drop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-selections"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Selected Subjects" description="Selection requests and enrollment decisions" />
      {isLoading ? <LoadingState label="Loading selections..." /> : data.length === 0 ? <EmptyState label="No selected subjects yet." /> : (
        <div className="grid gap-3">
          {data.map((selection) => (
            <article key={selection.id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{selection.course_code} — {selection.course_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Selected: {selection.selected_at}</p>
                  {selection.reason && <p className="mt-1 text-sm text-muted-foreground">{selection.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={selection.status === "rejected" ? "danger" : selection.status === "enrolled" || selection.status === "approved" ? "success" : "warning"}>{selection.status}</StatusBadge>
                  {selection.status !== "dropped" && <Button size="sm" variant="outline" onClick={() => dropMutation.mutate(selection.id)}>Drop</Button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
