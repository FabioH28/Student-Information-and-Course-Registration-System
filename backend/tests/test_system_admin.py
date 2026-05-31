"""Tests for the System Admin endpoints (Member 6 scope).

These cover the admin-facing routes that back the `/admin/*` UI pages:
user provisioning / role + status changes / password resets (``src/routes/users.py``)
and academic term management (``src/routes/semesters.py``), including the
permission-based RBAC guards that protect them.

The suite is fully self-contained: it spins up an in-memory SQLite database and
overrides the ``get_db`` dependency, so the real (seeded) MySQL database is never
touched and nothing needs to be recreated.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.config.database import get_db
from src.main import app
from src.models.semester import Semester
from src.models.user import User
from src.utils.security import create_access_token, hash_password, verify_password


# --- Isolated in-memory test database -------------------------------------------------
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    # Let SQLite accept the ISO date strings the routes pass straight through
    # (MySQL/PyMySQL does this natively in production).
    native_datetime=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Only the tables exercised by the admin endpoints under test are created. Both models
# use portable column types, so they map cleanly onto SQLite.
User.__table__.create(bind=engine, checkfirst=True)
Semester.__table__.create(bind=engine, checkfirst=True)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Reset state between tests so each one starts from an empty database."""
    with engine.begin() as conn:
        conn.execute(Semester.__table__.delete())
        conn.execute(User.__table__.delete())
    yield


# --- Helpers --------------------------------------------------------------------------

def seed_user(
    role: str = "system_admin",
    *,
    email: str | None = None,
    status: str = "active",
    is_active: bool = True,
    password: str = "Secret@123",
    full_name: str | None = None,
) -> dict:
    db = TestingSessionLocal()
    try:
        user = User(
            email=email or f"{role}@test.local",
            full_name=full_name or f"{role.replace('_', ' ').title()}",
            password_hash=hash_password(password),
            role=role,
            status=status,
            is_first_login=False,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"id": user.id, "email": user.email, "role": user.role}
    finally:
        db.close()


def auth_header(user: dict) -> dict:
    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return {"Authorization": f"Bearer {token}"}


def get_user(user_id: int) -> User | None:
    db = TestingSessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()


# --- /users : listing & RBAC ----------------------------------------------------------

def test_list_users_requires_authentication() -> None:
    response = client.get("/users")
    # No bearer credentials -> rejected before the role guard runs.
    assert response.status_code in (401, 403)


def test_list_users_forbidden_for_non_admin() -> None:
    student = seed_user("student", email="student@test.local")
    response = client.get("/users", headers=auth_header(student))
    assert response.status_code == 403


def test_list_users_returns_all_for_admin() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    seed_user("student", email="s1@test.local")
    seed_user("instructor", email="t1@test.local")

    response = client.get("/users", headers=auth_header(admin))

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 3
    assert {u["email"] for u in body} == {"admin@test.local", "s1@test.local", "t1@test.local"}
    # payload shape used by the AdminUsers page
    assert {"id", "email", "role", "status", "is_active", "display_name"} <= set(body[0].keys())


def test_role_alias_admin_token_is_accepted() -> None:
    # `admin` is an alias for `system_admin`; the guard canonicalizes it.
    admin = seed_user("admin", email="legacy-admin@test.local")
    response = client.get("/users", headers=auth_header(admin))
    assert response.status_code == 200


# --- /users/pending -------------------------------------------------------------------

def test_pending_users_only_lists_pending_accounts() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    seed_user("student", email="active@test.local", status="active")
    seed_user("student", email="waiting@test.local", status="pending_approval")

    response = client.get("/users/pending", headers=auth_header(admin))

    assert response.status_code == 200
    body = response.json()
    assert [u["email"] for u in body] == ["waiting@test.local"]


# --- /users : create ------------------------------------------------------------------

