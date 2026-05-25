import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, BookOpen, Users, CalendarDays, GraduationCap,
  X, Mail, Loader2, Sparkles, ChevronDown, Lock, ArrowRight,
  Wallet, Shield, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { requestPasswordReset, confirmPasswordReset } from "@/lib/api";
import { homeRouteForRole } from "@/lib/authRoles";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

type ForgotStep = "email" | "reset" | "done";

const DEMO_ACCOUNTS = [
  { role: "Student",        email: "alice.smith@cis.edu",     icon: GraduationCap, color: "from-blue-500 to-blue-600" },
  { role: "Instructor",     email: "john.carter@cis.edu",     icon: BookOpen,      color: "from-purple-500 to-purple-600" },
  { role: "Academic Staff", email: "rebecca.morgan@cis.edu",  icon: Briefcase,     color: "from-emerald-500 to-emerald-600" },
  { role: "Finance Staff",  email: "finance.csit@cis.edu",    icon: Wallet,        color: "from-amber-500 to-amber-600" },
  { role: "System Admin",   email: "admin@cis.edu",           icon: Shield,        color: "from-rose-500 to-rose-600" },
];

const HIGHLIGHTS = [
  { icon: BookOpen,      label: "Course Registration",    desc: "Enroll and manage your semester" },
  { icon: GraduationCap, label: "Academic Records",        desc: "Grades, transcripts and GPA" },
  { icon: CalendarDays,  label: "Timetable & Attendance",  desc: "Weekly schedule and history" },
  { icon: Users,         label: "Communications",          desc: "News, events and messaging" },
];

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitEmail = async () => {
    setError(""); setLoading(true);
    try { await requestPasswordReset(email); setStep("reset"); }
    catch (e: any) { setError(e.message ?? "Request failed"); }
    finally { setLoading(false); }
  };

  const submitReset = async () => {
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try { await confirmPasswordReset(token, newPassword); setStep("done"); }
    catch (e: any) { setError(e.message ?? "Reset failed. Check your code."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative w-full max-w-md rounded-2xl border bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
          <X className="h-4 w-4" />
        </button>

        {step === "email" && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Reset password</h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Enter your CIS email and we'll send a verification code.</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="reset-email">Email address</Label>
                <Input id="reset-email" type="email" placeholder="your@cis.edu" className="mt-1.5 h-11"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEmail()} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="h-11 w-full" onClick={submitEmail} disabled={!email || loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Send verification code"}
              </Button>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Check your email</h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              A 6-digit code was sent to <strong>{email}</strong>. Expires in 10 minutes.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Verification code</Label>
                <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={token} onChange={setToken}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div>
                <Label htmlFor="new-pass">New password</Label>
                <Input id="new-pass" type="password" placeholder="At least 8 characters" className="mt-1.5 h-11"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirm-pass">Confirm password</Label>
                <Input id="confirm-pass" type="password" placeholder="Repeat new password" className="mt-1.5 h-11"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitReset()} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="h-11 w-full" onClick={submitReset}
                disabled={token.length < 6 || !newPassword || !confirmPassword || loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting…</> : "Reset password"}
              </Button>
              <button onClick={() => setStep("email")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">← Back</button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15"
            >
              <span className="text-3xl">✓</span>
            </motion.div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Password reset</h2>
            <p className="mb-6 text-sm text-muted-foreground">Your password has been changed. You can sign in now.</p>
            <Button className="h-11 w-full" onClick={onClose}>Back to sign in</Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await signIn(email, password);
      const destination = homeRouteForRole(data.role);
      if (!destination) { setError("Your account role is not configured. Contact admin."); return; }
      navigate(destination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (accEmail: string) => {
    setEmail(accEmail);
    setPassword("password123");
    setDemoOpen(false);
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-info/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-success/15 blur-3xl"
        />
      </div>

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

      <div className="relative flex min-h-screen">
        {/* Left panel — brand / hero */}
        <div className="relative hidden flex-col justify-between border-r border-border/50 bg-card/30 p-12 backdrop-blur-sm lg:flex lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-bold leading-none text-foreground">CIS</p>
              <p className="mt-0.5 text-xs leading-none text-muted-foreground">Campus Information System</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent">
              Your campus,<br />all in one place.
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Courses, grades, attendance, finance, and communications — managed end-to-end in a single platform.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={h.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="rounded-xl border bg-background/40 p-4 backdrop-blur transition-colors hover:bg-background/70"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <h.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{h.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{h.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground"
          >
            © {new Date().getFullYear()} Campus Information System
          </motion.p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold leading-none text-foreground">CIS</p>
                <p className="mt-0.5 text-xs leading-none text-muted-foreground">Campus Information System</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/70 p-8 shadow-xl backdrop-blur-xl">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your CIS account</p>

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email" type="email" placeholder="name@cis.edu"
                      className="h-11 pl-9"
                      value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" onClick={() => setShowForgot(true)}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="h-11 pl-9 pr-10"
                      value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" disabled={loading}
                  className="group h-11 w-full text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                    : <>Sign in <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setDemoOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Try a demo account
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${demoOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {demoOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-xs text-muted-foreground">Click any role to autofill (password is <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">password123</code>).</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {DEMO_ACCOUNTS.map((acc) => (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => fillDemo(acc.email)}
                            className="group flex items-center gap-3 rounded-lg border bg-background/50 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-md"
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${acc.color} shadow-md`}>
                              <acc.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-foreground">{acc.role}</p>
                              <p className="truncate text-[10px] text-muted-foreground">{acc.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary transition-colors hover:text-primary/80">
                Request access
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
