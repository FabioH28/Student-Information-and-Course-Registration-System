import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type AppRole } from "@/lib/rbac";
import { getWorkspaceConfig } from "@/lib/workspace-config";

interface WorkspaceLayoutProps {
  role: AppRole;
}

export default function WorkspaceLayout({ role }: WorkspaceLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const workspace = getWorkspaceConfig(role);
  const page = workspace.pageTitles[location.pathname] || { title: workspace.label };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[84vw] max-w-[320px] p-0 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{workspace.label} navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar role={role} collapsed={false} onToggle={() => undefined} mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={page.title}
          subtitle={page.subtitle}
          userName={user?.full_name ?? workspace.label}
          role={workspace.label}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
