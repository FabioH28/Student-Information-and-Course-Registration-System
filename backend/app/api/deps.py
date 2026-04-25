from collections.abc import Callable
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth import get_current_user_identity


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@dataclass(slots=True)
class RequestUser:
    id: int
    email: str
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


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> RequestUser:
    try:
        identity = get_current_user_identity(db, token)
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if identity is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return RequestUser(
        id=identity["id"],
        email=identity["email"],
        first_name=identity["first_name"],
        last_name=identity["last_name"],
        status=identity["status"],
        must_change_password=bool(identity.get("must_change_password")),
        roles=identity["roles"],
        permissions=identity["permissions"],
    )


def require_roles(*roles: str) -> Callable[[RequestUser], RequestUser]:
    def dependency(current_user: RequestUser = Depends(get_current_user)) -> RequestUser:
        if not any(role in current_user.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return current_user

    return dependency


def require_permissions(*permissions: str) -> Callable[[RequestUser], RequestUser]:
    def dependency(current_user: RequestUser = Depends(get_current_user)) -> RequestUser:
        if not any(permission in current_user.permissions for permission in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return current_user

    return dependency
