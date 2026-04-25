export const ROLE_STUDENT = "Student";
export const ROLE_INSTRUCTOR = "Instructor";
export const ROLE_ACADEMIC_STAFF = "Academic Staff";
export const ROLE_FINANCE_STAFF = "Finance Staff";
export const ROLE_COMMUNICATION_STAFF = "Communication Staff";
export const ROLE_SYSTEM_ADMIN = "System Admin";

export const APP_ROLES = [
  ROLE_STUDENT,
  ROLE_INSTRUCTOR,
  ROLE_ACADEMIC_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_SYSTEM_ADMIN,
] as const;

export type AppRole = (typeof APP_ROLES)[number];
export const STAFF_ROLES = [
  ROLE_ACADEMIC_STAFF,
  ROLE_FINANCE_STAFF,
  ROLE_COMMUNICATION_STAFF,
  ROLE_SYSTEM_ADMIN,
] as const;

const ROLE_HOME_MAP: Record<AppRole, string> = {
  [ROLE_STUDENT]: "/student",
  [ROLE_INSTRUCTOR]: "/instructor",
  [ROLE_ACADEMIC_STAFF]: "/academic",
  [ROLE_FINANCE_STAFF]: "/finance",
  [ROLE_COMMUNICATION_STAFF]: "/communications",
  [ROLE_SYSTEM_ADMIN]: "/system-admin",
};

export function getRoleHome(role: string | null | undefined) {
  if (!role) {
    return "/";
  }

  return ROLE_HOME_MAP[role as AppRole] ?? "/";
}

export function isAppRole(role: string | null | undefined): role is AppRole {
  return Boolean(role && APP_ROLES.includes(role as AppRole));
}

export function isStaffRole(role: string | null | undefined): role is (typeof STAFF_ROLES)[number] {
  return Boolean(role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]));
}
