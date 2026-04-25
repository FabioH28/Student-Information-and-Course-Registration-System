import { motion } from "framer-motion";
import { AlertTriangle, CircleDollarSign, Landmark, Pencil, Receipt, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FinancialHoldDialog } from "@/components/admin/FinancialHoldDialog";
import { InvoiceDialog } from "@/components/admin/InvoiceDialog";
import { PaymentDialog } from "@/components/admin/PaymentDialog";
import { type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import { formatCurrencyValue, formatDate, titleize } from "@/lib/formatters";

interface AdminFinanceResponse {
  summary: {
    outstanding_balance: number;
    total_invoices: number;
    open_invoices: number;
    active_holds: number;
    confirmed_payments: number;
  };
  invoices: Array<{
    id: number;
    student_id: number;
    academic_term_id: number | null;
    invoice_number: string;
    student_name: string;
    term_name: string | null;
    issue_date: string;
    total_amount: number;
    balance_amount: number;
    due_date: string;
    status: string;
    description: string | null;
    notes: string | null;
  }>;
  holds: Array<{
    id: number;
    student_id: number;
    student_name: string;
    hold_type: string;
    reason: string;
    status: string;
    placed_at: string;
    released_at: string | null;
  }>;
  payments: Array<{
    id: number;
    student_id: number;
    student_name: string;
    reference_number: string | null;
    payment_method: string;
    amount: number;
    currency: string;
    paid_at: string;
    status: string;
    notes: string | null;
    invoice_id: number | null;
    invoice_number: string | null;
  }>;
}

function getFinanceVariant(status: string) {
  if (status === "paid" || status === "clear" || status === "confirmed" || status === "released") {
    return "success" as const;
  }

  if (status === "partial" || status === "partially_paid" || status === "active") {
    return "warning" as const;
  }

  if (status === "overdue") {
    return "danger" as const;
  }

  return "info" as const;
}

export default function AdminFinance() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AdminFinanceResponse["invoices"][number] | null>(null);
  const [editingPayment, setEditingPayment] = useState<AdminFinanceResponse["payments"][number] | null>(null);
  const [editingHold, setEditingHold] = useState<AdminFinanceResponse["holds"][number] | null>(null);

  const financeQuery = useQuery({
    queryKey: ["finance", "overview"],
    queryFn: () => apiGet<AdminFinanceResponse>("/finance/overview"),
  });

  const referenceDataQuery = useQuery({
    queryKey: ["finance", "reference-data"],
    queryFn: () => apiGet<AdminReferenceData>("/finance/reference-data"),
  });

  const releaseHoldMutation = useMutation({
    mutationFn: (holdId: number) => apiPut(`/finance/holds/${holdId}/release`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: "Hold released",
        description: "The finance record has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to release hold",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const filteredInvoices = useMemo(
    () =>
      (financeQuery.data?.invoices ?? []).filter((invoice) =>
        `${invoice.student_name} ${invoice.invoice_number} ${invoice.term_name ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [financeQuery.data?.invoices, search],
  );

  const closeInvoiceDialog = (open: boolean) => {
    setInvoiceOpen(open);
    if (!open) {
      setEditingInvoice(null);
    }
  };

  const closePaymentDialog = (open: boolean) => {
    setPaymentOpen(open);
    if (!open) {
      setEditingPayment(null);
    }
  };

  const closeHoldDialog = (open: boolean) => {
    setHoldOpen(open);
    if (!open) {
      setEditingHold(null);
    }
  };

  if (financeQuery.isLoading || referenceDataQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (financeQuery.isError) {
    return (
      <ErrorState
        description={financeQuery.error instanceof Error ? financeQuery.error.message : "Finance overview could not be loaded."}
        onRetry={() => void financeQuery.refetch()}
      />
    );
  }

  if (referenceDataQuery.isError || !referenceDataQuery.data) {
    return (
      <ErrorState
        description={referenceDataQuery.error instanceof Error ? referenceDataQuery.error.message : "Reference data could not be loaded."}
        onRetry={() => void referenceDataQuery.refetch()}
      />
    );
  }

  const finance = financeQuery.data;
  if (!finance) {
    return <EmptyState title="No finance data yet" description="Manual invoice, payment, and hold records will appear here once finance staff adds them." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Records" description="Manage staff-entered invoices, payment notes, balances, and account holds">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingPayment(null);
            setPaymentOpen(true);
          }}
        >
          <CircleDollarSign className="mr-2 h-4 w-4" /> Add Payment
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingHold(null);
            setHoldOpen(true);
          }}
        >
          <AlertTriangle className="mr-2 h-4 w-4" /> Add Hold
        </Button>
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => {
            setEditingInvoice(null);
            setInvoiceOpen(true);
          }}
        >
          <Receipt className="mr-2 h-4 w-4" /> Add Invoice
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Outstanding Balance"
          value={formatCurrencyValue(finance.summary.outstanding_balance)}
          subtitle={`${finance.summary.open_invoices} open invoice records`}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Invoice Records"
          value={finance.summary.total_invoices}
          subtitle="Non-void records on file"
          icon={Landmark}
          variant="primary"
        />
        <StatCard
          title="Payments Recorded"
          value={formatCurrencyValue(finance.summary.confirmed_payments)}
          subtitle={`${finance.payments.length} recent staff entries`}
          icon={CircleDollarSign}
          variant="success"
        />
        <StatCard title="Active Holds" value={finance.summary.active_holds} subtitle="Manual hold records" icon={AlertTriangle} variant="info" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-foreground">Invoice Records</h3>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student or invoice..." className="pl-9" />
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState title="No invoices found" description="Try a different search or add the first invoice record." />
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{invoice.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.invoice_number} - {invoice.term_name ?? "No term linked"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold text-foreground">{formatCurrencyValue(invoice.balance_amount)}</p>
                      <StatusBadge variant={getFinanceVariant(invoice.status)}>{titleize(invoice.status)}</StatusBadge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInvoice(invoice);
                          setInvoiceOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Issued {formatDate(invoice.issue_date)}</span>
                    <span>Due {formatDate(invoice.due_date)}</span>
                    <span>Total {formatCurrencyValue(invoice.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border bg-card p-5 shadow-card"
        >
          <h3 className="mb-4 font-semibold text-foreground">Account Holds</h3>
          {finance.holds.length === 0 ? (
            <EmptyState title="No hold records" description="Student account holds will appear here once finance staff adds them." />
          ) : (
            <div className="space-y-3">
              {finance.holds.map((hold) => (
                <div key={hold.id} className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{hold.student_name}</p>
                        <p className="text-xs text-muted-foreground">{hold.reason}</p>
                      </div>
                      <StatusBadge variant={getFinanceVariant(hold.status)}>{titleize(hold.status)}</StatusBadge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{titleize(hold.hold_type)} - {formatDate(hold.placed_at)}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingHold(hold);
                            setHoldOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        {hold.status === "active" ? (
                          <Button variant="outline" size="sm" onClick={() => releaseHoldMutation.mutate(hold.id)} disabled={releaseHoldMutation.isPending}>
                            Release
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-xl border bg-card p-5 shadow-card"
      >
        <h3 className="mb-4 font-semibold text-foreground">Payment Records</h3>
        {finance.payments.length === 0 ? (
          <EmptyState title="No payment records yet" description="Staff-entered payment records will appear here." />
        ) : (
          <div className="space-y-3">
            {finance.payments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.reference_number ?? "No reference"} {payment.invoice_number ? `- ${payment.invoice_number}` : "- Unlinked"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">{formatCurrencyValue(payment.amount, payment.currency)}</p>
                  <StatusBadge variant={getFinanceVariant(payment.status)}>{titleize(payment.status)}</StatusBadge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPayment(payment);
                      setPaymentOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <InvoiceDialog open={invoiceOpen} onOpenChange={closeInvoiceDialog} referenceData={referenceDataQuery.data} invoice={editingInvoice} />
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={closePaymentDialog}
        referenceData={referenceDataQuery.data}
        invoices={finance.invoices}
        payment={editingPayment}
      />
      <FinancialHoldDialog open={holdOpen} onOpenChange={closeHoldDialog} referenceData={referenceDataQuery.data} hold={editingHold} />
    </div>
  );
}
