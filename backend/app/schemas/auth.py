from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    # Login should accept any existing stored password length.
    # Stronger minimum-length rules are enforced when creating or changing passwords.
    password: str = Field(min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=32)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(min_length=32, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    employee_number: str = Field(min_length=1, max_length=30)
    title: str | None = Field(default=None, max_length=100)
    office_location: str | None = Field(default=None, max_length=100)


class BootstrapStatusResponse(BaseModel):
    bootstrap_required: bool
    system_admin_accounts: int


class PasswordResetResponse(BaseModel):
    message: str
    preview_reset_token: str | None = None


class UserSummary(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    status: str
    roles: list[str]
    primary_role: str | None = None
    must_change_password: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime
    user: UserSummary
