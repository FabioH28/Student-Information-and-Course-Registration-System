import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Filter, Search, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, LoadingState } from "@/components/academic/AcademicShared";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePagination } from "@/hooks/use-pagination";
import { staffApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function RegistrationsManagement() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: selections = [], isLoading } = useQuery({
    queryKey: ["staff-course-selections"],
    queryFn: staffApi.courseSelections,
  });

  const approveMutation = useMutation({
    mutationFn: staffApi.approveCourseSelection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-course-selections"] });
      toast({ title: "Subject request approved" });
    },
    onError: (err: Error) => toast({ title: "Approval failed", description: err.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => staffApi.rejectCourseSelection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-course-selections"] });
      toast({ title: "Subject request rejected" });
    },
    onError: (err: Error) => toast({ title: "Rejection failed", description: err.message, variant: "destructive" }),
  });

  const filtered = selections.filter((selection) => {
    const q = search.toLowerCase();
    return !q
      || (selection.student_name ?? "").toLowerCase().includes(q)
      || (selection.course_name ?? "").toLowerCase().includes(q)
      || (selection.course_code ?? "").toLowerCase().includes(q)
      || selection.status.toLowerCase().includes(q);
  });

  const pagination = usePagination(filtered, 10);

  const counts = {
    requested: selections.filter((item) => item.status === "requested" || item.status === "selected").length,
    enrolled: selections.filter((item) => item.status === "enrolled" || item.status === "approved").length,
    rejected: selections.filter((item) => item.status === "rejected").length,
  };

  if (isLoading) return <LoadingState label="Loading subject requests..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Subject Registration Requests" description="Review student eligibility and approve official enrollment" />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.requested}</p>
          <StatusBadge variant="warning" className="mt-1">Pending</StatusBadge>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.enrolled}</p>
          <StatusBadge variant="success" className="mt-1">Approved</StatusBadge>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-foreground">{counts.rejected}</p>
          <StatusBadge variant="danger" className="mt-1">Rejected</StatusBadge>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by student, subject, or status..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <EmptyState label="No subject requests found." />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Student", "Subject", "Requested", "Status", "Decision"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagination.pageItems.map((selection, index) => {
                  const isPending = selection.status === "requested" || selection.status === "selected";
                  return (
                    <motion.tr key={selection.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{selection.student_name ?? `Student #${selection.student_id}`}</p>
                        <p className="text-xs text-muted-foreground">ID {selection.student_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{selection.course_name ?? `Offering #${selection.course_offering_id}`}</p>
                        <p className="text-xs text-muted-foreground">{selection.course_code ?? ""}</p>
                        {selection.reason && <p className="mt-1 text-xs text-destructive">{selection.reason}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(selection.selected_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={selection.status === "rejected" ? "danger" : isPending ? "warning" : "success"}>
                          {selection.status.charAt(0).toUpperCase() + selection.status.slice(1)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" disabled={!isPending || approveMutation.isPending} onClick={() => approveMutation.mutate(selection.id)}>
                            <Check className="mr-2 h-4 w-4" />Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={!isPending || rejectMutation.isPending} onClick={() => rejectMutation.mutate(selection.id)}>
                            <X className="mr-2 h-4 w-4" />Reject
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DataPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="registrations"
          />
        </motion.div>
      )}
    </div>
  );
}
