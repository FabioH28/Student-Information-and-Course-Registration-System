import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  allowedRole: string;
}

export function RequireAuth({ allowedRole }: RequireAuthProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== allowedRole) {
    const roleRoutes: Record<string, string> = {
      student: "/student",
      instructor: "/instructor",
      academic_staff: "/academic-staff",
      finance_staff: "/finance-staff",
      system_admin: "/admin",
    };
    return <Navigate to={roleRoutes[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}
