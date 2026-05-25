import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Banknote, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { financeApi, studentsApi } from "@/lib/api";

function money(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

export default function FinancePayments() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");

  const { data: payments = [], isLoading } = useQuery({ queryKey: ["finance-payments"], queryFn: () => financeApi.payments() });
  const { data: invoices = [] } = useQuery({ queryKey: ["finance-invoices"], queryFn: () => financeApi.invoices() });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });

  const invoiceMap = useMemo(() => Object.fromEntries(invoices.map((i) => [i.id, i])), [invoices]);
  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);

  const enriched = useMemo(() => payments.map((p) => {
    const inv = invoiceMap[p.invoice_id];
    const stu = inv ? studentMap[inv.student_id] : null;
    return { ...p, invoice: inv, student: stu };
  }), [payments, invoiceMap, studentMap]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((p) => {
      const matchSearch = !q
        || (p.invoice?.description?.toLowerCase().includes(q))
        || (p.student && `${p.student.first_name} ${p.student.last_name}`.toLowerCase().includes(q))
        || (p.reference?.toLowerCase().includes(q));
      const matchMethod = !method || p.method === method;
      return matchSearch && matchMethod;
    }).sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""));
  }, [enriched, search, method]);

  const totalThisFilter = filtered.reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="All recorded student payments" />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Payments shown" value={String(filtered.length)} icon={Banknote} />
        <SummaryCard label="Total collected" value={`ALL ${money(totalThisFilter)}`} icon={Banknote} accent="from-success/15 to-success/5" />
        <SummaryCard label="Methods used" value={String(new Set(filtered.map((p) => p.method)).size)} icon={CalendarDays} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, student, reference..." className="pl-9" />
        </div>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All methods</option>
          {Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading payments...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No payments match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-center">Method</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      {p.student ? (
                        <>
                          <p className="font-medium text-foreground">{p.student.first_name} {p.student.last_name}</p>
                          <p className="text-xs text-muted-foreground">{p.student.student_code}</p>
                        </>
                      ) : <span className="text-muted-foreground">Student #{p.invoice?.student_id ?? "?"}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{p.invoice?.description ?? `Invoice #${p.invoice_id}`}</p>
                      <p className="text-xs text-muted-foreground">#{p.invoice_id}</p>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge variant="info">{METHOD_LABEL[p.method] ?? p.method}</StatusBadge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-success">+{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
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
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur"><Icon className="h-4 w-4 text-foreground" /></div>
      </div>
    </div>
  );
}
