import { motion } from "framer-motion";
import { DollarSign, FileText, ShieldAlert, TrendingUp, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { financeApi, studentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => financeApi.invoices(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => financeApi.payments(),
  });

  const { data: holds = [] } = useQuery({
    queryKey: ["holds"],
    queryFn: () => financeApi.holds({ active_only: false }),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.list,
  });

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "partial" || i.status === "overdue").length;
  const activeHolds = holds.filter(h => h.is_active);
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const collectionRate = invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 0;

  const recentPayments = [...payments].reverse().slice(0, 4);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Finance Dashboard</h2>
        <p className="text-primary-foreground/80 mt-1">Spring 2025 — Financial operations overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value={`$${totalCollected.toFixed(0)}`} icon={DollarSign} variant="success" delay={0.05} />
        <StatCard title="Pending Invoices" value={pendingInvoices} icon={FileText} variant="warning" delay={0.1} />
        <StatCard title="Active Holds" value={activeHolds.length} subtitle="Blocking registration" icon={ShieldAlert} variant="danger" delay={0.15} />
        <StatCard title="Collection Rate" value={`${collectionRate}%`} icon={TrendingUp} variant="info" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Payments
            </h3>
            <button onClick={() => navigate("/finance-staff/payments")} className="text-xs text-primary hover:underline font-medium">View all</button>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Invoice #{p.invoice_id}</p>
                    <p className="text-xs text-muted-foreground">{p.method.replace("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">${Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" /> Active Holds
            </h3>
            <button onClick={() => navigate("/finance-staff/holds")} className="text-xs text-primary hover:underline font-medium">Manage holds</button>
          </div>
          {activeHolds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active holds.</p>
          ) : (
            <div className="space-y-3">
              {activeHolds.slice(0, 4).map((h, i) => {
                const student = studentMap[h.student_id];
                const name = student ? `${student.first_name} ${student.last_name}` : `Student #${h.student_id}`;
                return (
                  <div key={h.id} className="flex items-start justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{h.reason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge variant="danger">Active</StatusBadge>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
