import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RequireAuth } from "@/components/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import StudentLayout from "@/layouts/StudentLayout";
import InstructorLayout from "@/layouts/InstructorLayout";
import AcademicStaffLayout from "@/layouts/AcademicStaffLayout";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentProfile from "@/pages/student/StudentProfile";
import StudentMyCoursesPage from "@/pages/student/StudentMyCoursesPage";
import StudentCourseDetailPage from "@/pages/student/StudentCourseDetailPage";
import CourseRegistration from "@/pages/student/CourseRegistration";
import AvailableSubjectsPage from "@/pages/student/AvailableSubjectsPage";
import CourseSelectionPage from "@/pages/student/CourseSelectionPage";
import Timetable from "@/pages/student/Timetable";
import CourseMaterialsPage from "@/pages/student/CourseMaterialsPage";
import StudentAssignmentsPage from "@/pages/student/StudentAssignmentsPage";
import AttendanceViewPage from "@/pages/student/AttendanceViewPage";
import GradesPage from "@/pages/student/GradesPage";
import Chatbot from "@/pages/student/Chatbot";
import StudentNews from "@/pages/student/StudentNews";
import StudentClubs from "@/pages/student/StudentClubs";
import StudentInbox from "@/pages/student/StudentInbox";
import RiskWarning from "@/pages/student/RiskWarning";
import ChangePasswordPage from "@/pages/student/ChangePasswordPage";
import InstructorDashboard from "@/pages/instructor/InstructorDashboard";
import MyCourses from "@/pages/instructor/MyCourses";
import TeacherCourseDetailPage from "@/pages/instructor/TeacherCourseDetailPage";
import WeeklyMaterialsPage from "@/pages/instructor/WeeklyMaterialsPage";
import TeacherAssignmentsPage from "@/pages/instructor/TeacherAssignmentsPage";
import AttendancePage from "@/pages/instructor/AttendancePage";
import GradesManagement from "@/pages/instructor/GradesManagement";
import Student from "@/pages/instructor/Student";
import InstructorProfilePage from "@/pages/instructor/InstructorProfilePage";
import RegistrationsManagement from "@/pages/academic-staff/RegistrationsManagement";
import GradesView from "@/pages/academic-staff/GradesView";
import StaffTimetablePage from "@/pages/academic-staff/StaffTimetablePage";
import StaffCourseOfferingsPage from "@/pages/academic-staff/StaffCourseOfferingsPage";
import StaffBuildingsRoomsPage from "@/pages/academic-staff/StaffBuildingsRoomsPage";
import StaffCommunications from "@/pages/academic-staff/StaffCommunications";
import AcademicDashboard from "@/pages/academic-staff/AcademicDashboard";
import AcademicCourseCatalog from "@/pages/academic-staff/AcademicCourseCatalog";
import AcademicStudents from "@/pages/academic-staff/AcademicStudents";
import AcademicProfile from "@/pages/academic-staff/AcademicProfile";
import AcademicOfferingsManager from "@/pages/academic-staff/AcademicOfferingsManager";
import FinanceStaffLayout from "@/layouts/FinanceStaffLayout";
import FinanceDashboard from "@/pages/finance-staff/FinanceDashboard";
import FinanceInvoices from "@/pages/finance-staff/FinanceInvoices";
import FinancePayments from "@/pages/finance-staff/FinancePayments";
import FinanceHolds from "@/pages/finance-staff/FinanceHolds";
import FinanceStudents from "@/pages/finance-staff/FinanceStudents";
import FinanceProfile from "@/pages/finance-staff/FinanceProfile";
import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminSemesters from "@/pages/admin/AdminSemesters";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProfile from "@/pages/admin/AdminProfile";


const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton expand={false} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route element={<RequireAuth allowedRole="student" />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="courses" element={<StudentMyCoursesPage />} />
                <Route path="courses/:courseOfferingId" element={<StudentCourseDetailPage />} />
                <Route path="registration" element={<CourseRegistration />} />
                <Route path="available-subjects" element={<AvailableSubjectsPage />} />
                <Route path="course-selections" element={<CourseSelectionPage />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="materials" element={<CourseMaterialsPage />} />
                <Route path="assignments" element={<StudentAssignmentsPage />} />
                <Route path="attendance" element={<AttendanceViewPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="news" element={<StudentNews />} />
                <Route path="clubs" element={<StudentClubs />} />
                <Route path="inbox" element={<StudentInbox />} />
                <Route path="risk" element={<RiskWarning />} />
                <Route path="chatbot" element={<Chatbot />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="instructor" />}>
              <Route path="/instructor" element={<InstructorLayout />}>
                <Route index element={<InstructorDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:courseOfferingId" element={<TeacherCourseDetailPage />} />
                <Route path="materials" element={<WeeklyMaterialsPage />} />
                <Route path="assignments" element={<TeacherAssignmentsPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="grades" element={<GradesManagement />} />
                <Route path="student" element={<Student />} />
                <Route path="inbox" element={<StudentInbox />} />
                <Route path="profile" element={<InstructorProfilePage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="academic_staff" />}>
              <Route path="/academic-staff" element={<AcademicStaffLayout />}>
                <Route index element={<AcademicDashboard />} />
                <Route path="profile" element={<AcademicProfile />} />
                <Route path="courses" element={<AcademicCourseCatalog />} />
                <Route path="registrations" element={<RegistrationsManagement />} />
                <Route path="grades" element={<GradesView />} />
                <Route path="students" element={<AcademicStudents />} />
                <Route path="staff-timetable" element={<StaffTimetablePage />} />
                <Route path="staff-course-offerings" element={<StaffCourseOfferingsPage />} />
                <Route path="offerings" element={<AcademicOfferingsManager />} />
                <Route path="staff-buildings-rooms" element={<StaffBuildingsRoomsPage />} />
                <Route path="communications" element={<StaffCommunications />} />
                <Route path="inbox" element={<StudentInbox />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
              <Route path="/staff" element={<AcademicStaffLayout />}>
                <Route index element={<AcademicDashboard />} />
                <Route path="dashboard" element={<AcademicDashboard />} />
                <Route path="profile" element={<AcademicProfile />} />
                <Route path="courses" element={<AcademicCourseCatalog />} />
                <Route path="registrations" element={<RegistrationsManagement />} />
                <Route path="grades" element={<GradesView />} />
                <Route path="students" element={<AcademicStudents />} />
                <Route path="timetable" element={<StaffTimetablePage />} />
                <Route path="course-offerings" element={<StaffCourseOfferingsPage />} />
                <Route path="manage-offerings" element={<AcademicOfferingsManager />} />
                <Route path="buildings-rooms" element={<StaffBuildingsRoomsPage />} />
                <Route path="communications" element={<StaffCommunications />} />
                <Route path="inbox" element={<StudentInbox />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="finance_staff" />}>
              <Route path="/finance-staff" element={<FinanceStaffLayout />}>
                <Route index element={<FinanceDashboard />} />
                <Route path="profile" element={<FinanceProfile />} />
                <Route path="students" element={<FinanceStudents />} />
                <Route path="invoices" element={<FinanceInvoices />} />
                <Route path="payments" element={<FinancePayments />} />
                <Route path="holds" element={<FinanceHolds />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth allowedRole="system_admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="semesters" element={<AdminSemesters />} />
                <Route path="registrations" element={<RegistrationsManagement />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
