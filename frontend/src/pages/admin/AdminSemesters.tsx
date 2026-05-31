import { useState } from "react";
import { Plus, Calendar, CheckCircle2, X, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useToast } from "@/hooks/use-toast";
import { semestersApi, type SemesterOut } from "@/lib/api";

export default function AdminSemesters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<SemesterOut | null>(null);

  const { data: semesters = [], isLoading } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });

  const pagination = usePagination(semesters, 10);

  const activate = useMutation({
    mutationFn: async (id: number) => {
      // deactivate all then activate this one
      await Promise.all(semesters.filter((s) => s.is_active).map((s) => semestersApi.update(s.id, { is_active: false })));
      return semestersApi.update(id, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      toast({ title: "Active semester updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Semesters</h2>
          <p className="text-sm text-muted-foreground">Academic terms and key dates</p>
        </div>
        <Button size="sm" onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> New semester
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading semesters...</p>
        ) : semesters.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No semesters configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">End</th>
                  <th className="px-4 py-3 text-left">Reg. deadline</th>
                  <th className="px-4 py-3 text-left">Drop deadline</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagination.pageItems.map((s) => (
                  <tr key={s.id} className={`hover:bg-muted/30 ${s.is_active ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.start_date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.end_date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.registration_deadline}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.drop_deadline}</td>
                    <td className="px-4 py-3 text-center">
                      {s.is_active
                        ? <StatusBadge variant="success">Active</StatusBadge>
                        : <Button size="sm" variant="outline" disabled={activate.isPending} onClick={() => activate.mutate(s.id)}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Make active
                          </Button>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DataPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="semesters"
        />
      </section>

      {composing && (
        <SemesterModal onClose={() => setComposing(false)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["semesters"] });
          toast({ title: "Semester created" });
        }} />
      )}
      {editing && (
        <SemesterModal semester={editing} onClose={() => setEditing(null)} onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["semesters"] });
          toast({ title: "Semester updated" });
        }} />
      )}
    </div>
  );
}

function SemesterModal({ semester, onClose, onSaved }: { semester?: SemesterOut; onClose: () => void; onSaved: () => void }) {
  const editing = !!semester;
  const [name, setName] = useState(semester?.name ?? "");
  const [start, setStart] = useState(semester?.start_date ?? "");
  const [end, setEnd] = useState(semester?.end_date ?? "");
  const [regDeadline, setRegDeadline] = useState(semester?.registration_deadline ?? "");
  const [dropDeadline, setDropDeadline] = useState(semester?.drop_deadline ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, start_date: start, end_date: end, registration_deadline: regDeadline, drop_deadline: dropDeadline };
      return editing ? semestersApi.update(semester!.id, payload) : semestersApi.create(payload);
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = name && start && end && regDeadline && dropDeadline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Calendar className="h-5 w-5 text-primary" /> {editing ? "Edit semester" : "New semester"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fall 2026" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="End date"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reg. deadline"><Input type="date" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} /></Field>
            <Field label="Drop deadline"><Input type="date" value={dropDeadline} onChange={(e) => setDropDeadline(e.target.value)} /></Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSave || save.isPending} onClick={() => { setError(null); save.mutate(); }}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
