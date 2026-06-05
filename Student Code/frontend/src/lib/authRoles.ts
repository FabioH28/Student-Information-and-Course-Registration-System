const ROLE_ALIASES: Record<string, string> = {
  admin: "system_admin",
  staff: "academic_staff",
  teacher: "instructor",
  professor: "instructor",
};

const ROLE_HOME_ROUTES: Record<string, string> = {
  student: "/student",
  instructor: "/instructor",
  academic_staff: "/staff",
  finance_staff: "/finance-staff",
  system_admin: "/admin",
};

export function canonicalRole(role: string) {
  return ROLE_ALIASES[role] ?? role;
}

export function homeRouteForRole(role: string) {
  return ROLE_HOME_ROUTES[canonicalRole(role)] ?? null;
}
