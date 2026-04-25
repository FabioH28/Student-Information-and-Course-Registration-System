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
import { apiPost } from "@/lib/api";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
}

interface InvoiceFormState {
  student_id: string;
  academic_term_id: string;
  issue_date: string;
  due_date: string;
  amount: string;
  description: string;
  notes: string;
}

function getDefaultState(referenceData: AdminReferenceData): InvoiceFormState {
  const today = new Date().toISOString().slice(0, 10);
  const currentTerm = referenceData.terms?.find((term) => term.is_current) ?? referenceData.terms?.[0] ?? null;

  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    academic_term_id: currentTerm ? String(currentTerm.id) : "none",
    issue_date: today,
    due_date: today,
    amount: "",
    description: "",
    notes: "",
  };
}

export function InvoiceDialog({ open, onOpenChange, referenceData }: InvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceFormState>(getDefaultState(referenceData));

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData));
    }
  }, [open, referenceData]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.issue_date || !form.due_date || !form.amount || !form.description.trim()) {
        throw new Error("Student, dates, amount, and description are required.");
      }

      return apiPost("/finance/invoices", {
        student_id: Number(form.student_id),
        academic_term_id: form.academic_term_id !== "none" ? Number(form.academic_term_id) : null,
        issue_date: form.issue_date,
        due_date: form.due_date,
        amount: Number(form.amount),
        description: form.description.trim(),
        notes: form.notes.trim() || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: "Invoice issued",
        description: "The new invoice is now available in finance operations.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to issue invoice",
        description: error instanceof Error ? error.message : "The invoice could not be created.",
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
          <DialogTitle>Issue Invoice</DialogTitle>
          <DialogDescription>Create a new student invoice and push it straight into the live finance queue.</DialogDescription>
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
            {mutation.isPending ? "Issuing..." : "Issue Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
