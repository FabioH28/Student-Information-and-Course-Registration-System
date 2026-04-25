import { motion } from "framer-motion";
import { CreditCard, Download, Landmark, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { FinanceSupportDialog } from "@/components/student/FinanceSupportDialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatCurrencyValue, formatDate, titleize } from "@/lib/formatters";

interface StudentFinanceResponse {
  summary: {
    outstanding_balance: number;
    invoice_count: number;
    payment_count: number;
    active_holds: number;
  };
  invoices: Array<{
    id: number;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    total_amount: number;
    balance_amount: number;
    status: string;
    notes: string | null;
  }>;
  payments: Array<{
    id: number;
    reference_number: string;
    payment_method: string;
    amount: number;
    currency: string;
    paid_at: string;
    status: string;
    notes: string | null;
  }>;
  aid_awards: Array<{
    id: number;
    award_type: string;
    provider_name: string;
    reference_number: string | null;
    amount: number;
    currency: string;
    status: string;
    approved_at: string | null;
    applied_at: string | null;
  }>;
  holds: Array<{
    id: number;
    hold_type: string;
    reason: string;
    status: string;
    placed_at: string;
    released_at: string | null;
  }>;
}

function getFinanceVariant(status: string) {
  if (status === "paid" || status === "confirmed" || status === "applied") {
    return "success" as const;
  }

  if (status === "partial" || status === "partially_paid" || status === "pending") {
    return "warning" as const;
  }

  if (status === "overdue" || status === "active") {
    return "danger" as const;
  }

  return "info" as const;
}

function downloadFinanceStatement(finance: StudentFinanceResponse) {
  const lines = [
    "CIS - Campus Information System",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Summary",
    `Outstanding Balance: ${formatCurrencyValue(finance.summary.outstanding_balance)}`,
    `Invoices: ${finance.summary.invoice_count}`,
    `Payments: ${finance.summary.payment_count}`,
    `Active Holds: ${finance.summary.active_holds}`,
    "",
    "Invoices",
    ...finance.invoices.map(
      (invoice) =>
        `${invoice.invoice_number} | Issued ${formatDate(invoice.issue_date)} | Due ${formatDate(invoice.due_date)} | Balance ${formatCurrencyValue(invoice.balance_amount)} | ${titleize(invoice.status)}`,
    ),
    "",
    "Payments",
    ...finance.payments.map(
      (payment) =>
        `${payment.reference_number} | ${titleize(payment.payment_method)} | ${formatCurrencyValue(payment.amount, payment.currency)} | ${formatDate(payment.paid_at)} | ${titleize(payment.status)}`,
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cis-finance-statement-${new Date().toISOString().slice(0, 10)}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function StudentFinance() {
  const [supportOpen, setSupportOpen] = useState(false);
  const financeQuery = useQuery({
    queryKey: ["student", "finance"],
    queryFn: () => apiGet<StudentFinanceResponse>("/students/me/finance"),
  });

  if (financeQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (financeQuery.isError) {
    return (
      <ErrorState
        description={financeQuery.error instanceof Error ? financeQuery.error.message : "Finance data could not be loaded."}
        onRetry={() => void financeQuery.refetch()}
      />
    );
  }

  const finance = financeQuery.data;
  if (!finance) {
    return <EmptyState title="No finance data yet" description="Invoices, payments, and financial aid details will appear here once finance staff records them." />;
  }

  const totalAid = finance.aid_awards.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPayments = finance.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" description="Review balances, invoices, and staff-recorded payments">
        <Button variant="outline" size="sm" onClick={() => downloadFinanceStatement(finance)}>
          <Download className="mr-2 h-4 w-4" /> Download Statement
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Outstanding Balance"
          value={formatCurrencyValue(finance.summary.outstanding_balance)}
          subtitle={`${finance.summary.invoice_count} invoices on file`}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Aid & Scholarships"
          value={formatCurrencyValue(totalAid)}
          subtitle={`${finance.aid_awards.length} awards`}
          icon={Landmark}
          variant="success"
        />
        <StatCard
          title="Payments Recorded"
          value={formatCurrencyValue(totalPayments)}
          subtitle={`${finance.summary.payment_count} records`}
          icon={CreditCard}
          variant="primary"
        />
        <StatCard
          title="Financial Standing"
          value={finance.summary.active_holds > 0 ? "Hold active" : "Clear"}
          subtitle={
            finance.summary.active_holds > 0
              ? `${finance.summary.active_holds} hold${finance.summary.active_holds === 1 ? "" : "s"}`
              : "No active holds"
          }
          icon={ShieldCheck}
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-foreground">Current Invoices</h3>
            <StatusBadge variant="info">{finance.invoices.length} total invoices</StatusBadge>
          </div>

          {finance.invoices.length === 0 ? (
            <EmptyState title="No invoice records" description="Once finance staff adds invoice records, they will show up here." />
          ) : (
            <div className="space-y-3">
              {finance.invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued {formatDate(invoice.issue_date)} - Due {formatDate(invoice.due_date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">{formatCurrencyValue(invoice.balance_amount)}</p>
                    <StatusBadge variant={getFinanceVariant(invoice.status)}>{titleize(invoice.status)}</StatusBadge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-primary/5 p-5 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Billing Snapshot</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open balance</span>
              <span className="font-medium text-foreground">{formatCurrencyValue(finance.summary.outstanding_balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aid applied</span>
              <span className="font-medium text-success">{formatCurrencyValue(totalAid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payments recorded</span>
              <span className="font-medium text-foreground">{formatCurrencyValue(totalPayments)}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Active holds</span>
                <span className="font-semibold text-warning">{finance.summary.active_holds}</span>
              </div>
            </div>
          </div>

          <Button className="mt-5 w-full gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setSupportOpen(true)}>
            Request Finance Help
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border bg-card p-5 shadow-card"
      >
        <h3 className="mb-4 font-semibold text-foreground">Payment Records</h3>

        {finance.payments.length === 0 ? (
          <EmptyState title="No payments recorded" description="Payment records will appear here once finance staff adds them to your account." />
        ) : (
          <div className="space-y-3">
            {finance.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{titleize(payment.payment_method)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.reference_number} - {formatDate(payment.paid_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">{formatCurrencyValue(payment.amount, payment.currency)}</p>
                  <StatusBadge variant={getFinanceVariant(payment.status)}>{titleize(payment.status)}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <FinanceSupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
