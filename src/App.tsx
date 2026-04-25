import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthenticatedRoute, ProtectedRoute, PublicOnlyRoute } from "@/components/auth/RouteGuards";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import WorkspaceLayout from "@/layouts/WorkspaceLayout";
import {
  ROLE_ACADEMIC_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_INSTRUCTOR,
  ROLE_STUDENT,
  ROLE_SYSTEM_ADMIN,
} from "@/lib/rbac";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const PasswordResetPage = lazy(() => import("./pages/PasswordResetPage"));
const AccountPasswordPage = lazy(() => import("./pages/AccountPasswordPage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const CourseCatalog = lazy(() => import("./pages/student/CourseCatalog"));
const CourseRegistration = lazy(() => import("./pages/student/CourseRegistration"));
const Timetable = lazy(() => import("./pages/student/Timetable"));
const GradesPage = lazy(() => import("./pages/student/GradesPage"));
const StudentInbox = lazy(() => import("./pages/student/StudentInbox"));
const StudentNews = lazy(() => import("./pages/student/StudentNews"));
const StudentFinance = lazy(() => import("./pages/student/StudentFinance"));
const StudentClubs = lazy(() => import("./pages/student/StudentClubs"));
const Chatbot = lazy(() => import("./pages/student/Chatbot"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const StudentManagement = lazy(() => import("./pages/admin/StudentManagement"));
const TeacherStaffManagement = lazy(() => import("./pages/admin/TeacherStaffManagement"));
const CourseManagement = lazy(() => import("./pages/admin/CourseManagement"));
const SemesterManagement = lazy(() => import("./pages/admin/SemesterManagement"));
const RegistrationOverview = lazy(() => import("./pages/admin/RegistrationOverview"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const ClubManagement = lazy(() => import("./pages/admin/ClubManagement"));
const NewsManagement = lazy(() => import("./pages/admin/NewsManagement"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherCourses = lazy(() => import("./pages/teacher/TeacherCourses"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherGradebook = lazy(() => import("./pages/teacher/TeacherGradebook"));
const TeacherInbox = lazy(() => import("./pages/teacher/TeacherInbox"));
const InstructorTimetable = lazy(() => import("./pages/instructor/InstructorTimetable"));
const InstructorAnnouncements = lazy(() => import("./pages/instructor/InstructorAnnouncements"));
const UserProfilePage = lazy(() => import("./pages/profile/UserProfilePage"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface-card w-full max-w-sm p-6 text-center">
        <p className="text-base font-semibold text-foreground">Loading workspace</p>
        <p className="mt-2 text-sm text-muted-foreground">Preparing the next view.</p>
      </div>
    </div>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/reset-password" element={<PasswordResetPage />} />
                </Route>

                <Route element={<AuthenticatedRoute />}>
                  <Route path="/account/change-password" element={<AccountPasswordPage />} />
                  <Route path="/forbidden" element={<ForbiddenPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_STUDENT]} />}>
                  <Route path="/student" element={<WorkspaceLayout role={ROLE_STUDENT} />}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="courses" element={<CourseCatalog />} />
                    <Route path="registration" element={<CourseRegistration />} />
                    <Route path="timetable" element={<Timetable />} />
                    <Route path="grades" element={<GradesPage />} />
                    <Route path="inbox" element={<StudentInbox />} />
                    <Route path="news" element={<StudentNews />} />
                    <Route path="finance" element={<StudentFinance />} />
                    <Route path="clubs" element={<StudentClubs />} />
                    <Route path="chatbot" element={<Chatbot />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_INSTRUCTOR]} />}>
                  <Route path="/instructor" element={<WorkspaceLayout role={ROLE_INSTRUCTOR} />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="profile" element={<UserProfilePage />} />
                    <Route path="timetable" element={<InstructorTimetable />} />
                    <Route path="courses" element={<TeacherCourses />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="attendance" element={<TeacherAttendance />} />
                    <Route path="grades" element={<TeacherGradebook />} />
                    <Route path="announcements" element={<InstructorAnnouncements />} />
                    <Route path="inbox" element={<TeacherInbox />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_ACADEMIC_STAFF]} />}>
                  <Route path="/academic" element={<WorkspaceLayout role={ROLE_ACADEMIC_STAFF} />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="profile" element={<UserProfilePage />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="courses" element={<CourseManagement />} />
                    <Route path="semesters" element={<SemesterManagement />} />
                    <Route path="registrations" element={<RegistrationOverview />} />
                    <Route path="attendance" element={<TeacherAttendance />} />
                    <Route path="grades" element={<TeacherGradebook />} />
                    <Route path="news" element={<NewsManagement />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_FINANCE_STAFF]} />}>
                  <Route path="/finance" element={<WorkspaceLayout role={ROLE_FINANCE_STAFF} />}>
                    <Route index element={<AdminFinance />} />
                    <Route path="profile" element={<UserProfilePage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_COMMUNICATION_STAFF]} />}>
                  <Route path="/communications" element={<WorkspaceLayout role={ROLE_COMMUNICATION_STAFF} />}>
                    <Route index element={<NewsManagement />} />
                    <Route path="profile" element={<UserProfilePage />} />
                    <Route path="news" element={<NewsManagement />} />
                    <Route path="clubs" element={<ClubManagement />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[ROLE_SYSTEM_ADMIN]} />}>
                  <Route path="/system-admin" element={<WorkspaceLayout role={ROLE_SYSTEM_ADMIN} />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="profile" element={<UserProfilePage />} />
                    <Route path="students" element={<StudentManagement />} />
                    <Route path="staff" element={<TeacherStaffManagement />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
