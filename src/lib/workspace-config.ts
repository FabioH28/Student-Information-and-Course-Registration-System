import type { ElementType } from "react";
import {
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Newspaper,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

import {
  type AppRole,
  ROLE_ACADEMIC_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_INSTRUCTOR,
  ROLE_STUDENT,
  ROLE_SYSTEM_ADMIN,
} from "@/lib/rbac";

export interface NavItem {
  title: string;
  icon: ElementType;
  path: string;
}

export interface WorkspaceConfig {
  label: string;
  role: AppRole;
  basePath: string;
  nav: NavItem[];
  pageTitles: Record<string, { title: string; subtitle?: string }>;
}

export const workspaceConfigs: Record<AppRole, WorkspaceConfig> = {
  [ROLE_STUDENT]: {
    label: "Student",
    role: ROLE_STUDENT,
    basePath: "/student",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/student" },
      { title: "Profile", icon: User, path: "/student/profile" },
      { title: "Courses", icon: BookOpen, path: "/student/courses" },
      { title: "Registration", icon: ClipboardList, path: "/student/registration" },
      { title: "Timetable", icon: CalendarDays, path: "/student/timetable" },
      { title: "Grades", icon: GraduationCap, path: "/student/grades" },
      { title: "Inbox", icon: BellRing, path: "/student/inbox" },
      { title: "News", icon: Megaphone, path: "/student/news" },
      { title: "Finance", icon: Wallet, path: "/student/finance" },
      { title: "Clubs", icon: Trophy, path: "/student/clubs" },
      { title: "AI Assistant", icon: Bot, path: "/student/chatbot" },
    ],
    pageTitles: {
      "/student": { title: "Dashboard", subtitle: "Your academic overview" },
      "/student/profile": { title: "Profile" },
      "/student/courses": { title: "My Courses", subtitle: "Selected courses and curriculum map" },
      "/student/registration": { title: "Registration", subtitle: "Choose and manage current-term offerings" },
      "/student/timetable": { title: "Timetable", subtitle: "Weekly schedule" },
      "/student/grades": { title: "Grades", subtitle: "Academic results" },
      "/student/inbox": { title: "Inbox", subtitle: "Alerts, reminders, and campus notifications" },
      "/student/news": { title: "News", subtitle: "Announcements and upcoming campus events" },
      "/student/finance": { title: "Finance", subtitle: "Tuition, invoices, and staff-recorded payments" },
      "/student/clubs": { title: "Clubs", subtitle: "Join and manage student organizations" },
      "/student/chatbot": { title: "AI Assistant", subtitle: "Ask anything" },
    },
  },
  [ROLE_INSTRUCTOR]: {
    label: "Instructor",
    role: ROLE_INSTRUCTOR,
    basePath: "/instructor",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/instructor" },
      { title: "Profile", icon: User, path: "/instructor/profile" },
      { title: "Timetable", icon: CalendarDays, path: "/instructor/timetable" },
      { title: "Courses", icon: BookOpen, path: "/instructor/courses" },
      { title: "Students", icon: Users, path: "/instructor/students" },
      { title: "Attendance", icon: ClipboardList, path: "/instructor/attendance" },
      { title: "Gradebook", icon: GraduationCap, path: "/instructor/grades" },
      { title: "Announcements", icon: Megaphone, path: "/instructor/announcements" },
      { title: "Inbox", icon: BellRing, path: "/instructor/inbox" },
    ],
    pageTitles: {
      "/instructor": { title: "Dashboard", subtitle: "Teaching overview" },
      "/instructor/profile": { title: "Profile" },
      "/instructor/timetable": { title: "Timetable", subtitle: "Your assigned teaching schedule" },
      "/instructor/courses": { title: "Courses", subtitle: "Assigned offerings and schedules" },
      "/instructor/students": { title: "Students", subtitle: "Learners across your offerings" },
      "/instructor/attendance": { title: "Attendance", subtitle: "Session tracking and absence monitoring" },
      "/instructor/grades": { title: "Gradebook", subtitle: "Assessment and grading progress" },
      "/instructor/announcements": { title: "Announcements", subtitle: "Course-related communication and notices" },
      "/instructor/inbox": { title: "Inbox", subtitle: "Academic and campus notifications" },
    },
  },
  [ROLE_ACADEMIC_STAFF]: {
    label: "Academic Staff",
    role: ROLE_ACADEMIC_STAFF,
    basePath: "/academic",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/academic" },
      { title: "Profile", icon: User, path: "/academic/profile" },
      { title: "Records", icon: Users, path: "/academic/students" },
      { title: "Courses", icon: BookOpen, path: "/academic/courses" },
      { title: "Semesters", icon: Calendar, path: "/academic/semesters" },
      { title: "Registrations", icon: ClipboardList, path: "/academic/registrations" },
      { title: "Attendance", icon: BellRing, path: "/academic/attendance" },
      { title: "Grades", icon: GraduationCap, path: "/academic/grades" },
      { title: "News & Events", icon: Megaphone, path: "/academic/news" },
      { title: "Inbox", icon: MessageSquare, path: "/academic/inbox" },
    ],
    pageTitles: {
      "/academic": { title: "Dashboard", subtitle: "Academic operations overview" },
      "/academic/profile": { title: "Profile" },
      "/academic/students": { title: "Academic Records", subtitle: "Student roster, grades, and academic progress" },
      "/academic/courses": { title: "Courses", subtitle: "Course catalog, offerings, and scheduling" },
      "/academic/semesters": { title: "Semesters", subtitle: "Academic terms and registration windows" },
      "/academic/registrations": { title: "Registrations", subtitle: "Enrollment approvals and status tracking" },
      "/academic/attendance": { title: "Attendance", subtitle: "Attendance oversight across current offerings" },
      "/academic/grades": { title: "Grades", subtitle: "Grade management and publishing overview" },
      "/academic/news": { title: "News & Events", subtitle: "Academic announcements and event support" },
      "/academic/inbox": { title: "Inbox", subtitle: "Messages and campus broadcasts" },
    },
  },
  [ROLE_FINANCE_STAFF]: {
    label: "Finance Staff",
    role: ROLE_FINANCE_STAFF,
    basePath: "/finance",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/finance" },
      { title: "Profile", icon: User, path: "/finance/profile" },
      { title: "Records", icon: CircleDollarSign, path: "/finance/records" },
      { title: "Inbox", icon: MessageSquare, path: "/finance/inbox" },
    ],
    pageTitles: {
      "/finance": { title: "Finance Dashboard", subtitle: "Outstanding balances, holds, and payment overview" },
      "/finance/profile": { title: "Profile" },
      "/finance/records": { title: "Finance Records", subtitle: "Manual invoices, payments, holds, and account management" },
      "/finance/inbox": { title: "Inbox", subtitle: "Messages and campus broadcasts" },
    },
  },
  [ROLE_COMMUNICATION_STAFF]: {
    label: "Communication Staff",
    role: ROLE_COMMUNICATION_STAFF,
    basePath: "/communications",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/communications" },
      { title: "Profile", icon: User, path: "/communications/profile" },
      { title: "News & Events", icon: Megaphone, path: "/communications/news" },
      { title: "Clubs", icon: Trophy, path: "/communications/clubs" },
      { title: "Inbox", icon: MessageSquare, path: "/communications/inbox" },
    ],
    pageTitles: {
      "/communications": { title: "Dashboard", subtitle: "Announcements, events, and public communication" },
      "/communications/profile": { title: "Profile" },
      "/communications/news": { title: "News & Events", subtitle: "Publishing queue and event calendar" },
      "/communications/clubs": { title: "Clubs", subtitle: "Club directory and join request review" },
      "/communications/inbox": { title: "Inbox", subtitle: "Messages and campus broadcasts" },
    },
  },
  [ROLE_SYSTEM_ADMIN]: {
    label: "System Admin",
    role: ROLE_SYSTEM_ADMIN,
    basePath: "/system-admin",
    nav: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/system-admin" },
      { title: "Profile", icon: User, path: "/system-admin/profile" },
      { title: "Students", icon: Users, path: "/system-admin/students" },
      { title: "Staff & Roles", icon: ShieldCheck, path: "/system-admin/staff" },
      { title: "Courses", icon: BookOpen, path: "/system-admin/courses" },
      { title: "Semesters", icon: Calendar, path: "/system-admin/semesters" },
      { title: "Registrations", icon: ClipboardList, path: "/system-admin/registrations" },
      { title: "Attendance", icon: BellRing, path: "/system-admin/attendance" },
      { title: "Grades", icon: GraduationCap, path: "/system-admin/grades" },
      { title: "Finance", icon: CircleDollarSign, path: "/system-admin/finance" },
      { title: "News & Events", icon: Newspaper, path: "/system-admin/news" },
      { title: "Clubs", icon: Trophy, path: "/system-admin/clubs" },
      { title: "Messages", icon: MessageSquare, path: "/system-admin/messages" },
      { title: "Reports", icon: BarChart3, path: "/system-admin/analytics" },
      { title: "Settings", icon: Settings, path: "/system-admin/settings" },
    ],
    pageTitles: {
      "/system-admin": { title: "Dashboard", subtitle: "System oversight and management" },
      "/system-admin/profile": { title: "Profile" },
      "/system-admin/students": { title: "Students", subtitle: "Student account and access management" },
      "/system-admin/staff": { title: "Staff & Roles", subtitle: "Instructor, staff, and role administration" },
      "/system-admin/courses": { title: "Courses", subtitle: "Course catalog, offerings, and scheduling" },
      "/system-admin/semesters": { title: "Semesters", subtitle: "Academic terms and registration windows" },
      "/system-admin/registrations": { title: "Registrations", subtitle: "Enrollment approvals and status tracking" },
      "/system-admin/attendance": { title: "Attendance", subtitle: "Attendance oversight across current offerings" },
      "/system-admin/grades": { title: "Grades", subtitle: "Grade management and publishing overview" },
      "/system-admin/finance": { title: "Finance", subtitle: "Invoices, payments, holds, and finance records" },
      "/system-admin/news": { title: "News & Events", subtitle: "Announcements and campus events" },
      "/system-admin/clubs": { title: "Clubs", subtitle: "Student organization management" },
      "/system-admin/messages": { title: "Messages", subtitle: "Direct messages and campus-wide broadcasts" },
      "/system-admin/analytics": { title: "Reports", subtitle: "System reporting and audit visibility" },
      "/system-admin/settings": { title: "Settings", subtitle: "System configuration and operational settings" },
    },
  },
};

export function getWorkspaceConfig(role: AppRole) {
  return workspaceConfigs[role];
}
