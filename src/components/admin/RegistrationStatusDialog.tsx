import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { toast } from "@/components/ui/use-toast";
import { apiPut } from "@/lib/api";
import { titleize } from "@/lib/formatters";

export interface RegistrationItem {
  enrollment_id: number;
  student_name: string;
  student_number: string;
  course_title: string;
  course_code: string;
  section_code: string;
  term_name: string;
  registered_at: string;
  approved_at: string | null;
  dropped_at: string | null;
  completed_at: string | null;
  status: string;
}

interface RegistrationStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration?: RegistrationItem | null;
}

type RegistrationStatus = "pending" | "enrolled" | "waitlisted" | "dropped" | "withdrawn" | "completed" | "failed";

export function RegistrationStatusDialog({ open, onOpenChange, registration }: RegistrationStatusDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RegistrationStatus>("pending");

  useEffect(() => {
    if (registration) {
      setStatus(registration.status as RegistrationStatus);
    }
  }, [registration, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!registration) {
        throw new Error("Select a registration first.");
      }

      return apiPut(`/academic/registrations/${registration.enrollment_id}/status`, {
        status,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["academic", "registrations"] });
      toast({
        title: "Registration updated",
        description: `The registration is now marked as ${titleize(status)}.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to update registration",
        description: error instanceof Error ? error.message : "The registration status could not be updated.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Registration</DialogTitle>
          <DialogDescription>
            Update the student's registration state so the academic workflow stays aligned across dashboards, rosters, and records.
          </DialogDescription>
        </DialogHeader>

        {!registration ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{registration.student_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{registration.student_number}</p>
              <p className="mt-3 text-sm text-foreground">
                {registration.course_code} - {registration.course_title}
              </p>
              <p className="text-sm text-muted-foreground">
                {registration.term_name} · Section {registration.section_code}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as RegistrationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending || !registration}>
            {mutation.isPending ? "Saving..." : "Save Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
