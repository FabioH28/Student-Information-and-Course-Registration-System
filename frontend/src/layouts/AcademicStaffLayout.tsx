import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/academic-staff": { title: "Dashboard", subtitle: "Academic operations overview" },
  "/academic-staff/courses": { title: "Course Catalog", subtitle: "Manage course offerings" },
  "/academic-staff/registrations": { title: "Registrations", subtitle: "Student enrollments" },
  "/academic-staff/grades": { title: "Grades", subtitle: "View all grades" },
  "/academic-staff/students": { title: "Students", subtitle: "Student records" },
  "/academic-staff/staff-course-offerings": { title: "Course Offerings", subtitle: "Manage faculty offerings" },
  "/academic-staff/staff-timetable": { title: "Timetable", subtitle: "Manage faculty schedules" },
  "/academic-staff/staff-buildings-rooms": { title: "Buildings & Rooms", subtitle: "Campus room inventory" },
  "/staff": { title: "Staff Dashboard", subtitle: "Academic operations overview" },
  "/staff/dashboard": { title: "Staff Dashboard", subtitle: "Academic operations overview" },
  "/staff/course-offerings": { title: "Course Offerings", subtitle: "Manage faculty offerings" },
  "/staff/timetable": { title: "Timetable", subtitle: "Manage faculty schedules" },
  "/staff/buildings-rooms": { title: "Buildings & Rooms", subtitle: "Campus room inventory" },
  "/staff/courses": { title: "Course Catalog", subtitle: "Manage course offerings" },
  "/staff/registrations": { title: "Registrations", subtitle: "Student enrollments" },
  "/staff/grades": { title: "Grades", subtitle: "View all grades" },
  "/staff/students": { title: "Students", subtitle: "Student records" },
  "/staff/communications": { title: "Communications", subtitle: "Announcements, events and club requests" },
  "/academic-staff/communications": { title: "Communications", subtitle: "Announcements, events and club requests" },
  "/academic-staff/inbox": { title: "Inbox", subtitle: "Notifications and direct messages" },
  "/staff/inbox": { title: "Inbox", subtitle: "Notifications and direct messages" },
  "/academic-staff/offerings": { title: "Manage Offerings", subtitle: "Create course → program → instructor mappings" },
  "/staff/manage-offerings": { title: "Manage Offerings", subtitle: "Create course → program → instructor mappings" },
  "/academic-staff/profile": { title: "Profile", subtitle: "Your CIS staff account" },
  "/academic-staff/change-password": { title: "Change Password", subtitle: "Update your account password" },
  "/staff/profile": { title: "Profile", subtitle: "Your CIS staff account" },
  "/staff/change-password": { title: "Change Password", subtitle: "Update your account password" },
};

export default function AcademicStaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Academic Staff" };
  const isStaffRoute = location.pathname.startsWith("/staff");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        role={isStaffRoute ? "staff" : "academic-staff"}
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
