from src.utils.security import canonical_role


def test_known_roles_are_canonicalized() -> None:
    assert canonical_role("student") == "student"
    assert canonical_role("instructor") == "instructor"
    assert canonical_role("academic_staff") == "academic_staff"
    assert canonical_role("system_admin") == "system_admin"
