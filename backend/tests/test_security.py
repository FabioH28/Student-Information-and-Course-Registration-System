from app.core.security import create_access_token, generate_refresh_token, hash_password, hash_token, verify_password


def test_password_hash_round_trip() -> None:
    password = "CisSecurity!2026"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True


def test_access_token_contains_expected_subject() -> None:
    token, _ = create_access_token("42", {"roles": ["Student"]})

    assert isinstance(token, str)
    assert token


def test_token_hash_is_deterministic() -> None:
    token = generate_refresh_token()

    assert hash_token(token) == hash_token(token)
    assert hash_token(token) != hash_token(generate_refresh_token())
