import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, BookOpen, CalendarDays, GraduationCap,
  Sparkles, AlertTriangle, Users, Settings,
  ClipboardList, BarChart3, Calendar, ChevronLeft, LogOut, Bot, X,
  CheckSquare, DollarSign, FileText, CreditCard, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

const studentNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/student" },
  { title: "Profile", icon: User, path: "/student/profile" },
  { title: "Courses", icon: BookOpen, path: "/student/courses" },
  { title: "Registration", icon: ClipboardList, path: "/student/registration" },
  { title: "Timetable", icon: CalendarDays, path: "/student/timetable" },
  { title: "Grades", icon: GraduationCap, path: "/student/grades" },
  { title: "Recommendations", icon: Sparkles, path: "/student/recommendations" },
  { title: "Risk Warning", icon: AlertTriangle, path: "/student/risk" },
  { title: "AI Chatbot", icon: Bot, path: "/student/chatbot" },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Students", icon: Users, path: "/admin/students" },
  { title: "Courses", icon: BookOpen, path: "/admin/courses" },
  { title: "Semesters", icon: Calendar, path: "/admin/semesters" },
  { title: "Registrations", icon: ClipboardList, path: "/admin/registrations" },
  { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

const instructorNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/instructor" },
  { title: "My Courses", icon: BookOpen, path: "/instructor/courses" },
  { title: "Attendance", icon: CheckSquare, path: "/instructor/attendance" },
  { title: "Grades", icon: GraduationCap, path: "/instructor/grades" },
  { title: "Roster", icon: Users, path: "/instructor/roster" },
];

const academicStaffNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/academic-staff" },
  { title: "Course Catalog", icon: BookOpen, path: "/academic-staff/courses" },
  { title: "Registrations", icon: ClipboardList, path: "/academic-staff/registrations" },
  { title: "Grades", icon: GraduationCap, path: "/academic-staff/grades" },
  { title: "Students", icon: Users, path: "/academic-staff/students" },
];

const financeStaffNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/finance-staff" },
  { title: "Payments", icon: CreditCard, path: "/finance-staff/payments" },
  { title: "Invoices", icon: FileText, path: "/finance-staff/invoices" },
  { title: "Holds", icon: ShieldAlert, path: "/finance-staff/holds" },
];

const navMap: Record<string, NavItem[]> = {
  student: studentNav,
  admin: adminNav,
  instructor: instructorNav,
  "academic-staff": academicStaffNav,
  "finance-staff": financeStaffNav,
};

interface AppSidebarProps {
  role: "student" | "admin" | "instructor" | "academic-staff" | "finance-staff";
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ role, collapsed, onToggle, mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const items = navMap[role] ?? studentNav;

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-[17.5rem] max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg whitespace-nowrap">EduAI</span>
                </div>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="border-t border-border p-3">
                <NavLink
                  to="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Logout</span>
                </NavLink>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-0 z-30 flex h-screen flex-col border-r border-border bg-card"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border gap-3">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-lg whitespace-nowrap overflow-hidden"
            >
              EduAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse + Logout */}
      <div className="p-3 border-t border-border space-y-1">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </NavLink>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted w-full transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
