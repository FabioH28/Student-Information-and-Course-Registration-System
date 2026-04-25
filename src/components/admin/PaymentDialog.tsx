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
import { apiPost } from "@/lib/api";

interface FinanceInvoiceOption {
  id: number;
  student_id: number;
  invoice_number: string;
  balance_amount: number;
  status: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  invoices: FinanceInvoiceOption[];
}

interface PaymentFormState {
  student_id: string;
  invoice_id: string;
  amount: string;
  payment_method: "cash" | "card" | "bank_transfer" | "online";
  paid_at: string;
  reference_number: string;
  notes: string;
}

function getDefaultState(referenceData: AdminReferenceData): PaymentFormState {
  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    invoice_id: "none",
    amount: "",
    payment_method: "card",
    paid_at: new Date().toISOString().slice(0, 16),
    reference_number: "",
    notes: "",
  };
}

export function PaymentDialog({ open, onOpenChange, referenceData, invoices }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PaymentFormState>(getDefaultState(referenceData));

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData));
    }
  }, [open, referenceData]);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          String(invoice.student_id) === form.student_id && invoice.status !== "paid" && invoice.status !== "void" && Number(invoice.balance_amount) > 0,
      ),
    [form.student_id, invoices],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.amount || !form.paid_at) {
        throw new Error("Student, amount, and payment date are required.");
      }

      return apiPost("/finance/payments", {
        student_id: Number(form.student_id),
        invoice_id: form.invoice_id !== "none" ? Number(form.invoice_id) : null,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        paid_at: form.paid_at,
        reference_number: form.reference_number.trim() || null,
        notes: form.notes.trim() || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: "Payment recorded",
        description: "The transaction is now reflected in the finance overview.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to record payment",
        description: error instanceof Error ? error.message : "The payment could not be posted.",
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
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Post a payment, optionally link it to an open invoice, and update the student balance immediately.</DialogDescription>
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
            <Label>Apply to Invoice</Label>
            <Select value={form.invoice_id} onValueChange={(value) => setField("invoice_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unallocated payment</SelectItem>
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
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            {mutation.isPending ? "Posting..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
