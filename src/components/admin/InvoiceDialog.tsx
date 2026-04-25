import { useEffect, useState } from "react";
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

interface EditableInvoiceRecord {
  id: number;
  student_id: number;
  academic_term_id: number | null;
  issue_date: string;
  due_date: string;
  total_amount: number;
  balance_amount: number;
  status: string;
  description: string | null;
  notes: string | null;
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  invoice?: EditableInvoiceRecord | null;
}

interface InvoiceFormState {
  student_id: string;
  academic_term_id: string;
  issue_date: string;
  due_date: string;
  amount: string;
  balance_amount: string;
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "void";
  description: string;
  notes: string;
}

function getDefaultState(referenceData: AdminReferenceData, invoice?: EditableInvoiceRecord | null): InvoiceFormState {
  const today = new Date().toISOString().slice(0, 10);
  const currentTerm = referenceData.terms?.find((term) => term.is_current) ?? referenceData.terms?.[0] ?? null;

  if (invoice) {
    return {
      student_id: String(invoice.student_id),
      academic_term_id: invoice.academic_term_id ? String(invoice.academic_term_id) : "none",
      issue_date: invoice.issue_date.slice(0, 10),
      due_date: invoice.due_date.slice(0, 10),
      amount: String(Number(invoice.total_amount ?? 0)),
      balance_amount: String(Number(invoice.balance_amount ?? 0)),
      status: invoice.status as InvoiceFormState["status"],
      description: invoice.description ?? "",
      notes: invoice.notes ?? "",
    };
  }

  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    academic_term_id: currentTerm ? String(currentTerm.id) : "none",
    issue_date: today,
    due_date: today,
    amount: "",
    balance_amount: "",
    status: "issued",
    description: "",
    notes: "",
  };
}

export function InvoiceDialog({ open, onOpenChange, referenceData, invoice }: InvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceFormState>(getDefaultState(referenceData, invoice));
  const isEditing = Boolean(invoice);

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData, invoice));
    }
  }, [open, referenceData, invoice]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.issue_date || !form.due_date || !form.amount || !form.description.trim()) {
        throw new Error("Student, dates, amount, and description are required.");
      }
      if (isEditing && form.balance_amount === "") {
        throw new Error("Balance is required when editing an invoice record.");
      }

      const payload = {
        student_id: Number(form.student_id),
        academic_term_id: form.academic_term_id !== "none" ? Number(form.academic_term_id) : null,
        issue_date: form.issue_date,
        due_date: form.due_date,
        amount: Number(form.amount),
        description: form.description.trim(),
        notes: form.notes.trim() || null,
      };

      if (invoice) {
        return apiPut(`/finance/invoices/${invoice.id}`, {
          ...payload,
          balance_amount: Number(form.balance_amount),
          status: form.status,
        });
      }

      return apiPost("/finance/invoices", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: isEditing ? "Invoice record updated" : "Invoice record added",
        description: "Finance records now reflect the staff-entered information.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Unable to update invoice record" : "Unable to add invoice record",
        description: error instanceof Error ? error.message : "The invoice record could not be saved.",
      });
    },
  });

  const setField = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice Record" : "Add Invoice Record"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Correct the staff-maintained invoice details for this student."
              : "Create a staff-maintained invoice record for a student account."}
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
            <Label>Academic Term</Label>
            <Select value={form.academic_term_id} onValueChange={(value) => setField("academic_term_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked term</SelectItem>
                {(referenceData.terms ?? []).map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-amount">Amount</Label>
            <Input id="invoice-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setField("amount", event.target.value)} />
          </div>

          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="invoice-balance">Balance</Label>
                <Input
                  id="invoice-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance_amount}
                  onChange={(event) => setField("balance_amount", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as InvoiceFormState["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="invoice-issue-date">Issue Date</Label>
            <Input id="invoice-issue-date" type="date" value={form.issue_date} onChange={(event) => setField("issue_date", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-due-date">Due Date</Label>
            <Input id="invoice-due-date" type="date" value={form.due_date} onChange={(event) => setField("due_date", event.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invoice-description">Line Item Description</Label>
            <Input id="invoice-description" value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Tuition installment, lab fee, or similar" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invoice-notes">Internal Notes</Label>
            <Textarea id="invoice-notes" rows={3} value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Optional finance notes" />
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
