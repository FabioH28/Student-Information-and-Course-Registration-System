import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/student": { title: "Dashboard", subtitle: "Your academic overview" },
  "/student/profile": { title: "Profile" },
  "/student/courses": { title: "My Courses", subtitle: "Enrolled course offerings" },
  "/student/catalog": { title: "Course Catalog", subtitle: "Browse available courses" },
  "/student/registration": { title: "Registration", subtitle: "Manage your enrollment" },
  "/student/timetable": { title: "Timetable", subtitle: "Weekly schedule" },
  "/student/materials": { title: "Course Materials", subtitle: "Weekly content and tasks" },
  "/student/assignments": { title: "Assignments", subtitle: "Weekly course assignments" },
  "/student/attendance": { title: "Attendance", subtitle: "Your attendance records" },
  "/student/grades": { title: "Grades", subtitle: "Academic results" },
  "/student/news": { title: "Campus News", subtitle: "Announcements and events" },
  "/student/clubs": { title: "Clubs", subtitle: "Student organizations and events" },
  "/student/inbox": { title: "Inbox", subtitle: "Notifications and messages" },
  "/student/risk": { title: "Risk Assessment", subtitle: "Academic standing" },
  "/student/chatbot": { title: "AI Assistant", subtitle: "Ask about your academics" },
  "/student/change-password": { title: "Change Password", subtitle: "Update your account password" },
};

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Student" };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        role="student"
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
