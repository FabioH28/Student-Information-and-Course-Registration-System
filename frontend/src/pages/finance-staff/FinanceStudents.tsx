import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, ShieldAlert, ReceiptText, Banknote, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { financeApi, studentsApi, type StudentOut } from "@/lib/api";

function money(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanceStudents() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["finance-invoices"], queryFn: () => financeApi.invoices() });
  const { data: holds = [] } = useQuery({ queryKey: ["finance-holds", false], queryFn: () => financeApi.holds({ active_only: false }) });

  const byStudent = useMemo(() => {
    const map = new Map<number, { billed: number; paid: number; outstanding: number; invoices: number; activeHolds: number }>();
    students.forEach((s) => map.set(s.id, { billed: 0, paid: 0, outstanding: 0, invoices: 0, activeHolds: 0 }));
    invoices.forEach((inv) => {
      const cur = map.get(inv.student_id);
      if (!cur) return;
      cur.billed += parseFloat(inv.amount || "0");
      cur.paid += parseFloat(inv.amount_paid || "0");
      cur.outstanding = cur.billed - cur.paid;
      cur.invoices += 1;
    });
    holds.forEach((h) => {
      if (!h.is_active) return;
      const cur = map.get(h.student_id);
      if (cur) cur.activeHolds += 1;
    });
    return map;
  }, [students, invoices, holds]);

  const enriched = useMemo(() => students.map((s) => ({
    ...s, ...(byStudent.get(s.id) ?? { billed: 0, paid: 0, outstanding: 0, invoices: 0, activeHolds: 0 }),
  })), [students, byStudent]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((s) => !q
      || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
      || s.student_code.toLowerCase().includes(q));
  }, [enriched, search]);

  const openStudent = openId ? enriched.find((s) => s.id === openId) ?? null : null;
  const openInvoices = openStudent ? invoices.filter((i) => i.student_id === openStudent.id) : [];
  const openHolds = openStudent ? holds.filter((h) => h.student_id === openStudent.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Student Accounts" description="Per-student billing and balances" />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or student code..." className="pl-9" />
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading students...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No students match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-center">Invoices</th>
                  <th className="px-4 py-3 text-right">Billed</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-center">Holds</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setOpenId(s.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.student_code}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{s.invoices}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(s.billed)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{money(s.paid)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${s.outstanding > 0 ? "text-warning" : "text-success"}`}>{money(s.outstanding)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.activeHolds > 0
                        ? <StatusBadge variant="danger">{s.activeHolds} active</StatusBadge>
                        : <StatusBadge variant="success">Clear</StatusBadge>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground"><ChevronRight className="inline h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {openStudent && (
        <DetailDrawer
          student={openStudent}
          invoices={openInvoices}
          holds={openHolds}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function DetailDrawer({ student, invoices, holds, onClose }: {
  student: StudentOut & { billed: number; paid: number; outstanding: number; activeHolds: number };
  invoices: { id: number; description: string; amount: string; amount_paid: string; status: string; due_date: string }[];
  holds: { id: number; reason: string; effect: string; is_active: boolean; created_at: string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto border-l bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{student.first_name} {student.last_name}</h3>
            <p className="text-sm text-muted-foreground">{student.student_code} · Semester {student.current_semester}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Billed" value={`ALL ${money(student.billed)}`} />
          <Stat label="Paid" value={`ALL ${money(student.paid)}`} tone="success" />
          <Stat label="Outstanding" value={`ALL ${money(student.outstanding)}`} tone={student.outstanding > 0 ? "warning" : "success"} />
        </div>

        <section className="mb-6">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><ReceiptText className="h-4 w-4" /> Invoices</h4>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => {
                const balance = parseFloat(inv.amount) - parseFloat(inv.amount_paid);
                return (
                  <div key={inv.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{inv.description}</p>
                        <p className="text-xs text-muted-foreground">Due {inv.due_date}</p>
                      </div>
                      <StatusBadge variant={inv.status === "paid" ? "success" : inv.status === "partial" ? "info" : "warning"}>{inv.status}</StatusBadge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-mono">
                      <div><p className="text-muted-foreground">Amount</p><p>{money(inv.amount)}</p></div>
                      <div><p className="text-muted-foreground">Paid</p><p>{money(inv.amount_paid)}</p></div>
                      <div><p className="text-muted-foreground">Balance</p><p className={balance > 0 ? "text-warning" : "text-success"}>{money(balance)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldAlert className="h-4 w-4" /> Holds</h4>
          {holds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holds on file.</p>
          ) : (
            <div className="space-y-2">
              {holds.map((h) => (
                <div key={h.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground">{h.reason}</p>
                    <StatusBadge variant={h.is_active ? "danger" : "success"}>{h.is_active ? "Active" : "Resolved"}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.effect} · {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
