import { motion } from "framer-motion";
import { AlertTriangle, CircleDollarSign, Receipt, TrendingDown, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatCurrencyValue, formatDate, titleize } from "@/lib/formatters";

interface FinanceDashboardResponse {
  summary: {
    outstanding_balance: number;
    total_invoices: number;
    open_invoices: number;
    active_holds: number;
    confirmed_payments: number;
  };
  invoices: Array<{
    id: number;
    invoice_number: string;
    student_name: string;
    term_name: string | null;
    issue_date: string;
    total_amount: number;
    balance_amount: number;
    due_date: string;
    status: string;
  }>;
  holds: Array<{
    id: number;
    student_name: string;
    hold_type: string;
    reason: string;
    status: string;
    placed_at: string;
    released_at: string | null;
  }>;
  payments: Array<{
    id: number;
    student_name: string;
    reference_number: string | null;
    payment_method: string;
    amount: number;
    currency: string;
    paid_at: string;
    status: string;
    invoice_number: string | null;
  }>;
}

function getInvoiceVariant(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "danger" as const;
  if (status === "partially_paid") return "warning" as const;
  return "info" as const;
}

function getHoldVariant(status: string) {
  if (status === "released") return "success" as const;
  if (status === "active") return "danger" as const;
  return "default" as const;
}

function getPaymentVariant(status: string) {
  if (status === "confirmed") return "success" as const;
  if (status === "pending") return "warning" as const;
  return "default" as const;
}

export default function FinanceDashboard() {
  const query = useQuery({
    queryKey: ["finance", "dashboard"],
    queryFn: () => apiGet<FinanceDashboardResponse>("/finance/dashboard"),
  });

  if (query.isLoading) return <LoadingState lines={5} />;
  if (query.isError) {
    return (
      <ErrorState
        description={query.error instanceof Error ? query.error.message : "Finance data could not be loaded."}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const summary = query.data?.summary;
  const recentInvoices = (query.data?.invoices ?? []).slice(0, 6);
  const activeHolds = (query.data?.holds ?? []).filter((h) => h.status === "active").slice(0, 5);
  const recentPayments = (query.data?.payments ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Finance Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Outstanding balances, active holds, and recent payment activity
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Outstanding Balance"
          value={formatCurrencyValue(summary?.outstanding_balance ?? 0)}
          icon={TrendingDown}
          variant="danger"
          delay={0.05}
        />
        <StatCard
          title="Open Invoices"
          value={summary?.open_invoices ?? 0}
          icon={Receipt}
          variant="warning"
          delay={0.1}
        />
        <StatCard
          title="Active Holds"
          value={summary?.active_holds ?? 0}
          icon={AlertTriangle}
          variant="primary"
          delay={0.15}
        />
        <StatCard
          title="Confirmed Payments"
          value={formatCurrencyValue(summary?.confirmed_payments ?? 0)}
          icon={Wallet}
          variant="success"
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Recent Invoices</h3>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyState title="No invoices" description="Student invoices will appear here once created." />
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{inv.student_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {inv.invoice_number} · {formatDate(inv.due_date)}
                      {inv.term_name ? ` · ${inv.term_name}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrencyValue(inv.balance_amount)}
                    </span>
                    <StatusBadge variant={getInvoiceVariant(inv.status)}>{titleize(inv.status)}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Recent Payments</h3>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState title="No payments" description="Confirmed student payments will appear here." />
          ) : (
            <div className="space-y-2">
              {recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{pay.student_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {titleize(pay.payment_method)} · {formatDate(pay.paid_at)}
                      {pay.invoice_number ? ` · ${pay.invoice_number}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrencyValue(pay.amount)}
                    </span>
                    <StatusBadge variant={getPaymentVariant(pay.status)}>{titleize(pay.status)}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {activeHolds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground">Active Account Holds</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Student", "Hold Type", "Reason", "Placed", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeHolds.map((hold) => (
                  <tr key={hold.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{hold.student_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{titleize(hold.hold_type)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-muted-foreground">{hold.reason}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(hold.placed_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getHoldVariant(hold.status)}>{titleize(hold.status)}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
