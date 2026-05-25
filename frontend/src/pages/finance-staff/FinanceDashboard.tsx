import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, ReceiptText, AlertTriangle, CheckCircle2, ArrowRight,
  TrendingUp, Banknote, Users,
} from "lucide-react";

import { financeApi, studentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function money(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["finance-invoices"],
    queryFn: () => financeApi.invoices(),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["finance-payments"],
    queryFn: () => financeApi.payments(),
  });
  const { data: holds = [] } = useQuery({
    queryKey: ["finance-holds", "active"],
    queryFn: () => financeApi.holds({ active_only: true }),
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.amount || "0"), 0);
    const totalPaid = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || "0"), 0);
    const outstanding = totalBilled - totalPaid;
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const partialCount = invoices.filter((i) => i.status === "partial").length;
    const unpaidCount = invoices.filter((i) => i.status !== "paid" && i.status !== "partial").length;
    const overdue = invoices.filter((i) => {
      if (i.status === "paid") return false;
      return i.due_date && new Date(i.due_date) < new Date();
    }).length;
    return { totalBilled, totalPaid, outstanding, paidCount, partialCount, unpaidCount, overdue };
  }, [invoices]);

  const recentPayments = [...payments].sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? "")).slice(0, 6);
  const overdueInvoices = invoices
    .filter((i) => i.status !== "paid" && i.due_date && new Date(i.due_date) < new Date())
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 6);

  const firstName = user?.display_name?.split(" ")[0] ?? "Finance";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Welcome back, {firstName}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {invLoading ? "Loading account data..." : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} across ${students.length} students. ${stats.overdue} overdue.`}
        </p>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Billed" value={money(stats.totalBilled)} prefix="ALL " icon={ReceiptText} accent="from-primary/15 to-primary/5" onClick={() => navigate("/finance-staff/invoices")} />
        <StatTile label="Total Collected" value={money(stats.totalPaid)} prefix="ALL " icon={CheckCircle2} accent="from-success/15 to-success/5" onClick={() => navigate("/finance-staff/payments")} />
        <StatTile label="Outstanding" value={money(stats.outstanding)} prefix="ALL " icon={Wallet} accent="from-warning/15 to-warning/5" onClick={() => navigate("/finance-staff/invoices")} />
        <StatTile label="Active Holds" value={String(holds.length)} icon={AlertTriangle} accent={holds.length ? "from-destructive/15 to-destructive/5" : "from-muted/40 to-muted/10"} onClick={() => navigate("/finance-staff/holds")} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Overdue Invoices</h3>
              <p className="text-xs text-muted-foreground">{stats.overdue} past due date</p>
            </div>
            <button onClick={() => navigate("/finance-staff/invoices")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              All invoices <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {overdueInvoices.length === 0 ? (
            <EmptyTile icon={CheckCircle2} label="No overdue invoices — everyone's on time." />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {overdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <p className="font-medium text-foreground">{inv.description}</p>
                        <p className="text-xs text-muted-foreground">Student #{inv.student_id}</p>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{money(inv.amount)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{money(inv.amount_paid)}</td>
                      <td className="px-4 py-2 text-right text-destructive">{inv.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Payments</h3>
              <button onClick={() => navigate("/finance-staff/payments")} className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            {recentPayments.length === 0 ? (
              <EmptyTile icon={Banknote} label="No payments recorded yet." />
            ) : (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">Invoice #{p.invoice_id}</p>
                      <p className="text-xs text-muted-foreground">{p.method} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold text-success">+{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-foreground">Invoice Status</h3>
            <div className="space-y-2">
              <StatusRow label="Paid in full" count={stats.paidCount} tone="success" />
              <StatusRow label="Partially paid" count={stats.partialCount} tone="info" />
              <StatusRow label="Outstanding" count={stats.unpaidCount} tone="warning" />
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickLink icon={ReceiptText} label="Issue invoice" onClick={() => navigate("/finance-staff/invoices")} />
        <QuickLink icon={Banknote} label="Record payment" onClick={() => navigate("/finance-staff/payments")} />
        <QuickLink icon={AlertTriangle} label="Place a hold" onClick={() => navigate("/finance-staff/holds")} />
        <QuickLink icon={Users} label="Student accounts" onClick={() => navigate("/finance-staff/students")} />
      </motion.section>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent, prefix, onClick }: {
  label: string; value: string; icon: React.ElementType; accent: string; prefix?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${accent} p-5 text-left shadow-card transition-shadow hover:shadow-card-hover`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}{value}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 backdrop-blur">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
      </div>
    </motion.button>
  );
}

function StatusRow({ label, count, tone }: { label: string; count: number; tone: "success" | "info" | "warning" }) {
  const cls = tone === "success" ? "bg-success/15 text-success" : tone === "info" ? "bg-info/15 text-info" : "bg-warning/15 text-warning";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{count}</span>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15"><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyTile({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
