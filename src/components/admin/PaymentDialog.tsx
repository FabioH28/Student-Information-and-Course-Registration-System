import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AdminReferenceData } from "@/components/admin/UserProvisionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

interface FinanceInvoiceOption {
  id: number;
  student_id: number;
  invoice_number: string;
  balance_amount: number;
  status: string;
}

interface EditablePaymentRecord {
  id: number;
  student_id: number;
  invoice_id: number | null;
  reference_number: string | null;
  payment_method: string;
  amount: number;
  paid_at: string;
  status: string;
  notes: string | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  invoices: FinanceInvoiceOption[];
  payment?: EditablePaymentRecord | null;
}

interface PaymentFormState {
  student_id: string;
  invoice_id: string;
  amount: string;
  payment_method: "cash" | "card" | "bank_transfer" | "online";
  paid_at: string;
  status: "pending" | "confirmed" | "failed" | "refunded";
  reference_number: string;
  notes: string;
}

function getDefaultState(referenceData: AdminReferenceData, payment?: EditablePaymentRecord | null): PaymentFormState {
  if (payment) {
    return {
      student_id: String(payment.student_id),
      invoice_id: payment.invoice_id ? String(payment.invoice_id) : "none",
      amount: String(Number(payment.amount ?? 0)),
      payment_method: payment.payment_method as PaymentFormState["payment_method"],
      paid_at: payment.paid_at.slice(0, 16),
      status: payment.status as PaymentFormState["status"],
      reference_number: payment.reference_number ?? "",
      notes: payment.notes ?? "",
    };
  }

  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    invoice_id: "none",
    amount: "",
    payment_method: "card",
    paid_at: new Date().toISOString().slice(0, 16),
    status: "confirmed",
    reference_number: "",
    notes: "",
  };
}

export function PaymentDialog({ open, onOpenChange, referenceData, invoices, payment }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PaymentFormState>(getDefaultState(referenceData, payment));
  const isEditing = Boolean(payment);

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData, payment));
    }
  }, [open, referenceData, payment]);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          String(invoice.student_id) === form.student_id &&
          (String(invoice.id) === form.invoice_id || (invoice.status !== "paid" && invoice.status !== "void" && Number(invoice.balance_amount) > 0)),
      ),
    [form.invoice_id, form.student_id, invoices],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.amount || !form.paid_at) {
        throw new Error("Student, amount, and payment date are required.");
      }

      const payload = {
        student_id: Number(form.student_id),
        invoice_id: form.invoice_id !== "none" ? Number(form.invoice_id) : null,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        paid_at: form.paid_at,
        reference_number: form.reference_number.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (payment) {
        return apiPut(`/finance/payments/${payment.id}`, {
          ...payload,
          status: form.status,
        });
      }

      return apiPost("/finance/payments", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: isEditing ? "Payment record updated" : "Payment record added",
        description: "Finance records now reflect the staff-entered information.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Unable to update payment record" : "Unable to add payment record",
        description: error instanceof Error ? error.message : "The payment record could not be saved.",
      });
    },
  });

  const setField = <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment Record" : "Add Payment Record"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Correct the staff-maintained payment details for this student."
              : "Add a payment record from finance staff records; no online payment is processed here."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Student</Label>
            <Select value={form.student_id} onValueChange={(value) => setField("student_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {(referenceData.students ?? []).map((student) => (
                  <SelectItem key={student.student_id} value={String(student.student_id)}>
                    {student.full_name} ({student.student_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Linked Invoice</Label>
            <Select value={form.invoice_id} onValueChange={(value) => setField("invoice_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unlinked record</SelectItem>
                {filteredInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoice.invoice_number} ({Number(invoice.balance_amount).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input id="payment-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setField("amount", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={form.payment_method} onValueChange={(value) => setField("payment_method", value as PaymentFormState["payment_method"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">External Online Record</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value as PaymentFormState["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="payment-paid-at">Paid At</Label>
            <Input id="payment-paid-at" type="datetime-local" value={form.paid_at} onChange={(event) => setField("paid_at", event.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-reference">Reference Number</Label>
            <Input id="payment-reference" value={form.reference_number} onChange={(event) => setField("reference_number", event.target.value)} placeholder="Optional custom payment reference" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea id="payment-notes" rows={3} value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Optional payment notes" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEditing ? "Save Record" : "Add Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
