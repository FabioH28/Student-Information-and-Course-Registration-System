import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/instructor": { title: "Dashboard", subtitle: "Your courses overview" },
  "/instructor/courses": { title: "My Courses", subtitle: "Assigned course offerings" },
  "/instructor/materials": { title: "Weekly Course Materials", subtitle: "Manage materials by week" },
  "/instructor/assignments": { title: "Assignments", subtitle: "Manage weekly assignments" },
  "/instructor/attendance": { title: "Attendance", subtitle: "Mark and manage attendance" },
  "/instructor/grades": { title: "Grades", subtitle: "Manage student grades" },
  "/instructor/student": { title: "Students", subtitle: "Manage and review enrolled students" },
  "/instructor/inbox": { title: "Inbox", subtitle: "Notifications and direct messages" },
  "/instructor/profile": { title: "Profile", subtitle: "Your instructor account" },
  "/instructor/change-password": { title: "Change Password", subtitle: "Update your account password" },
};

export default function InstructorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Instructor" };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        role="instructor"
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
