import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function ChangePasswordModal() {
  const { clearPasswordChange, signOut } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await changePassword(current, next);
      toast({ title: "Password changed successfully" });
      clearPasswordChange();
    } catch (e: any) {
      setError(e.message ?? "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl gradient-primary">
            <KeyRound className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Change Your Password</h2>
            <p className="text-xs text-muted-foreground">You must set a new password before continuing.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Password</label>
            <Input type="password" placeholder="Enter current password" value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
            <Input type="password" placeholder="At least 8 characters" value={next} onChange={e => setNext(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
            <Input type="password" placeholder="Repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
            onClick={submit} disabled={!current || !next || !confirm || loading}>
            {loading ? "Saving…" : "Set New Password"}
          </Button>
          <Button variant="outline" onClick={signOut}>Logout</Button>
        </div>
      </div>
    </div>
  );
}
