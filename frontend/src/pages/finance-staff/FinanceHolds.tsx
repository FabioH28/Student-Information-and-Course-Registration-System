import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ShieldAlert, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { financeApi, studentsApi, type StudentOut } from "@/lib/api";

const EFFECTS = [
  { value: "block_registration", label: "Block course registration" },
  { value: "block_grades", label: "Block grade release" },
  { value: "block_transcript", label: "Block transcript request" },
  { value: "warning", label: "Warning only (no block)" },
];

export default function FinanceHolds() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [composing, setComposing] = useState(false);

  const { data: holds = [], isLoading } = useQuery({
    queryKey: ["finance-holds", showActiveOnly],
    queryFn: () => financeApi.holds({ active_only: showActiveOnly }),
  });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);

  const resolve = useMutation({
    mutationFn: (id: number) => financeApi.resolveHold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-holds"] });
      toast({ title: "Hold resolved" });
    },
    onError: (e: Error) => toast({ title: "Resolve failed", description: e.message, variant: "destructive" }),
  });

  const filtered = holds.filter((h) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const s = studentMap[h.student_id];
    return h.reason.toLowerCase().includes(q)
      || (s && `${s.first_name} ${s.last_name}`.toLowerCase().includes(q))
      || (s && s.student_code.toLowerCase().includes(q));
  });

  const activeCount = holds.filter((h) => h.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Account Holds" description="Financial restrictions on student accounts">
        <Button onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> Place hold
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Active holds" value={String(activeCount)} icon={ShieldAlert} accent={activeCount > 0 ? "from-destructive/15 to-destructive/5" : "from-success/15 to-success/5"} />
        <SummaryCard label="Total holds shown" value={String(holds.length)} icon={AlertTriangle} />
        <SummaryCard label="Affected students" value={String(new Set(holds.map((h) => h.student_id)).size)} icon={ShieldCheck} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reason or student..." className="pl-9" />
        </div>
        <label className="flex items-center gap-2 rounded-md border bg-background px-3 text-sm">
          <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} />
          Active only
        </label>
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading holds...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {showActiveOnly ? "No active holds — student accounts are clear." : "No holds match your filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Effect</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((h) => {
                  const s = studentMap[h.student_id];
                  const effectLabel = EFFECTS.find((e) => e.value === h.effect)?.label ?? h.effect;
                  return (
                    <tr key={h.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s ? `${s.first_name} ${s.last_name}` : `Student #${h.student_id}`}</p>
                        <p className="text-xs text-muted-foreground">{s?.student_code ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">{h.reason}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{effectLabel}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge variant={h.is_active ? "danger" : "success"}>{h.is_active ? "Active" : "Resolved"}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {h.is_active && (
                          <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate(h.id)}>
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {composing && (
        <NewHoldModal
          students={students}
          onClose={() => setComposing(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["finance-holds"] });
            toast({ title: "Hold placed" });
          }}
        />
      )}
    </div>
  );
}

function NewHoldModal({ students, onClose, onSaved }: {
  students: StudentOut[]; onClose: () => void; onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [effect, setEffect] = useState(EFFECTS[0].value);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => financeApi.createHold({ student_id: Number(studentId), reason, effect }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = studentId && reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><ShieldAlert className="h-5 w-5 text-destructive" /> Place hold on account</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Student</Label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.student_code}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Effect</Label>
            <select value={effect} onChange={(e) => setEffect(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {EFFECTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Outstanding balance, missing documents, etc." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSave || create.isPending} onClick={() => { setError(null); create.mutate(); }}>
              {create.isPending ? "Saving..." : "Place hold"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, accent = "from-primary/10 to-primary/5" }: {
  label: string; value: string; icon: React.ElementType; accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${accent} p-4 shadow-card`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur"><Icon className="h-4 w-4 text-foreground" /></div>
      </div>
    </div>
  );
}
