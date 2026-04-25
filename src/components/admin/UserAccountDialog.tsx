import { useEffect, useState } from "react";
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, ShieldCheck } from "lucide-react";

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
import { apiPost, apiPut } from "@/lib/api";
import { titleize } from "@/lib/formatters";
import { type AppRole } from "@/lib/rbac";

type AccountStatus = "pending" | "active" | "suspended" | "disabled";

interface ManagedUser {
  user_id: number;
  full_name: string;
  email: string;
  account_status: string;
  primary_role?: AppRole | null;
}

interface PasswordResetResult {
  user: {
    id: number;
    email: string;
    full_name: string;
    status: string;
  };
  temporary_password: string;
}

interface UserAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  availableRoles?: AppRole[];
  invalidateQueries?: QueryKey[];
}

function copyToClipboard(text: string, label: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast({
      title: "Clipboard unavailable",
      description: `Copy the ${label} manually.`,
    });
    return;
  }

  void navigator.clipboard.writeText(text).then(
    () => {
      toast({
        title: `${label} copied`,
        description: "The value is ready to paste.",
      });
    },
    () => {
      toast({
        title: "Copy failed",
        description: `Copy the ${label} manually.`,
      });
    },
  );
}

export function UserAccountDialog({
  open,
  onOpenChange,
  user,
  availableRoles,
  invalidateQueries = [],
}: UserAccountDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AccountStatus>("active");
  const [role, setRole] = useState<AppRole | "">("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      setTemporaryPassword(null);
      return;
    }

    setStatus((user.account_status as AccountStatus) ?? "active");
    setRole(user.primary_role ?? "");
  }, [open, user]);

  const invalidateAll = async () => {
    await Promise.all(
      invalidateQueries.map((queryKey) =>
        queryClient.invalidateQueries({
          queryKey,
        }),
      ),
    );
  };

  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Select an account first.");
      }

      return apiPut(`/system-admin/users/${user.user_id}/status`, {
        status,
      });
    },
    onSuccess: async () => {
      await invalidateAll();
      toast({
        title: "Account updated",
        description: `The account is now ${titleize(status)}.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to update account",
        description: error instanceof Error ? error.message : "The account status could not be updated.",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async () => {
      if (!user || !role) {
        throw new Error("Select a role first.");
      }

      return apiPut(`/system-admin/users/${user.user_id}/role`, {
        role,
      });
    },
    onSuccess: async () => {
      await invalidateAll();
      toast({
        title: "Role updated",
        description: `The account is now assigned to ${role}.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to update role",
        description: error instanceof Error ? error.message : "The role assignment could not be updated.",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Select an account first.");
      }

      return apiPost<PasswordResetResult>(`/system-admin/users/${user.user_id}/reset-password`, {});
    },
    onSuccess: async (payload) => {
      await invalidateAll();
      setTemporaryPassword(payload.temporary_password);
      toast({
        title: "Temporary password reset",
        description: "Share the new one-time password securely.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to reset password",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Account</DialogTitle>
          <DialogDescription>
            Update account access status, change the primary role, and reset a one-time password without leaving the system admin workspace.
          </DialogDescription>
        </DialogHeader>

        {!user ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AccountStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableRoles && availableRoles.length > 0 ? (
              <div className="space-y-2">
                <Label>Primary Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {roleOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {temporaryPassword ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">New Temporary Password</p>
                    <p className="mt-1 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm text-foreground">
                      {temporaryPassword}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(temporaryPassword, "temporary password")}>
                        <Copy className="mr-2 h-4 w-4" /> Copy password
                      </Button>
                      <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        User must change it on next sign-in
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => resetPasswordMutation.mutate()}
            disabled={!user || resetPasswordMutation.isPending || statusMutation.isPending || roleMutation.isPending}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset Temporary Password"}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={statusMutation.isPending || roleMutation.isPending}
            >
              Close
            </Button>
            {availableRoles && availableRoles.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => roleMutation.mutate()}
                disabled={!user || !role || roleMutation.isPending || statusMutation.isPending}
              >
                {roleMutation.isPending ? "Saving Role..." : "Save Role"}
              </Button>
            ) : null}
            <Button
              type="button"
              className="gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => statusMutation.mutate()}
              disabled={!user || statusMutation.isPending || roleMutation.isPending}
            >
              {statusMutation.isPending ? "Saving..." : "Save Status"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
