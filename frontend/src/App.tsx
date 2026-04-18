import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LoginPage from "./pages/LoginPage";
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

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

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

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="semesters" element={<SemesterManagement />} />
            <Route path="registrations" element={<RegistrationOverview />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
