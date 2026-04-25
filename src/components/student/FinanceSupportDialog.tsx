import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";

interface FinanceSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FinanceSupportResponse {
  status: string;
  message: string;
}

type FinanceRequestType = "billing_question" | "payment_plan" | "hold_review" | "statement_request";

const requestTypeLabels: Record<FinanceRequestType, string> = {
  billing_question: "Billing question",
  payment_plan: "Payment plan",
  hold_review: "Hold review",
  statement_request: "Statement request",
};

export function FinanceSupportDialog({ open, onOpenChange }: FinanceSupportDialogProps) {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState<FinanceRequestType>("billing_question");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setRequestType("billing_question");
      setMessage("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<FinanceSupportResponse>("/students/me/finance/support-request", {
        request_type: requestType,
        message,
      }),
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student", "finance"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "inbox"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] }),
      ]);
      toast({
        title: "Request submitted",
        description: payload.message,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to send request",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  const canSubmit = message.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request Finance Support</DialogTitle>
          <DialogDescription>
            Send a structured request to the finance office when you need billing clarification, a payment plan, a hold review, or a formal statement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select value={requestType} onValueChange={(value) => setRequestType(value as FinanceRequestType)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose request type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="finance-message">Message</Label>
            <Textarea
              id="finance-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Explain what you need help with, including invoice numbers or hold details if relevant."
              className="min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground">
              Your note will be delivered to the finance office and a confirmation will appear in your inbox.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
