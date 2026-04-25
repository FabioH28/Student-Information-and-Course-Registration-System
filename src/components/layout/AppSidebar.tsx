import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, GraduationCap, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/components/auth/AuthProvider";
import { type AppRole } from "@/lib/rbac";
import { getWorkspaceConfig } from "@/lib/workspace-config";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  role: AppRole;
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ role, collapsed, onToggle, mobile = false, onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const workspace = getWorkspaceConfig(role);
  const showCollapsed = mobile ? false : collapsed;

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/");
  };

  const content = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!showCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-lg font-bold"
            >
              CIS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {workspace.nav.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              <AnimatePresence>
                {!showCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!showCollapsed && <span>Logout</span>}
        </button>

        {!mobile && (
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform", collapsed && "rotate-180")} />
            {!showCollapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </>
  );

  if (mobile) {
    return <aside className="flex h-full flex-col bg-card">{content}</aside>;
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-0 z-30 hidden h-screen flex-col border-r border-border bg-card/95 shadow-card backdrop-blur-sm lg:flex"
    >
      {content}
    </motion.aside>
  );
}
