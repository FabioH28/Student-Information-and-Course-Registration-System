import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, studentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function HoldsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: holds = [], isLoading } = useQuery({
    queryKey: ["holds"],
    queryFn: () => financeApi.holds({ active_only: false }),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const resolveMutation = useMutation({
    mutationFn: (id: number) => financeApi.resolveHold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holds"] });
      toast({ title: "Hold resolved" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to resolve hold", description: err.message, variant: "destructive" });
    },
  });

  const filtered = holds.filter(h => {
    const student = studentMap[h.student_id];
    const name = student ? `${student.first_name} ${student.last_name}` : "";
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || h.reason.toLowerCase().includes(q);
  });

  const activeCount = holds.filter(h => h.is_active).length;
  const resolvedCount = holds.filter(h => !h.is_active).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading holds…</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Holds" description="Manage holds that restrict student access">
        <div className="flex items-center gap-2">
          <StatusBadge variant="danger">{activeCount} Active</StatusBadge>
          <StatusBadge variant="success">{resolvedCount} Resolved</StatusBadge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Active Holds</p>
          <p className="text-2xl font-bold text-destructive mt-1">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Students affected</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Resolved This Period</p>
          <p className="text-2xl font-bold text-foreground mt-1">{resolvedCount}</p>
          <StatusBadge variant="success" className="mt-1">Cleared</StatusBadge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search holds..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border p-10 text-center shadow-card">
            <p className="text-muted-foreground">No holds found.</p>
          </div>
        )}
        {filtered.map((h, i) => {
          const student = studentMap[h.student_id];
          const studentName = student ? `${student.first_name} ${student.last_name}` : `Student #${h.student_id}`;
          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`bg-card rounded-xl border p-5 shadow-card ${h.is_active ? "border-destructive/30" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${h.is_active ? "bg-destructive/10" : "bg-success/10"}`}>
                    {h.is_active
                      ? <ShieldAlert className="w-5 h-5 text-destructive" />
                      : <ShieldCheck className="w-5 h-5 text-success" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{studentName}</p>
                      <StatusBadge variant={h.is_active ? "danger" : "success"}>{h.is_active ? "Active" : "Resolved"}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">{student?.student_code ?? ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Reason</p>
                    <p className="font-medium text-foreground">{h.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Effect</p>
                    <p className="text-xs text-foreground">{h.effect}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Since</p>
                    <p className="text-foreground text-xs">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {h.is_active && (
                  <Button
                    onClick={() => resolveMutation.mutate(h.id)}
                    size="sm"
                    variant="outline"
                    disabled={resolveMutation.isPending}
                    className="border-success text-success hover:bg-success/10 shrink-0"
                  >
                    Release Hold
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
