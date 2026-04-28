import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { verifyEmail } from "@/lib/api";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await verifyEmail(emailFromState, code);
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">CampusIS</span>
        </div>

        {!done ? (
          <div className="bg-card rounded-2xl border shadow-card p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              We sent a 6-digit code to <strong>{emailFromState || "your email"}</strong>. Enter it below to confirm your address.
            </p>

            <div className="mb-6">
              <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              onClick={submit} disabled={code.length < 6 || loading}>
              {loading ? "Verifying…" : "Verify Email"}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Didn't receive the code? Check your spam folder or{" "}
              <Link to="/register" className="text-primary hover:underline">try registering again</Link>.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Email verified!</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Your account is now pending administrator approval.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You'll receive an email at <strong>{emailFromState}</strong> once your account has been reviewed.
            </p>
            <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/")}>
              Back to Sign In
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
