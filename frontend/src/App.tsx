import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import CourseCatalog from "./pages/student/CourseCatalog";
import CourseRegistration from "./pages/student/CourseRegistration";
import Timetable from "./pages/student/Timetable";
import GradesPage from "./pages/student/GradesPage";
import Recommendations from "./pages/student/Recommendations";
import RiskWarning from "./pages/student/RiskWarning";
import Chatbot from "./pages/student/Chatbot";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import SemesterManagement from "./pages/admin/SemesterManagement";
import RegistrationOverview from "./pages/admin/RegistrationOverview";
import Analytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/AdminSettings";

import InstructorLayout from "./layouts/InstructorLayout";
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import MyCourses from "./pages/instructor/MyCourses";
import AttendancePage from "./pages/instructor/AttendancePage";
import GradesManagement from "./pages/instructor/GradesManagement";
import Roster from "./pages/instructor/Roster";

import AcademicStaffLayout from "./layouts/AcademicStaffLayout";
import AcademicDashboard from "./pages/academic-staff/AcademicDashboard";
import CourseCatalogManagement from "./pages/academic-staff/CourseCatalogManagement";
import RegistrationsManagement from "./pages/academic-staff/RegistrationsManagement";
import GradesView from "./pages/academic-staff/GradesView";
import StudentsView from "./pages/academic-staff/StudentsView";

import FinanceStaffLayout from "./layouts/FinanceStaffLayout";
import FinanceDashboard from "./pages/finance-staff/FinanceDashboard";
import PaymentsPage from "./pages/finance-staff/PaymentsPage";
import InvoicesPage from "./pages/finance-staff/InvoicesPage";
import HoldsPage from "./pages/finance-staff/HoldsPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function PasswordGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <>
      {children}
      {user?.require_password_change && <ChangePasswordModal />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PasswordGate>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route element={<RequireAuth allowedRole="student" />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="registration" element={<CourseRegistration />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="risk" element={<RiskWarning />} />
                <Route path="chatbot" element={<Chatbot />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="system_admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="semesters" element={<SemesterManagement />} />
                <Route path="registrations" element={<RegistrationOverview />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="instructor" />}>
              <Route path="/instructor" element={<InstructorLayout />}>
                <Route index element={<InstructorDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="grades" element={<GradesManagement />} />
                <Route path="roster" element={<Roster />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="academic_staff" />}>
              <Route path="/academic-staff" element={<AcademicStaffLayout />}>
                <Route index element={<AcademicDashboard />} />
                <Route path="courses" element={<CourseCatalogManagement />} />
                <Route path="registrations" element={<RegistrationsManagement />} />
                <Route path="grades" element={<GradesView />} />
                <Route path="students" element={<StudentsView />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="finance_staff" />}>
              <Route path="/finance-staff" element={<FinanceStaffLayout />}>
                <Route index element={<FinanceDashboard />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="holds" element={<HoldsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </PasswordGate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
