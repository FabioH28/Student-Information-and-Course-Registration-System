import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";
import { getRoleHome, isAppRole } from "@/lib/rbac";

export function PublicOnlyRoute() {
  const { session } = useAuth();

  if (session?.user?.must_change_password) {
    return <Navigate to="/account/change-password" replace />;
  }

  if (session?.user?.primary_role && isAppRole(session.user.primary_role)) {
    return <Navigate to={getRoleHome(session.user.primary_role)} replace />;
  }

  return <Outlet />;
}

export function AuthenticatedRoute() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const role = session.user.primary_role;
  if (!role || !isAppRole(role)) {
    return <Navigate to="/" replace />;
  }

  if (session.user.must_change_password) {
    return <Navigate to="/account/change-password" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname, fallback: getRoleHome(role) }} />;
  }

  return <Outlet />;
}
