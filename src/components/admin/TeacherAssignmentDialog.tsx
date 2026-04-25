import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, RefreshCw, Search, UserCheck } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import { titleize } from "@/lib/formatters";

interface TeacherSummary {
  teacher_profile_id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  employee_number: string;
  title: string | null;
  department_name: string;
  assigned_offerings: number;
}

interface AssignmentWorkspaceResponse {
  teacher: TeacherSummary;
  summary: {
    total_offerings: number;
    assigned_offerings: number;
    reassignable_offerings: number;
  };
  offerings: Array<{
    offering_id: number;
    code: string;
    title: string;
    term_name: string;
    section_code: string;
    status: string;
    capacity: number;
    enrolled_count: number;
    assigned_teacher_profile_id: number | null;
    assigned_teacher_name: string | null;
    meeting_summary: string | null;
    assigned_to_selected_teacher: boolean;
    reassigning: boolean;
  }>;
  message?: string;
}

interface TeacherAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherSummary | null;
}

function getOfferingVariant(status: string) {
  if (status === "open" || status === "in_progress" || status === "completed") {
    return "success" as const;
  }

  if (status === "draft" || status === "closed") {
    return "warning" as const;
  }

  return "default" as const;
}

export function TeacherAssignmentDialog({ open, onOpenChange, teacher }: TeacherAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);

  const assignmentsQuery = useQuery({
    queryKey: ["system-admin", "instructor-assignments", teacher?.teacher_profile_id],
    enabled: open && Boolean(teacher?.teacher_profile_id),
    queryFn: () =>
      apiGet<AssignmentWorkspaceResponse>(`/system-admin/instructors/${teacher?.teacher_profile_id}/offering-assignments`),
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedOfferingIds([]);
      return;
    }

    if (assignmentsQuery.data) {
      setSelectedOfferingIds(
        assignmentsQuery.data.offerings
          .filter((offering) => offering.assigned_to_selected_teacher)
          .map((offering) => offering.offering_id),
      );
    }
  }, [open, assignmentsQuery.data]);

  const filteredOfferings = useMemo(() => {
    const term = search.toLowerCase();
    return (assignmentsQuery.data?.offerings ?? []).filter((offering) =>
      `${offering.code} ${offering.title} ${offering.term_name} ${offering.section_code} ${offering.assigned_teacher_name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [assignmentsQuery.data?.offerings, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacher) {
        throw new Error("Select an instructor first.");
      }

      return apiPut<AssignmentWorkspaceResponse>(`/system-admin/instructors/${teacher.teacher_profile_id}/offering-assignments`, {
        offering_ids: selectedOfferingIds,
      });
    },
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["system-admin", "staff"] }),
        queryClient.invalidateQueries({ queryKey: ["academic", "courses"] }),
        queryClient.invalidateQueries({ queryKey: ["system-admin", "instructor-assignments", teacher?.teacher_profile_id] }),
      ]);

      toast({
        title: "Teaching assignments updated",
        description: payload.message ?? "The selected offerings were assigned successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to update assignments",
        description: error instanceof Error ? error.message : "The selected offerings could not be saved.",
      });
    },
  });

  const toggleOffering = (offeringId: number, checked: boolean) => {
    setSelectedOfferingIds((current) => {
      if (checked) {
        return current.includes(offeringId) ? current : [...current, offeringId];
      }

      return current.filter((id) => id !== offeringId);
    });
  };

  const selectedCount = selectedOfferingIds.length;
  const reassignCount = (assignmentsQuery.data?.offerings ?? []).filter(
    (offering) =>
      selectedOfferingIds.includes(offering.offering_id) &&
      offering.assigned_teacher_profile_id !== null &&
      offering.assigned_teacher_profile_id !== teacher?.teacher_profile_id,
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Instructor Load</DialogTitle>
          <DialogDescription>
            {teacher
              ? `Choose the course offerings that should appear in ${teacher.first_name} ${teacher.last_name}'s instructor workspace.`
              : "Choose an instructor first."}
          </DialogDescription>
        </DialogHeader>

        {!teacher ? (
          <EmptyState title="No instructor selected" description="Open this dialog from an instructor row to manage assignments." />
        ) : assignmentsQuery.isLoading ? (
          <LoadingState lines={6} />
        ) : assignmentsQuery.isError ? (
          <ErrorState
            description={
              assignmentsQuery.error instanceof Error
                ? assignmentsQuery.error.message
                : "Instructor assignments could not be loaded."
            }
            onRetry={() => void assignmentsQuery.refetch()}
          />
        ) : !assignmentsQuery.data ? (
          <EmptyState title="No assignment data" description="The assignment workspace is unavailable right now." />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Instructor</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{assignmentsQuery.data.teacher.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {assignmentsQuery.data.teacher.employee_number} · {assignmentsQuery.data.teacher.email}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {assignmentsQuery.data.teacher.title || "Faculty member"} · {assignmentsQuery.data.teacher.department_name}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Assigned Now</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{assignmentsQuery.data.summary.assigned_offerings}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Selected</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{selectedCount}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Reassigning</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{reassignCount}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offerings by code, title, term, or current instructor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Selected offerings will appear in the instructor workspace immediately. If an offering already belongs to another instructor, saving here will reassign it.
            </div>

            {filteredOfferings.length === 0 ? (
              <EmptyState title="No offerings found" description="Try a broader search or create course offerings in the academic workspace first." />
            ) : (
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                {filteredOfferings.map((offering) => {
                  const isChecked = selectedOfferingIds.includes(offering.offering_id);

                  return (
                    <label
                      key={offering.offering_id}
                      className="flex cursor-pointer items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/20"
                    >
                      <Checkbox checked={isChecked} onCheckedChange={(checked) => toggleOffering(offering.offering_id, checked === true)} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-muted-foreground">
                              {offering.code} · Section {offering.section_code}
                            </p>
                            <h4 className="mt-1 text-sm font-semibold text-foreground">{offering.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{offering.term_name}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge variant={getOfferingVariant(offering.status)}>{titleize(offering.status)}</StatusBadge>
                            {offering.assigned_to_selected_teacher ? (
                              <StatusBadge variant="success">Assigned</StatusBadge>
                            ) : offering.reassigning ? (
                              <StatusBadge variant="warning">Reassign</StatusBadge>
                            ) : (
                              <StatusBadge variant="default">Unassigned</StatusBadge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current Instructor</p>
                            <p className="mt-2 text-foreground">{offering.assigned_teacher_name || "Not assigned"}</p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Enrollment</p>
                            <p className="mt-2 text-foreground">
                              {offering.enrolled_count}/{offering.capacity}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                            <p className="mt-2 text-foreground">{offering.meeting_summary || "Schedule pending"}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span>Offering #{offering.offering_id}</span>
                          {offering.reassigning ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 text-warning" />
                              <span>This will move the offering from another instructor.</span>
                            </>
                          ) : isChecked ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-success" />
                              <span>This offering will be visible in the instructor workspace.</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Assignments"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
