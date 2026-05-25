import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/admin": { title: "Admin Dashboard", subtitle: "System overview" },
  "/admin/profile": { title: "Profile", subtitle: "Your administrator account" },
  "/admin/users": { title: "Users", subtitle: "Accounts and roles" },
  "/admin/students": { title: "Students", subtitle: "All student records" },
  "/admin/courses": { title: "Courses", subtitle: "Course catalog" },
  "/admin/semesters": { title: "Semesters", subtitle: "Academic calendar" },
  "/admin/registrations": { title: "Registrations", subtitle: "All enrollments" },
  "/admin/analytics": { title: "Analytics", subtitle: "System metrics" },
  "/admin/settings": { title: "Settings", subtitle: "System configuration" },
  "/admin/change-password": { title: "Change Password", subtitle: "Update your account password" },
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Admin" };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        role="admin"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={page.title}
          subtitle={page.subtitle}
          onMenuToggle={isMobile ? () => setMobileOpen(true) : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
