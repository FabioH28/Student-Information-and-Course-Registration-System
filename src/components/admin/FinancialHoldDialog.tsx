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
import { apiPost } from "@/lib/api";

interface FinancialHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: AdminReferenceData;
}

interface HoldFormState {
  student_id: string;
  hold_type: "finance" | "disciplinary" | "academic" | "administrative";
  reason: string;
}

function getDefaultState(referenceData: AdminReferenceData): HoldFormState {
  return {
    student_id: referenceData.students?.[0] ? String(referenceData.students[0].student_id) : "",
    hold_type: "finance",
    reason: "",
  };
}

export function FinancialHoldDialog({ open, onOpenChange, referenceData }: FinancialHoldDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HoldFormState>(getDefaultState(referenceData));

  useEffect(() => {
    if (open) {
      setForm(getDefaultState(referenceData));
    }
  }, [open, referenceData]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.student_id || !form.reason.trim()) {
        throw new Error("Student and hold reason are required.");
      }

      return apiPost("/finance/holds", {
        student_id: Number(form.student_id),
        hold_type: form.hold_type,
        reason: form.reason.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast({
        title: "Hold placed",
        description: "The student account now reflects the new hold.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to place hold",
        description: error instanceof Error ? error.message : "The hold could not be created.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Place Hold</DialogTitle>
          <DialogDescription>Use this when a student account needs a blocking flag for finance, administration, or compliance.</DialogDescription>
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
            {mutation.isPending ? "Saving..." : "Place Hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
