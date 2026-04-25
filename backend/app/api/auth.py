from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, RequestUser
from app.db.session import get_db
from app.schemas.auth import (
    BootstrapAdminRequest,
    BootstrapStatusResponse,
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserSummary,
)
from app.services.auth import (
    authenticate_user,
    bootstrap_admin_account,
    change_password,
    confirm_password_reset,
    get_bootstrap_status,
    refresh_access_token,
    request_password_reset,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, summary="Sign in with email and password")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return authenticate_user(db, payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh an access token")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return refresh_access_token(db, payload.refresh_token)


@router.post("/password-reset/request", response_model=PasswordResetResponse, summary="Request a password reset link")
def password_reset_request(payload: PasswordResetRequest, db: Session = Depends(get_db)) -> PasswordResetResponse:
    return PasswordResetResponse(**request_password_reset(db, payload.email))


@router.post("/password-reset/confirm", response_model=TokenResponse, summary="Confirm a password reset with a valid token")
def password_reset_confirm(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return confirm_password_reset(db, payload.token, payload.password)


@router.get("/bootstrap-status", response_model=BootstrapStatusResponse, summary="Check whether first-run admin setup is required")
def bootstrap_status(db: Session = Depends(get_db)) -> BootstrapStatusResponse:
    return BootstrapStatusResponse(**get_bootstrap_status(db))


@router.get("/me", response_model=UserSummary, summary="Get the current authenticated user")
def me(current_user: RequestUser = Depends(get_current_user)) -> UserSummary:
    return UserSummary(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        status=current_user.status,
        roles=current_user.roles,
        primary_role=current_user.primary_role,
        must_change_password=current_user.must_change_password,
    )


@router.post("/change-password", response_model=TokenResponse, summary="Change the current authenticated user's password")
def change_current_password(
    payload: ChangePasswordRequest,
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TokenResponse:
    return change_password(db, current_user.id, payload.current_password, payload.new_password)


@router.post("/bootstrap-admin", response_model=UserSummary, summary="Create the first system admin account")
def bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db)) -> UserSummary:
    return bootstrap_admin_account(
        db,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        employee_number=payload.employee_number,
        title=payload.title,
        office_location=payload.office_location,
    )
