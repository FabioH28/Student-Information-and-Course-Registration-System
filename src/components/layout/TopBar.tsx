import { Bell, ChevronDown, Menu, Search } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  role?: string;
  onMenuClick?: () => void;
}

export function TopBar({ title, subtitle, userName = "CIS User", role = "Student", onMenuClick }: TopBarProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-0">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 shrink-0 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle compact />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 rounded-lg border border-border bg-muted/60 py-2 pl-9 pr-4 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <button className="relative hidden rounded-lg p-2 transition-colors hover:bg-muted/70 sm:block">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <button className="flex shrink-0 items-center gap-2 rounded-lg py-1.5 pl-2 pr-1.5 transition-colors hover:bg-muted/70 sm:pl-3 sm:pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">
            {initials || "CI"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-foreground">{userName}</p>
            <p className="text-xs leading-tight text-muted-foreground">{role}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  );
}
