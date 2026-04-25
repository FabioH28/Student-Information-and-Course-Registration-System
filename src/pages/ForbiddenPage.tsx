import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRoleHome } from "@/lib/rbac";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
          <ShieldAlert className="h-7 w-7 text-warning" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">Access Forbidden</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your account is signed in, but this page is outside the permissions granted to your current CIS role.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => navigate(getRoleHome(user?.primary_role), { replace: true })}>
            Open My Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
