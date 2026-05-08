import { ROLE_ACADEMIC_STAFF, ROLE_SYSTEM_ADMIN } from "@/lib/rbac";

function canManageAllAcademic(role: string | null | undefined) {
  return role === ROLE_ACADEMIC_STAFF || role === ROLE_SYSTEM_ADMIN;
}

export function getTeachingApiBase(role: string | null | undefined) {
  return canManageAllAcademic(role) ? "/academic" : "/instructors/me";
}

export function getTeachingQueryScope(role: string | null | undefined) {
  if (role === ROLE_SYSTEM_ADMIN) {
    return "system-admin";
  }
  return role === ROLE_ACADEMIC_STAFF ? "academic" : "instructor";
}

export function getTeachingWorkspaceLabel(role: string | null | undefined) {
  if (role === ROLE_SYSTEM_ADMIN) {
    return "system admin";
  }
  return role === ROLE_ACADEMIC_STAFF ? "academic staff" : "instructor";
}
