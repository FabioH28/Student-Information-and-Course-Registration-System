import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.models.email_verification_token import EmailVerificationToken
from src.schemas.auth import (
    LoginRequest, LoginResponse,
    RegisterRequest, VerifyEmailRequest,
    ChangePasswordRequest, ResetPasswordRequest, ConfirmResetRequest,
)
from src.utils.security import verify_password, hash_password, create_access_token, get_current_user
from src.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _display_name(user: User, db: Session) -> str:
    if user.full_name:
        return user.full_name
    if user.role == "student":
        p = db.query(Student).filter(Student.user_id == user.id).first()
        if p:
            return f"{p.first_name} {p.last_name}"
    elif user.role == "instructor":
        p = db.query(Instructor).filter(Instructor.user_id == user.id).first()
        if p:
            return (f"{p.title} {p.last_name}".strip() if p.title else f"{p.first_name} {p.last_name}")
    return user.email.split("@")[0]


@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    from src.utils.email import send_verification_code
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role="student",
        status="pending_verification",
        is_first_login=True,
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    code = str(random.randint(100000, 999999))
    token = EmailVerificationToken(
        user_id=user.id,
        token=hash_password(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(token)
    db.commit()
    try:
        send_verification_code(user.email, code, body.full_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")
    return {"message": "Registration successful. Check your email for a verification code."}


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or user.status != "pending_verification":
        raise HTTPException(status_code=400, detail="Invalid request")
    records = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.expires_at > datetime.now(timezone.utc),
        EmailVerificationToken.used_at == None,
    ).all()
    matched = next((r for r in records if verify_password(body.code, r.token)), None)
    if not matched:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user.status = "pending_approval"
    matched.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Email verified. Your account is pending admin approval."}


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status == "pending_verification":
        raise HTTPException(status_code=403, detail="Please verify your email address first")
    if user.status == "pending_approval":
        raise HTTPException(status_code=403, detail="Your account is pending admin approval")
    if user.status == "refused":
        raise HTTPException(status_code=403, detail="Your registration was refused. Contact the administrator.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    log_action(db, user.id, "LOGIN", "users", user.id, "Successful login", request.client.host)
    return LoginResponse(
        access_token=token,
        role=user.role,
        require_password_change=user.is_first_login,
        email=user.email,
        display_name=_display_name(user, db),
    )


@router.post("/change-password")
def change_password(body: ChangePasswordRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(body.new_password)
    current_user.is_first_login = False
    db.commit()
    log_action(db, current_user.id, "CHANGE_PASSWORD", "users", current_user.id, "Password changed", request.client.host)
    return {"message": "Password changed successfully"}


@router.post("/request-reset")
def request_reset(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    from src.models.password_reset_token import PasswordResetToken
    from src.utils.email import send_reset_code
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        code = str(random.randint(100000, 999999))
        reset = PasswordResetToken(
            user_id=user.id,
            token=hash_password(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        db.add(reset)
        db.commit()
        try:
            send_reset_code(user.email, code, _display_name(user, db))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    return {"message": "If your email exists, a 6-digit code has been sent"}


@router.post("/reset-password")
def reset_password(body: ConfirmResetRequest, db: Session = Depends(get_db)):
    from src.models.password_reset_token import PasswordResetToken
    records = db.query(PasswordResetToken).filter(
        PasswordResetToken.expires_at > datetime.now(timezone.utc),
        PasswordResetToken.used_at == None,
    ).all()
    matched = next((r for r in records if verify_password(body.token, r.token)), None)
    if not matched:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user = db.query(User).filter(User.id == matched.user_id).first()
    user.password_hash = hash_password(body.new_password)
    user.is_first_login = False
    matched.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password reset successfully"}