def test_create_user_persists_active_account() -> None:
    admin = seed_user("system_admin", email="admin@test.local")

    response = client.post(
        "/users",
        headers=auth_header(admin),
        json={"email": "new.user@test.local", "password": "Welcome@123", "role": "student", "full_name": "New User"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new.user@test.local"
    assert body["role"] == "student"
    assert body["status"] == "active"
    assert body["is_active"] is True

    stored = get_user(body["id"])
    assert stored is not None
    assert stored.password_hash != "Welcome@123"
    assert verify_password("Welcome@123", stored.password_hash)
    assert stored.is_first_login is True


def test_create_user_forbidden_for_non_admin() -> None:
    student = seed_user("student", email="student@test.local")
    response = client.post(
        "/users",
        headers=auth_header(student),
        json={"email": "x@test.local", "password": "Welcome@123", "role": "student"},
    )
    assert response.status_code == 403


# --- /users/{id} : patch role & status ------------------------------------------------

def test_update_user_changes_role_and_status() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    target = seed_user("student", email="target@test.local")

    response = client.patch(
        f"/users/{target['id']}",
        headers=auth_header(admin),
        json={"role": "instructor", "is_active": False},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "instructor"
    assert body["is_active"] is False

    stored = get_user(target["id"])
    assert stored.role == "instructor"
    assert stored.is_active is False


def test_update_missing_user_returns_404() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    response = client.patch("/users/9999", headers=auth_header(admin), json={"role": "instructor"})
    assert response.status_code == 404


# --- /users/{id}/approve & refuse -----------------------------------------------------

def test_approve_user_activates_account() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    pending = seed_user("student", email="pending@test.local", status="pending_approval", is_active=False)

    response = client.post(
        f"/users/{pending['id']}/approve",
        headers=auth_header(admin),
        json={"role": "academic_staff"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "academic_staff"
    assert body["status"] == "active"
    assert body["is_active"] is True


def test_refuse_user_deactivates_account() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    pending = seed_user("student", email="pending@test.local", status="pending_approval")

    response = client.post(
        f"/users/{pending['id']}/refuse",
        headers=auth_header(admin),
        json={"reason": "Not a real applicant"},
    )

    assert response.status_code == 200
    stored = get_user(pending["id"])
    assert stored.status == "refused"
    assert stored.is_active is False


# --- /users/{id}/reset-password -------------------------------------------------------

def test_reset_password_sets_default_and_forces_change() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    target = seed_user("student", email="target@test.local", password="Original@123")

    response = client.post(f"/users/{target['id']}/reset-password", headers=auth_header(admin))

    assert response.status_code == 200
    stored = get_user(target["id"])
    assert verify_password("password123", stored.password_hash)
    assert not verify_password("Original@123", stored.password_hash)
    assert stored.is_first_login is True


def test_reset_password_missing_user_returns_404() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    response = client.post("/users/9999/reset-password", headers=auth_header(admin))
    assert response.status_code == 404


# --- /semesters : academic term management --------------------------------------------

def test_list_semesters_allows_any_authenticated_user() -> None:
    student = seed_user("student", email="student@test.local")
    response = client.get("/semesters", headers=auth_header(student))
    assert response.status_code == 200
    assert response.json() == []


def test_create_semester_forbidden_for_student() -> None:
    student = seed_user("student", email="student@test.local")
    response = client.post(
        "/semesters",
        headers=auth_header(student),
        json={
            "name": "Fall 2026",
            "start_date": "2026-09-01",
            "end_date": "2026-12-20",
            "registration_deadline": "2026-08-25",
            "drop_deadline": "2026-09-15",
        },
    )
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["system_admin", "academic_staff"])
def test_create_semester_allowed_for_admin_and_staff(role: str) -> None:
    actor = seed_user(role, email=f"{role}@test.local")
    response = client.post(
        "/semesters",
        headers=auth_header(actor),
        json={
            "name": "Spring 2027",
            "start_date": "2027-02-01",
            "end_date": "2027-05-30",
            "registration_deadline": "2027-01-25",
            "drop_deadline": "2027-02-15",
            "total_weeks": 14,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Spring 2027"
    assert body["is_active"] is False


def test_update_semester_can_activate_term() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    created = client.post(
        "/semesters",
        headers=auth_header(admin),
        json={
            "name": "Summer 2027",
            "start_date": "2027-06-01",
            "end_date": "2027-08-15",
            "registration_deadline": "2027-05-20",
            "drop_deadline": "2027-06-10",
        },
    ).json()

    response = client.patch(
        f"/semesters/{created['id']}",
        headers=auth_header(admin),
        json={"is_active": True},
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is True


def test_update_missing_semester_returns_404() -> None:
    admin = seed_user("system_admin", email="admin@test.local")
    response = client.patch("/semesters/9999", headers=auth_header(admin), json={"is_active": True})
    assert response.status_code == 404
