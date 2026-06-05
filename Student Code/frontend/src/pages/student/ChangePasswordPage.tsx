import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { changePassword } from "@/lib/api";

const MIN_LENGTH = 8;

function strength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= MIN_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Fair", color: "bg-warning" };
  if (score === 4) return { score, label: "Good", color: "bg-info" };
  return { score, label: "Strong", color: "bg-success" };
}

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast({ title: "Password updated", description: "Use your new password next time you sign in." });
      setCurrent(""); setNext(""); setConfirm("");
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const s = strength(next);
  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && next !== confirm;
  const sameAsCurrent = next.length > 0 && current.length > 0 && next === current;
  const canSubmit = current.length > 0 && next.length >= MIN_LENGTH && next === confirm && !sameAsCurrent && !mutation.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Change Password" description="Keep your CIS account secure" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-xl bg-primary/15 p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Choose a strong password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              At least {MIN_LENGTH} characters. Mix uppercase, lowercase, numbers, and a symbol for the best protection.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
        className="space-y-5 rounded-xl border bg-card p-6 shadow-card"
      >
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="current"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Your current password"
              className="pl-9 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next">New password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="next"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder={`At least ${MIN_LENGTH} characters`}
              className="pl-9 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNext ? "Hide password" : "Show password"}
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {next.length > 0 && (
            <div className="space-y-1">
              <div className="flex h-1.5 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${i < s.score ? s.color : "bg-muted"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{s.label}</span></p>
            </div>
          )}
          {tooShort && <p className="text-xs text-destructive">Password must be at least {MIN_LENGTH} characters.</p>}
          {sameAsCurrent && <p className="text-xs text-destructive">New password must be different from your current password.</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showNext ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
          {mismatch && <p className="text-xs text-destructive">Passwords don't match.</p>}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setCurrent(""); setNext(""); setConfirm(""); }}
            disabled={mutation.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {mutation.isPending ? "Updating..." : "Update password"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
