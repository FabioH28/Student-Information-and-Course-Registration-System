import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, MailCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

interface PasswordResetRequestResponse {
  message: string;
  preview_reset_token?: string | null;
}

export function ForgotPasswordDialog({ open, onOpenChange, defaultEmail = "" }: ForgotPasswordDialogProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(defaultEmail);
  const [result, setResult] = useState<PasswordResetRequestResponse | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setResult(null);
    }
  }, [defaultEmail, open]);

  const resetLink = useMemo(() => {
    if (!result?.preview_reset_token) {
      return null;
    }

    return `/reset-password?token=${encodeURIComponent(result.preview_reset_token)}`;
  }, [result?.preview_reset_token]);

  const mutation = useMutation({
    mutationFn: () => apiPost<PasswordResetRequestResponse>("/auth/password-reset/request", { email }),
    onSuccess: (payload) => {
      setResult(payload);
      toast({
        title: "Reset instructions prepared",
        description: payload.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to prepare reset request",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            Enter your campus email and CIS will prepare a secure reset flow. In production this would be delivered to your mailbox.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Institutional Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your.name@campus.edu"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">{result.message}</p>
                {resetLink ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Local preview token detected, so you can continue the reset flow directly from this environment.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(resetLink);
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Reset Page
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    If no preview link is available, a System Admin can still issue a temporary password from the system admin workspace.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => mutation.mutate()}
              disabled={!email.trim() || mutation.isPending}
            >
              {mutation.isPending ? "Preparing..." : "Request Reset"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
