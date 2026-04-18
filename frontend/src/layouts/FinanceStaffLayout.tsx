import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/finance-staff": { title: "Dashboard", subtitle: "Finance operations overview" },
  "/finance-staff/payments": { title: "Payments", subtitle: "Record and manage payments" },
  "/finance-staff/invoices": { title: "Invoices", subtitle: "Student invoices" },
  "/finance-staff/holds": { title: "Holds", subtitle: "Manage financial holds" },
};

export default function FinanceStaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Finance Staff" };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        role="finance-staff"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={page.title}
          subtitle={page.subtitle}
          userName="Finance Staff"
          role="Finance Staff"
          onMenuToggle={isMobile ? () => setMobileOpen(true) : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
