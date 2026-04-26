from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.user import User
from src.schemas.auth import LoginRequest, LoginResponse, ChangePasswordRequest, ResetPasswordRequest, ConfirmResetRequest
from src.utils.security import verify_password, hash_password, create_access_token, get_current_user
from src.utils.audit import log_action
import secrets
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    log_action(db, user.id, "LOGIN", "users", user.id, "Successful login", request.client.host)
    return LoginResponse(access_token=token, role=user.role, require_password_change=user.is_first_login)

@router.post("/change-password")
def change_password(body: ChangePasswordRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.password_hash = hash_password(body.new_password)
    current_user.is_first_login = False
    db.commit()
    log_action(db, current_user.id, "CHANGE_PASSWORD", "users", current_user.id, "Password changed", request.client.host)
    return {"message": "Password changed successfully"}

@router.post("/request-reset")
def request_reset(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    from src.models.password_reset_token import PasswordResetToken
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        token = secrets.token_urlsafe(48)
        reset = PasswordResetToken(user_id=user.id, token=hash_password(token), expires_at=datetime.now(timezone.utc) + timedelta(minutes=15))
        db.add(reset)
        db.commit()
    return {"message": "If your email exists, a reset link has been sent"}

@router.post("/reset-password")
def reset_password(body: ConfirmResetRequest, db: Session = Depends(get_db)):
    from src.models.password_reset_token import PasswordResetToken
    records = db.query(PasswordResetToken).filter(PasswordResetToken.expires_at > datetime.now(timezone.utc), PasswordResetToken.used_at == None).all()
    matched = next((r for r in records if verify_password(body.token, r.token)), None)
    if not matched:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == matched.user_id).first()
    user.password_hash = hash_password(body.new_password)
    user.is_first_login = False
    matched.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password reset successfully"}
