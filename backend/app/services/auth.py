from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.rbac import ROLE_SYSTEM_ADMIN
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.schemas.auth import TokenResponse, UserSummary


@dataclass(slots=True)
class AuthenticatedIdentity:
    id: int
    email: str
    password_hash: str
    first_name: str
    last_name: str
    status: str
    must_change_password: bool
    roles: list[str]
    permissions: list[str]

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def primary_role(self) -> str | None:
        return self.roles[0] if self.roles else None


def _identity_from_row(row: Any | None) -> AuthenticatedIdentity | None:
    if row is None:
        return None

    roles = [role for role in (row["roles_csv"] or "").split(",") if role]
    permissions = [permission for permission in (row["permissions_csv"] or "").split(",") if permission]
    return AuthenticatedIdentity(
        id=row["id"],
        email=row["email"],
        password_hash=row["password_hash"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        status=row["status"],
        must_change_password=bool(row["must_change_password"]),
        roles=roles,
        permissions=permissions,
    )


def get_identity_by_email(db: Session, email: str) -> AuthenticatedIdentity | None:
    query = text(
        """
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.status,
          u.must_change_password,
          GROUP_CONCAT(DISTINCT r.code ORDER BY ur.is_primary DESC, r.id SEPARATOR ',') AS roles_csv,
          GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions_csv
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON rp.role_id = ur.role_id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE u.email = :email
          AND u.deleted_at IS NULL
        GROUP BY
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.status,
          u.must_change_password
        """
    )
    row = db.execute(query, {"email": email.lower().strip()}).mappings().first()
    return _identity_from_row(row)


def get_identity_by_user_id(db: Session, user_id: int) -> AuthenticatedIdentity | None:
    query = text(
        """
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.status,
          u.must_change_password,
          GROUP_CONCAT(DISTINCT r.code ORDER BY ur.is_primary DESC, r.id SEPARATOR ',') AS roles_csv,
          GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions_csv
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON rp.role_id = ur.role_id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE u.id = :user_id
          AND u.deleted_at IS NULL
        GROUP BY
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.status,
          u.must_change_password
        """
    )
    row = db.execute(query, {"user_id": user_id}).mappings().first()
    return _identity_from_row(row)


def serialize_user(identity: AuthenticatedIdentity) -> UserSummary:
    return UserSummary(
        id=identity.id,
        email=identity.email,
        first_name=identity.first_name,
        last_name=identity.last_name,
        full_name=identity.full_name,
        status=identity.status,
        roles=identity.roles,
        primary_role=identity.primary_role,
        must_change_password=identity.must_change_password,
    )


def _create_audit_log(
    db: Session,
    actor_user_id: int | None,
    entity_type: str,
    entity_id: str | int,
    action: str,
    summary: str,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO audit_logs (
              actor_user_id,
              entity_type,
              entity_id,
              action,
              summary,
              created_at
            ) VALUES (
              :actor_user_id,
              :entity_type,
              :entity_id,
              :action,
              :summary,
              :created_at
            )
            """
        ),
        {
            "actor_user_id": actor_user_id,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "action": action,
            "summary": summary[:255],
            "created_at": datetime.now(UTC).replace(tzinfo=None),
        },
    )


def _revoke_all_refresh_tokens(db: Session, user_id: int) -> None:
    db.execute(
        text(
            """
            UPDATE auth_refresh_tokens
            SET revoked_at = COALESCE(revoked_at, :revoked_at)
            WHERE user_id = :user_id
              AND revoked_at IS NULL
            """
        ),
        {
            "revoked_at": datetime.now(UTC).replace(tzinfo=None),
            "user_id": user_id,
        },
    )


def _issue_password_reset_token(db: Session, user_id: int) -> str:
    settings = get_settings()
    reset_token = generate_refresh_token()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.password_reset_token_expire_minutes)
    db.execute(
        text(
            """
            INSERT INTO password_reset_tokens (
              user_id,
              token_hash,
              expires_at
            ) VALUES (
              :user_id,
              :token_hash,
              :expires_at
            )
            """
        ),
        {
            "user_id": user_id,
            "token_hash": hash_token(reset_token),
            "expires_at": expires_at.replace(tzinfo=None),
        },
    )
    return reset_token


def _store_refresh_token(db: Session, user_id: int, refresh_token: str) -> None:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    db.execute(
        text(
            """
            INSERT INTO auth_refresh_tokens (
              user_id,
              token_hash,
              expires_at
            ) VALUES (
              :user_id,
              :token_hash,
              :expires_at
            )
            """
        ),
        {
            "user_id": user_id,
            "token_hash": hash_token(refresh_token),
            "expires_at": expires_at.replace(tzinfo=None),
        },
    )


def _build_token_response(db: Session, identity: AuthenticatedIdentity) -> TokenResponse:
    access_token, expires_at = create_access_token(
        subject=str(identity.id),
        additional_claims={"roles": identity.roles, "email": identity.email},
    )
    refresh_token = generate_refresh_token()
    _store_refresh_token(db, identity.id, refresh_token)
    db.execute(
        text(
            """
            UPDATE users
            SET last_login_at = :last_login_at,
                failed_login_count = 0,
                last_failed_login_at = NULL
            WHERE id = :user_id
            """
        ),
        {"last_login_at": datetime.now(UTC).replace(tzinfo=None), "user_id": identity.id},
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
        user=serialize_user(identity),
    )


def authenticate_user(db: Session, email: str, password: str) -> TokenResponse:
    settings = get_settings()
    identity = get_identity_by_email(db, email)
    if identity is not None and identity.status == "active":
        failed_at_row = db.execute(
            text(
                """
                SELECT failed_login_count, last_failed_login_at
                FROM users
                WHERE id = :user_id
                """
            ),
            {"user_id": identity.id},
        ).mappings().first()
        if failed_at_row and failed_at_row["failed_login_count"] is not None and int(failed_at_row["failed_login_count"]) >= settings.login_lockout_threshold:
            last_failed_login_at = failed_at_row["last_failed_login_at"]
            if last_failed_login_at is not None:
                lockout_cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=settings.login_lockout_minutes)
                if last_failed_login_at >= lockout_cutoff:
                    raise HTTPException(
                        status_code=status.HTTP_423_LOCKED,
                        detail=f"Too many failed sign-in attempts. Try again in {settings.login_lockout_minutes} minutes or reset your password.",
                    )

    if identity is None or not verify_password(password, identity.password_hash):
        if identity is not None:
            db.execute(
                text(
                    """
                    UPDATE users
                    SET failed_login_count = failed_login_count + 1,
                        last_failed_login_at = :last_failed_login_at
                    WHERE id = :user_id
                    """
                ),
                {
                    "last_failed_login_at": datetime.now(UTC).replace(tzinfo=None),
                    "user_id": identity.id,
                },
            )
            db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if identity.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active.",
        )

    _create_audit_log(
        db,
        actor_user_id=identity.id,
        entity_type="user",
        entity_id=identity.id,
        action="login",
        summary=f"{identity.email} signed in to CIS.",
    )

    return _build_token_response(db, identity)


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    row = db.execute(
        text(
            """
            SELECT user_id
            FROM auth_refresh_tokens
            WHERE token_hash = :token_hash
              AND revoked_at IS NULL
              AND expires_at > :current_time
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {
            "token_hash": hash_token(refresh_token),
            "current_time": datetime.now(UTC).replace(tzinfo=None),
        },
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )

    db.execute(
        text(
            """
            UPDATE auth_refresh_tokens
            SET revoked_at = :revoked_at
            WHERE token_hash = :token_hash
            """
        ),
        {
            "revoked_at": datetime.now(UTC).replace(tzinfo=None),
            "token_hash": hash_token(refresh_token),
        },
    )

    identity = get_identity_by_user_id(db, row["user_id"])
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account no longer exists.")

    return _build_token_response(db, identity)


def get_current_user_identity(db: Session, token: str) -> dict[str, Any] | None:
    payload = decode_access_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")

    subject = payload.get("sub")
    if subject is None:
        return None

    identity = get_identity_by_user_id(db, int(subject))
    if identity is None:
        return None

    if identity.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active.")

    return {
        "id": identity.id,
        "email": identity.email,
        "first_name": identity.first_name,
        "last_name": identity.last_name,
        "status": identity.status,
        "roles": identity.roles,
        "permissions": identity.permissions,
        "must_change_password": identity.must_change_password,
    }


def request_password_reset(db: Session, email: str) -> dict[str, str | None]:
    settings = get_settings()
    identity = get_identity_by_email(db, email)
    preview_token: str | None = None

    if identity is not None and identity.status != "disabled":
        preview_token = _issue_password_reset_token(db, identity.id)
        _create_audit_log(
            db,
            actor_user_id=identity.id,
            entity_type="password_reset",
            entity_id=identity.id,
            action="create",
            summary=f"Password reset requested for {identity.email}.",
        )
        db.commit()

    return {
        "message": "If the account exists, password reset instructions have been prepared for delivery.",
        "preview_reset_token": preview_token if settings.app_env != "production" and settings.enable_dev_reset_token_preview else None,
    }


def confirm_password_reset(db: Session, token: str, new_password: str) -> TokenResponse:
    row = db.execute(
        text(
            """
            SELECT id, user_id
            FROM password_reset_tokens
            WHERE token_hash = :token_hash
              AND used_at IS NULL
              AND expires_at > :current_time
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {
            "token_hash": hash_token(token),
            "current_time": datetime.now(UTC).replace(tzinfo=None),
        },
    ).mappings().first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The password reset link is invalid or has expired.")

    db.execute(
        text(
            """
            UPDATE users
            SET password_hash = :password_hash,
                must_change_password = FALSE,
                password_changed_at = :password_changed_at,
                failed_login_count = 0,
                last_failed_login_at = NULL
            WHERE id = :user_id
            """
        ),
        {
            "password_hash": hash_password(new_password),
            "password_changed_at": datetime.now(UTC).replace(tzinfo=None),
            "user_id": row["user_id"],
        },
    )
    db.execute(
        text(
            """
            UPDATE password_reset_tokens
            SET used_at = :used_at
            WHERE id = :token_id
            """
        ),
        {
            "used_at": datetime.now(UTC).replace(tzinfo=None),
            "token_id": row["id"],
        },
    )
    _revoke_all_refresh_tokens(db, int(row["user_id"]))
    _create_audit_log(
        db,
        actor_user_id=int(row["user_id"]),
        entity_type="user",
        entity_id=int(row["user_id"]),
        action="update",
        summary="Password reset completed.",
    )
    db.commit()

    identity = get_identity_by_user_id(db, int(row["user_id"]))
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account no longer exists.")

    return _build_token_response(db, identity)


def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> TokenResponse:
    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account no longer exists.")

    if not verify_password(current_password, identity.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

    if current_password == new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a new password that is different from the current one.")

    db.execute(
        text(
            """
            UPDATE users
            SET password_hash = :password_hash,
                must_change_password = FALSE,
                password_changed_at = :password_changed_at
            WHERE id = :user_id
            """
        ),
        {
            "password_hash": hash_password(new_password),
            "password_changed_at": datetime.now(UTC).replace(tzinfo=None),
            "user_id": user_id,
        },
    )
    _revoke_all_refresh_tokens(db, user_id)
    _create_audit_log(
        db,
        actor_user_id=user_id,
        entity_type="user",
        entity_id=user_id,
        action="update",
        summary=f"{identity.email} changed their password.",
    )
    db.commit()

    refreshed_identity = get_identity_by_user_id(db, user_id)
    if refreshed_identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account no longer exists.")

    return _build_token_response(db, refreshed_identity)


def bootstrap_admin_account(
    db: Session,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    employee_number: str,
    title: str | None,
    office_location: str | None,
) -> UserSummary:
    admin_exists = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.code = :role_code
            """
        ),
        {"role_code": ROLE_SYSTEM_ADMIN},
    ).scalar_one()

    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A System Admin account already exists. Use an authenticated System Admin session to create more accounts.",
        )

    existing_user = get_identity_by_email(db, email)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    db.execute(
        text(
            """
            INSERT INTO users (
              email,
              password_hash,
              first_name,
              last_name,
              status,
              must_change_password,
              account_origin,
              invited_at
            ) VALUES (
              :email,
              :password_hash,
              :first_name,
              :last_name,
              'active',
              FALSE,
              'admin_provisioned',
              :invited_at
            )
            """
        ),
        {
            "email": email.lower().strip(),
            "password_hash": hash_password(password),
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "invited_at": datetime.now(UTC).replace(tzinfo=None),
        },
    )

    user_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    admin_role_id = db.execute(text("SELECT id FROM roles WHERE code = :role_code"), {"role_code": ROLE_SYSTEM_ADMIN}).scalar_one()

    db.execute(
        text(
            """
            INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
            VALUES (:user_id, :role_id, TRUE, :assigned_at)
            """
        ),
        {"user_id": user_id, "role_id": admin_role_id, "assigned_at": datetime.now(UTC).replace(tzinfo=None)},
    )
    db.execute(
        text(
            """
            INSERT INTO admin_profiles (
              user_id,
              employee_number,
              title,
              office_location,
              employment_status
            ) VALUES (
              :user_id,
              :employee_number,
              :title,
              :office_location,
              'active'
            )
            """
        ),
        {
            "user_id": user_id,
            "employee_number": employee_number,
            "title": title,
            "office_location": office_location,
        },
    )
    db.commit()

    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create admin account.")

    return serialize_user(identity)


def get_bootstrap_status(db: Session) -> dict[str, int | bool]:
    admin_accounts = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.code = :role_code
            """
        ),
        {"role_code": ROLE_SYSTEM_ADMIN},
    ).scalar_one()

    return {
        "bootstrap_required": admin_accounts == 0,
        "system_admin_accounts": int(admin_accounts or 0),
    }
