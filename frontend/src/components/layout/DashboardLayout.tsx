import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  role: "student" | "admin";
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ role, title, subtitle }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} role={role === "student" ? "Student" : "Admin"} userName={role === "student" ? "Alex Johnson" : "Dr. Sarah Chen"} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
