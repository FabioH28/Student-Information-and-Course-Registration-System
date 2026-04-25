import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";
import { AuthSession } from "@/lib/auth";
import { getRoleHome } from "@/lib/rbac";

export default function AccountPasswordPage() {
  const navigate = useNavigate();
  const { session, updateSession, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const mustChangePassword = Boolean(session?.user.must_change_password);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<AuthSession>("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: (nextSession) => {
      updateSession(nextSession);
      toast({
        title: "Password updated",
        description: mustChangePassword
          ? "Your account is now fully activated."
          : "Your password has been changed successfully.",
      });
      navigate(getRoleHome(nextSession.user.primary_role), { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Unable to update password",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  const passwordsMatch = newPassword.trim().length >= 8 && newPassword === confirmPassword && newPassword !== currentPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 sm:p-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-card sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {mustChangePassword ? "Set Your Permanent Password" : "Change Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mustChangePassword
                ? "Your account was provisioned with a temporary password. Set a personal one before continuing."
                : "Update your CIS password to keep your account secure."}
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!passwordsMatch) {
              toast({
                title: "Check your new password",
                description: "Make sure the new password is at least 8 characters, matches the confirmation, and is different from the current password.",
              });
              return;
            }

            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
            After a successful password change, all older refresh tokens are revoked so only the new session remains active.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => logout()}>
              Sign Out
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90" disabled={mutation.isPending || !passwordsMatch}>
              {mutation.isPending ? "Saving..." : mustChangePassword ? "Activate Account" : "Update Password"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
