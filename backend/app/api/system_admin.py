from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import (
    PERMISSION_REPORTS_VIEW,
    PERMISSION_ROLES_MANAGE,
    PERMISSION_SETTINGS_MANAGE,
    PERMISSION_SYSTEM_OVERVIEW,
    PERMISSION_USERS_MANAGE,
)
from app.db.session import get_db
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminPasswordResetResponse,
    AdminProvisionUserResponse,
    TeacherOfferingAssignmentsRequest,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.services.admin import (
    create_user_account,
    get_admin_analytics,
    get_admin_dashboard,
    get_admin_reference_data,
    get_admin_settings,
    get_admin_staff_overview,
    get_admin_teacher_offering_assignments,
    list_students,
    update_admin_teacher_offering_assignments,
)
from app.services.admin_phase3 import (
    reset_admin_user_password,
    update_admin_user_role,
    update_admin_user_status,
)


router = APIRouter(prefix="/system-admin", tags=["system-admin"])


@router.get("/dashboard", summary="Get the system admin dashboard")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_SYSTEM_OVERVIEW)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_dashboard(db)


@router.get("/students", summary="List students for system administration")
def students(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return list_students(db)


@router.get("/reference-data", summary="Get reference data for system admin forms")
def reference_data(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_reference_data(db)


@router.get("/staff", summary="List instructors and staff members")
def staff(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_staff_overview(db)


@router.get("/instructors/{teacher_profile_id}/offering-assignments", summary="Get offering assignments for an instructor")
def instructor_offering_assignments(
    teacher_profile_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_teacher_offering_assignments(db, teacher_profile_id)


@router.put("/instructors/{teacher_profile_id}/offering-assignments", summary="Update offering assignments for an instructor")
def update_instructor_offering_assignments(
    teacher_profile_id: int,
    payload: TeacherOfferingAssignmentsRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_teacher_offering_assignments(db, current_user.id, teacher_profile_id, payload.offering_ids)


@router.post("/users", response_model=AdminProvisionUserResponse, summary="Create a user account from the system admin workspace")
def create_user(
    payload: AdminCreateUserRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> AdminProvisionUserResponse:
    return create_user_account(db, current_user.id, payload)


@router.put("/users/{user_id}/status", summary="Update a user account status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_user_status(db, current_user.id, user_id, payload)


@router.put("/users/{user_id}/role", summary="Update a user's primary role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ROLES_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_user_role(db, current_user.id, user_id, payload)


@router.post("/users/{user_id}/reset-password", response_model=AdminPasswordResetResponse, summary="Reset a user password")
def reset_user_password(
    user_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_USERS_MANAGE)),
    db: Session = Depends(get_db),
) -> AdminPasswordResetResponse:
    return reset_admin_user_password(db, current_user.id, user_id)


@router.get("/settings", summary="Get current system settings")
def settings(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_SETTINGS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_settings(db)


@router.get("/analytics", summary="Get reports and system analytics")
def analytics(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_REPORTS_VIEW)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_analytics(db)
