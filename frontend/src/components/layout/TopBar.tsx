import { ChevronDown, Lock, LogOut, Menu, Search, UserCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { canonicalRole } from "@/lib/authRoles";


interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export function TopBar({ title, subtitle, onMenuToggle }: TopBarProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const role = canonicalRole(user?.role ?? "");
  const accountBase = role === "student" ? "/student" : role === "instructor" ? "/instructor" : role === "academic_staff" ? "/academic-staff" : "/admin";

  function logout() {
    signOut();
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Search CIS</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle className="h-4 w-4" />
            </span>
            <span className="max-w-36 truncate">{user?.name ?? user?.email ?? "CIS User"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-card p-2 shadow-lg">
              <div className="border-b px-3 py-2">
                <p className="truncate text-sm font-semibold">{user?.name ?? user?.email ?? "Instructor"}</p>
                <p className="text-xs text-muted-foreground">{role === "instructor" ? "Instructor" : user?.role ?? "User"}</p>
              </div>
              <button type="button" onClick={() => { setOpen(false); navigate(`${accountBase}/profile`); }} className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                <UserCircle className="h-4 w-4" />Profile
              </button>
              <button type="button" onClick={() => { setOpen(false); navigate(`${accountBase}/change-password`); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                <Lock className="h-4 w-4" />Change password
              </button>
              <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
