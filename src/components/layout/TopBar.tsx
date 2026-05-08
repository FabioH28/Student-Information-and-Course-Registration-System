import { Bell, ChevronDown, KeyRound, LogOut, Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  role?: string;
  profilePath?: string;
  notificationPath?: string;
  onMenuClick?: () => void;
}

export function TopBar({
  title,
  subtitle,
  userName = "CIS User",
  role = "Student",
  profilePath,
  notificationPath,
  onMenuClick,
}: TopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

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

        {notificationPath ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative hidden h-9 w-9 sm:inline-flex"
            aria-label="Open inbox"
            onClick={() => navigate(notificationPath)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto shrink-0 items-center gap-2 rounded-lg py-1.5 pl-2 pr-1.5 sm:pl-3 sm:pr-2"
              aria-label="Open user menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">
                {initials || "CI"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-foreground">{userName}</p>
                <p className="text-xs leading-tight text-muted-foreground">{role}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{userName}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profilePath ? (
              <DropdownMenuItem onSelect={() => navigate(profilePath)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => navigate("/account/change-password")}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
