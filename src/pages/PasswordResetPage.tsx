import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";
import { AuthSession } from "@/lib/auth";
import { getRoleHome } from "@/lib/rbac";

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const mutation = useMutation({
    mutationFn: () => apiPost<AuthSession>("/auth/password-reset/confirm", { token, password }),
    onSuccess: (session) => {
      login(session, true);
      toast({
        title: "Password reset complete",
        description: "Your password has been updated and your session is ready.",
      });

      if (session.user.must_change_password) {
        navigate("/account/change-password", { replace: true });
        return;
      }

      navigate(getRoleHome(session.user.primary_role), { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Unable to reset password",
        description: error instanceof Error ? error.message : "Please request a new reset link and try again.",
      });
    },
  });

  const passwordsMatch = password.trim().length >= 8 && password === confirmPassword;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6 sm:p-12">
      <div className="absolute right-6 top-6">
        <ThemeToggle compact />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-card sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground">Set a new password to regain access to CIS.</p>
          </div>
        </div>

        {!hasToken ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <p className="text-sm font-semibold text-foreground">Password resets are handled by your System Administrator.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Contact your System Admin and ask them to reset your password from the Staff Management panel.
                You will receive a temporary password and be prompted to choose a new one on first sign-in.
              </p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/", { replace: true })}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!passwordsMatch) {
                toast({
                  title: "Passwords do not match",
                  description: "Make sure both password fields match and meet the minimum length.",
                });
                return;
              }

              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  placeholder="Choose a strong new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pr-10"
                  placeholder="Repeat the new password"
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
              Use at least 8 characters. A longer password or passphrase is strongly recommended for campus accounts.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
                Back to Sign In
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90" disabled={mutation.isPending || !passwordsMatch}>
                {mutation.isPending ? "Resetting..." : "Set New Password"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
