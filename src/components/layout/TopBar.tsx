import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  role?: string;
  onMenuToggle?: () => void;
}

export function TopBar({ title, subtitle, userName = "Alex Johnson", role = "Student", onMenuToggle }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="hidden sm:block">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 w-56 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 transition-colors hover:bg-muted">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-1 transition-colors hover:bg-muted sm:pl-3 sm:pr-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {userName.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-foreground leading-tight">{userName}</p>
            <p className="text-xs text-muted-foreground leading-tight">{role}</p>
          </div>
          <ChevronDown className="hidden w-4 h-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  );
}
