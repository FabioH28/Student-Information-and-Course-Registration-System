import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/instructor": { title: "Dashboard", subtitle: "Your courses overview" },
  "/instructor/courses": { title: "My Courses", subtitle: "Assigned course offerings" },
  "/instructor/attendance": { title: "Attendance", subtitle: "Mark and manage attendance" },
  "/instructor/grades": { title: "Grades", subtitle: "Manage student grades" },
  "/instructor/roster": { title: "Roster", subtitle: "Enrolled students" },
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
          userName="Dr. Smith"
          role="Instructor"
          onMenuToggle={isMobile ? () => setMobileOpen(true) : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
