from app.core.rbac import (
    PERMISSION_ACADEMIC_ATTENDANCE,
    PERMISSION_ACADEMIC_GRADES,
    PERMISSION_PROFILE_EDIT_SELF,
    PERMISSION_PROFILE_VIEW_SELF,
    ROLE_PERMISSIONS,
    ROLE_SYSTEM_ADMIN,
)


def test_system_admin_has_full_academic_operations_permissions():
    permissions = set(ROLE_PERMISSIONS[ROLE_SYSTEM_ADMIN])

    assert PERMISSION_ACADEMIC_GRADES in permissions
    assert PERMISSION_ACADEMIC_ATTENDANCE in permissions


def test_every_role_can_view_and_edit_own_profile():
    for permissions in ROLE_PERMISSIONS.values():
        assert PERMISSION_PROFILE_VIEW_SELF in permissions
        assert PERMISSION_PROFILE_EDIT_SELF in permissions
