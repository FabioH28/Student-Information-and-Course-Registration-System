import { ROLE_ACADEMIC_STAFF } from "@/lib/rbac";

export function getTeachingApiBase(role: string | null | undefined) {
  return role === ROLE_ACADEMIC_STAFF ? "/academic" : "/instructors/me";
}

export function getTeachingQueryScope(role: string | null | undefined) {
  return role === ROLE_ACADEMIC_STAFF ? "academic" : "instructor";
}

export function getTeachingWorkspaceLabel(role: string | null | undefined) {
  return role === ROLE_ACADEMIC_STAFF ? "academic staff" : "instructor";
}
