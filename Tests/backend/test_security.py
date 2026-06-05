from src.utils.security import canonical_role, create_access_token, hash_password, verify_password


def test_password_hash_round_trip() -> None:
    password = "CisSecurity!2026"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True


def test_access_token_is_created() -> None:
    token = create_access_token({"sub": "42", "role": "student"})

    assert isinstance(token, str)
    assert token


def test_role_aliases_match_seeded_roles() -> None:
    assert canonical_role("teacher") == "instructor"
    assert canonical_role("staff") == "academic_staff"
    assert canonical_role("admin") == "system_admin"
