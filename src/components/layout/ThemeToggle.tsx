import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <div
      className={cn(
        compact
          ? "flex items-center gap-2 rounded-lg border border-border bg-card/85 px-2.5 py-1.5 shadow-sm backdrop-blur-sm"
          : "flex items-center gap-2 rounded-lg border border-border bg-card/85 px-3 py-2 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <Sun className={cn("h-4 w-4 transition-colors", isDark ? "text-muted-foreground" : "text-warning")} />
      <Switch
        aria-label="Toggle dark mode"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className={cn("h-4 w-4 transition-colors", isDark ? "text-primary" : "text-muted-foreground")} />
      {!compact && <span className="hidden text-xs text-muted-foreground lg:inline">Dark mode</span>}
    </div>
  );
}
