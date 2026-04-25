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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

interface EditableHoldRecord {
  id: number;
  student_id: number;
  hold_type: string;
  reason: string;
  status: string;
}

interface FinancialHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
  hold?: EditableHoldRecord | null;
}

interface HoldFormState {
  student_id: string;
  hold_type: "finance" | "disciplinary" | "academic" | "administrative";
  status: "active" | "released";
  reason: string;
}

function getDefaultState(referenceData: AdminReferenceData, hold?: EditableHoldRecord | null): HoldFormState {
  if (hold) {
    return {
      student_id: String(hold.student_id),
      hold_type: hold.hold_type as HoldFormState["hold_type"],
      status: hold.status as HoldFormState["status"],
      reason: hold.reason,
    };
  }

  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    hold_type: "finance",
    status: "active",
    reason: "",
  };
}

export function FinancialHoldDialog({ open, onOpenChange, referenceData, hold }: FinancialHoldDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HoldFormState>(getDefaultState(referenceData, hold));
  const isEditing = Boolean(hold);

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData, hold));
    }
  }, [open, referenceData, hold]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.reason.trim()) {
        throw new Error("Student and hold reason are required.");
      }

      const payload = {
        student_id: Number(form.student_id),
        hold_type: form.hold_type,
        reason: form.reason.trim(),
      };

      if (hold) {
        return apiPut(`/finance/holds/${hold.id}`, {
          ...payload,
          status: form.status,
        });
      }

      return apiPost("/finance/holds", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: isEditing ? "Hold record updated" : "Hold record added",
        description: "Finance records now reflect the staff-entered information.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Unable to update hold record" : "Unable to add hold record",
        description: error instanceof Error ? error.message : "The hold record could not be saved.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Hold Record" : "Add Hold Record"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Correct the staff-maintained hold details for this student."
              : "Add a staff-maintained account hold record for finance review."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={form.student_id} onValueChange={(value) => setForm((current) => ({ ...current, student_id: value }))}>
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
            <Label>Hold Type</Label>
            <Select value={form.hold_type} onValueChange={(value) => setForm((current) => ({ ...current, hold_type: value as HoldFormState["hold_type"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select hold type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="disciplinary">Disciplinary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as HoldFormState["status"] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="hold-reason">Reason</Label>
            <Textarea id="hold-reason" rows={4} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Explain why the hold is being applied" />
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
