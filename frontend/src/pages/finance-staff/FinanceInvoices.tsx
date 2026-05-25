import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, X, ReceiptText, Banknote } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { financeApi, studentsApi, semestersApi, type StudentOut, type SemesterOut } from "@/lib/api";

function money(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusTone(s: string): "success" | "warning" | "danger" | "info" {
  if (s === "paid") return "success";
  if (s === "partial") return "info";
  if (s === "overdue") return "danger";
  return "warning";
}

export default function FinanceInvoices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [composing, setComposing] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["finance-invoices"], queryFn: () => financeApi.invoices() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const s = studentMap[inv.student_id];
      const matches = !q
        || inv.description.toLowerCase().includes(q)
        || (s && (`${s.first_name} ${s.last_name}`).toLowerCase().includes(q))
        || (s && s.student_code.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      return matches && matchesStatus;
    });
  }, [invoices, studentMap, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Tuition and fees billed to students">
        <Button onClick={() => setComposing(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, student name or code..." className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading invoices...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No invoices match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Due date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((inv) => {
                  const s = studentMap[inv.student_id];
                  const balance = parseFloat(inv.amount) - parseFloat(inv.amount_paid);
                  return (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s ? `${s.first_name} ${s.last_name}` : `Student #${inv.student_id}`}</p>
                        <p className="text-xs text-muted-foreground">{s?.student_code ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{inv.description}</td>
                      <td className="px-4 py-3 text-right font-mono">{money(inv.amount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{money(inv.amount_paid)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${balance > 0 ? "text-warning" : "text-success"}`}>{money(balance)}</td>
                      <td className="px-4 py-3 text-right text-xs">{inv.due_date}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge variant={statusTone(inv.status)}>{inv.status}</StatusBadge></td>
                      <td className="px-4 py-3 text-right">
                        {inv.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => setPaying(inv.id)}>
                            <Banknote className="mr-1 h-3.5 w-3.5" /> Pay
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
        <NewInvoiceModal
          students={students}
          onClose={() => setComposing(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
            toast({ title: "Invoice created" });
          }}
        />
      )}
      {paying !== null && (
        <RecordPaymentModal
          invoice={invoices.find((i) => i.id === paying)!}
          onClose={() => setPaying(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["finance-payments"] });
            toast({ title: "Payment recorded" });
          }}
        />
      )}
    </div>
  );
}

function NewInvoiceModal({ students, onClose, onSaved }: {
  students: StudentOut[]; onClose: () => void; onSaved: () => void;
}) {
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: semestersApi.list });
  const active = semesters.find((s: SemesterOut) => s.is_active) ?? semesters[0];
  const [studentId, setStudentId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>(active ? String(active.id) : "");
  const [description, setDescription] = useState("Tuition fee");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => financeApi.createInvoice({
      student_id: Number(studentId),
      semester_id: Number(semesterId),
      description,
      amount: parseFloat(amount),
      due_date: dueDate,
    }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = studentId && semesterId && description && amount && dueDate;

  return (
    <Modal title="New Invoice" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Student">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.student_code}</option>
            ))}
          </select>
        </Field>
        <Field label="Semester">
          <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select semester...</option>
            {semesters.map((s: SemesterOut) => (
              <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (active)" : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (ALL)"><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ModalActions onClose={onClose} onSave={() => { setError(null); create.mutate(); }} canSave={!!canSave} saving={create.isPending} />
      </div>
    </Modal>
  );
}

function RecordPaymentModal({ invoice, onClose, onSaved }: {
  invoice: { id: number; amount: string; amount_paid: string; description: string };
  onClose: () => void; onSaved: () => void;
}) {
  const balance = parseFloat(invoice.amount) - parseFloat(invoice.amount_paid);
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : "");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pay = useMutation({
    mutationFn: () => financeApi.recordPayment({
      invoice_id: invoice.id,
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
    }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const canSave = amount && parseFloat(amount) > 0;

  return (
    <Modal title={`Record payment — ${invoice.description}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Invoice total</span><span className="font-mono">{money(invoice.amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Already paid</span><span className="font-mono">{money(invoice.amount_paid)}</span></div>
          <div className="mt-1 flex justify-between border-t pt-1 font-semibold"><span>Outstanding</span><span className="font-mono text-warning">{money(balance)}</span></div>
        </div>
        <Field label="Amount (ALL)"><Input type="number" step="0.01" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Reference (optional)"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID, receipt #..." /></Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ModalActions onClose={onClose} onSave={() => { setError(null); pay.mutate(); }} canSave={!!canSave} saving={pay.isPending} saveLabel="Record" />
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><ReceiptText className="h-5 w-5 text-primary" /> {title}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
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

function ModalActions({ onClose, onSave, canSave, saving, saveLabel = "Save" }: {
  onClose: () => void; onSave: () => void; canSave: boolean; saving: boolean; saveLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button disabled={!canSave || saving} onClick={onSave}>{saving ? "Saving..." : saveLabel}</Button>
    </div>
  );
}
