import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, ShieldCheck } from "lucide-react";

import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { AuthSession } from "@/lib/auth";
import { getRoleHome } from "@/lib/rbac";

interface BootstrapStatusResponse {
  bootstrap_required: boolean;
  system_admin_accounts: number;
}

interface BootstrapAdminForm {
  first_name: string;
  last_name: string;
  email: string;
  employee_number: string;
  title: string;
  office_location: string;
  password: string;
}

const defaultBootstrapForm: BootstrapAdminForm = {
  first_name: "",
  last_name: "",
  email: "",
  employee_number: "",
  title: "",
  office_location: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBootstrapPassword, setShowBootstrapPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [bootstrapForm, setBootstrapForm] = useState<BootstrapAdminForm>(defaultBootstrapForm);

  const bootstrapStatusQuery = useQuery({
    queryKey: ["auth", "bootstrap-status"],
    queryFn: () => apiGet<BootstrapStatusResponse>("/auth/bootstrap-status"),
    retry: 1,
    staleTime: 30_000,
  });

  const completeSignIn = (session: AuthSession, persistSession = rememberMe) => {
    login(session, persistSession);

    if (session.user.must_change_password) {
      navigate("/account/change-password");
      return;
    }

    navigate(getRoleHome(session.user.primary_role));
  };

  const submitLogin = async (nextEmail: string, nextPassword: string, persistSession = rememberMe) => {
    const session = await apiPost<AuthSession>("/auth/login", {
      email: nextEmail,
      password: nextPassword,
    });

    completeSignIn(session, persistSession);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing sign-in details",
        description: "Enter your institutional email and password to continue.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLogin(email, password);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Check your credentials and try again.";
      toast({
        title: "Unable to sign in",
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBootstrapAdmin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !bootstrapForm.first_name.trim() ||
      !bootstrapForm.last_name.trim() ||
      !bootstrapForm.email.trim() ||
      !bootstrapForm.employee_number.trim() ||
      !bootstrapForm.password.trim()
    ) {
      toast({
        title: "Missing setup details",
        description: "Complete the System Admin setup form before continuing.",
      });
      return;
    }

    setIsBootstrapping(true);

    try {
      await apiPost("/auth/bootstrap-admin", bootstrapForm);
      toast({
        title: "System administration initialized",
        description: "Your first System Admin account is ready. Signing you in now.",
      });
      await bootstrapStatusQuery.refetch();
      await submitLogin(bootstrapForm.email, bootstrapForm.password, true);
    } catch (error) {
      const description = error instanceof Error ? error.message : "The System Admin account could not be created.";
      toast({
        title: "Setup failed",
        description,
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle compact />
      </div>

      <div className="relative hidden overflow-hidden gradient-primary p-12 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="absolute rounded-full border border-primary-foreground/20"
              style={{
                width: `${200 + index * 120}px`,
                height: `${200 + index * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md text-center"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-primary-foreground">Campus Information System</h1>
          <p className="text-lg leading-relaxed text-primary-foreground/85">
            Secure access to academic records, enrollment, teaching, finance, and campus communications from one
            trusted university platform.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-lg"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">CIS</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="mb-8 mt-1 text-muted-foreground">Sign in with your institutional email to continue</p>

          <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <div className="space-y-2">
              <Label htmlFor="email">Institutional Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your.name@campus.edu"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-primary transition-colors hover:text-secondary"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {bootstrapStatusQuery.data?.bootstrap_required && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">First-run setup required</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No System Admin account exists yet. Create the first one here, then provision the rest of
                    the campus accounts from the system admin workspace.
                  </p>
                </div>
              </div>

              <form onSubmit={handleBootstrapAdmin} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-first-name">First Name</Label>
                    <Input
                      id="bootstrap-first-name"
                      value={bootstrapForm.first_name}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, first_name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-last-name">Last Name</Label>
                    <Input
                      id="bootstrap-last-name"
                      value={bootstrapForm.last_name}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, last_name: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-email">System Admin Email</Label>
                    <Input
                      id="bootstrap-email"
                      type="email"
                      value={bootstrapForm.email}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="admin@campus.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-employee-number">Employee Number</Label>
                    <Input
                      id="bootstrap-employee-number"
                      value={bootstrapForm.employee_number}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, employee_number: event.target.value }))
                      }
                      placeholder="EMP-0001"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-title">Title</Label>
                    <Input
                      id="bootstrap-title"
                      value={bootstrapForm.title}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Registrar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bootstrap-office-location">Office Location</Label>
                    <Input
                      id="bootstrap-office-location"
                      value={bootstrapForm.office_location}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, office_location: event.target.value }))
                      }
                      placeholder="Admin Block A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bootstrap-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="bootstrap-password"
                      type={showBootstrapPassword ? "text" : "password"}
                      value={bootstrapForm.password}
                      onChange={(event) =>
                        setBootstrapForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="pr-10"
                      placeholder="Choose a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBootstrapPassword(!showBootstrapPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showBootstrapPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isBootstrapping}
                  className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                >
                  {isBootstrapping ? "Setting Up CIS..." : "Create First System Admin"}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Use the campus email account issued for your workspace access
          </p>
        </motion.div>
      </div>

      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} defaultEmail={email} />
    </div>
  );
}
