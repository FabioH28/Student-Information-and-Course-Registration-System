import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canonicalRole, homeRouteForRole } from "@/lib/authRoles";

interface RequireAuthProps {
  allowedRole: string;
}

export function RequireAuth({ allowedRole }: RequireAuthProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  const userRole = canonicalRole(user.role);

  if (userRole !== canonicalRole(allowedRole)) {
    return <Navigate to={homeRouteForRole(user.role) ?? "/"} replace />;
  }

  return <Outlet />;
}
