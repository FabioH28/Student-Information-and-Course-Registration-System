import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, Users, CalendarDays, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { requestPasswordReset, confirmPasswordReset } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const roleRoutes: Record<string, string> = {
  student: "/student",
  instructor: "/instructor",
  academic_staff: "/academic-staff",
  finance_staff: "/finance-staff",
  system_admin: "/admin",
};

type ForgotStep = "email" | "reset" | "done";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitEmail = async () => {
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("reset");
    } catch (e: any) {
      setError(e.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(token, newPassword);
      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "Reset failed. Check your code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border shadow-xl p-8 w-full max-w-md mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>

        {step === "email" && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-1">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your university email address and we'll send you a reset code.</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="reset-email">Email address</Label>
                <Input id="reset-email" type="email" placeholder="your@university.edu" className="mt-1.5"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitEmail()} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                onClick={submitEmail} disabled={!email || loading}>
                {loading ? "Sending…" : "Send Verification Code"}
              </Button>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Check your email</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A 6-digit code was sent to <strong>{email}</strong>. Expires in 10 minutes.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Verification Code</Label>
                <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={token} onChange={setToken}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div>
                <Label htmlFor="new-pass">New Password</Label>
                <Input id="new-pass" type="password" placeholder="At least 8 characters" className="mt-1.5"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirm-pass">Confirm Password</Label>
                <Input id="confirm-pass" type="password" placeholder="Repeat new password" className="mt-1.5"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitReset()} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                onClick={submitReset} disabled={token.length < 6 || !newPassword || !confirmPassword || loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </Button>
              <button onClick={() => setStep("email")} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">← Back</button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Password Reset</h2>
            <p className="text-sm text-muted-foreground mb-6">Your password has been changed. You can now sign in.</p>
            <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90" onClick={onClose}>Back to Sign In</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const highlights = [
  { icon: BookOpen,     label: "Course Registration",  desc: "Enroll in courses and manage your semester" },
  { icon: GraduationCap, label: "Academic Records",   desc: "Grades, transcripts and GPA tracking" },
  { icon: CalendarDays, label: "Timetable & Attendance", desc: "Weekly schedule and attendance history" },
  { icon: Users,        label: "Staff & Finance",      desc: "Invoices, holds, and advising support" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signIn(email, password);
      navigate(roleRoutes[data.role] ?? "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-muted/30 border-r border-border p-12">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">CampusIS</p>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Student Information System</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Your university,<br />all in one place.
          </h1>
          <p className="text-muted-foreground text-base mb-12">
            Manage courses, track academic progress, view financial records and communicate with staff — from one platform.
          </p>

          <div className="space-y-5">
            {highlights.map((h, i) => (
              <motion.div key={h.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <h.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{h.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground mt-12">
          © {new Date().getFullYear()} Campus Information System. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">CampusIS</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Student Information System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">Use your university credentials to access the portal.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@university.edu" className="h-11"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="h-11 pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="h-11 w-full gradient-primary font-medium text-primary-foreground transition-opacity hover:opacity-90">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Request access</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
