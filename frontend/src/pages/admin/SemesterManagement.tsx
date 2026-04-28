import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { semestersApi, SemesterOut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const emptyForm = { name: "", start_date: "", end_date: "", registration_deadline: "", drop_deadline: "" };

export default function SemesterManagement() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SemesterOut>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["semesters"],
    queryFn: semestersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => semestersApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      setShowCreate(false);
      setForm(emptyForm);
      toast({ title: "Semester created" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SemesterOut> }) =>
      semestersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      setEditId(null);
      toast({ title: "Semester updated" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const setActive = (id: number) =>
    updateMutation.mutate({ id, data: { is_active: true } });

  const field = (key: keyof typeof emptyForm, label: string, val: string, onChange: (v: string) => void) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Input type={key.includes("date") || key.includes("deadline") ? "date" : "text"} value={val} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Semester Management" description="Manage academic semesters and registration periods">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-4 h-4 mr-2" /> New Semester
        </Button>
      </PageHeader>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Create Semester</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {field("name", "Name", form.name, v => setForm(f => ({ ...f, name: v })))}
            {field("start_date", "Start Date", form.start_date, v => setForm(f => ({ ...f, start_date: v })))}
            {field("end_date", "End Date", form.end_date, v => setForm(f => ({ ...f, end_date: v })))}
            {field("registration_deadline", "Registration Deadline", form.registration_deadline, v => setForm(f => ({ ...f, registration_deadline: v })))}
            {field("drop_deadline", "Drop Deadline", form.drop_deadline, v => setForm(f => ({ ...f, drop_deadline: v })))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => createMutation.mutate()}
              disabled={!form.name || !form.start_date || !form.end_date || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {semesters.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border shadow-card">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{s.name}</h4>
                      <StatusBadge variant={s.is_active ? "success" : "default"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      <span>Start: {s.start_date}</span>
                      <span>End: {s.end_date}</span>
                      <span>Reg deadline: {s.registration_deadline}</span>
                      <span>Drop deadline: {s.drop_deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!s.is_active && (
                    <Button size="sm" variant="outline" onClick={() => setActive(s.id)}
                      disabled={updateMutation.isPending}>
                      Set Active
                    </Button>
                  )}
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditId(editId === s.id ? null : s.id); setEditForm(s); }}>
                    {editId === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {editId === s.id && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                      <Input value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                      <Input type="date" value={editForm.start_date ?? ""} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                      <Input type="date" value={editForm.end_date ?? ""} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Registration Deadline</label>
                      <Input type="date" value={editForm.registration_deadline ?? ""} onChange={e => setEditForm(f => ({ ...f, registration_deadline: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Drop Deadline</label>
                      <Input type="date" value={editForm.drop_deadline ?? ""} onChange={e => setEditForm(f => ({ ...f, drop_deadline: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90"
                      onClick={() => updateMutation.mutate({ id: s.id, data: editForm })}
                      disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
