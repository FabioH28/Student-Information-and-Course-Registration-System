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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPut } from "@/lib/api";
import { titleize } from "@/lib/formatters";

export interface ClubJoinRequestItem {
  id: number;
  club_id: number;
  student_id: number;
  student_name: string;
  student_number: string;
  club_name: string;
  requested_role: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

interface ClubRequestReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: ClubJoinRequestItem | null;
}

type ReviewStatus = "approved" | "waitlisted" | "rejected";

export function ClubRequestReviewDialog({ open, onOpenChange, request }: ClubRequestReviewDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus>("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (!open || !request) {
      setReviewNotes("");
      return;
    }

    const initialStatus = request.status === "approved" || request.status === "waitlisted" || request.status === "rejected" ? request.status : "approved";
    setStatus(initialStatus);
    setReviewNotes(request.review_notes ?? "");
  }, [open, request]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) {
        throw new Error("Select a request first.");
      }

      return apiPut(`/communications/clubs/requests/${request.id}`, {
        status,
        review_notes: reviewNotes.trim() || null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["communications", "clubs"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "clubs"] }),
      ]);
      toast({
        title: "Request reviewed",
        description: `The request is now marked as ${titleize(status)}.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to review request",
        description: error instanceof Error ? error.message : "The request could not be updated.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Review Join Request</DialogTitle>
          <DialogDescription>Approve, waitlist, or reject the request and keep the student informed through their inbox.</DialogDescription>
        </DialogHeader>

        {!request ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{request.student_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{request.student_number}</p>
              <p className="mt-3 text-sm text-foreground">{request.club_name}</p>
              <p className="text-sm text-muted-foreground">Requested role: {titleize(request.requested_role)}</p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-review-notes">Review Notes</Label>
              <Textarea id="club-review-notes" rows={4} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Optional message for the student or internal reviewer notes" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending || !request}>
            {mutation.isPending ? "Saving..." : "Save Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
