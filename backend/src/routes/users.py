from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.utils.security import require_roles, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

admin_only = require_roles("system_admin")

VALID_ROLES = {"student", "instructor", "academic_staff", "finance_staff", "system_admin"}


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    status: str
    is_active: bool
    is_first_login: bool
    display_name: str
    created_at: str

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: str
    password: str
    role: str


class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ApproveRequest(BaseModel):
    role: str


class RefuseRequest(BaseModel):
    reason: Optional[str] = None


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
            return f"{p.title} {p.last_name}".strip() if p.title else f"{p.first_name} {p.last_name}"
    return user.email.split("@")[0]


def _to_out(user: User, db: Session) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        is_active=user.is_active,
        is_first_login=user.is_first_login,
        display_name=_display_name(user, db),
        created_at=user.created_at.isoformat(),
    )


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(admin_only)):
    users = db.query(User).filter(User.status == "active").order_by(User.created_at.desc()).all()
    return [_to_out(u, db) for u in users]


@router.get("/pending", response_model=list[UserOut])
def list_pending(db: Session = Depends(get_db), _=Depends(admin_only)):
    users = db.query(User).filter(User.status == "pending_approval").order_by(User.created_at.desc()).all()
    return [_to_out(u, db) for u in users]


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        status="active",
        is_first_login=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user, db)


@router.post("/{user_id}/approve", response_model=UserOut)
def approve_user(user_id: int, body: ApproveRequest, db: Session = Depends(get_db), _=Depends(admin_only)):
    from src.utils.email import send_approval_email
    user = db.query(User).filter(User.id == user_id, User.status == "pending_approval").first()
    if not user:
        raise HTTPException(status_code=404, detail="Pending user not found")
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = body.role
    user.status = "active"
    user.is_active = True
    db.commit()
    db.refresh(user)
    try:
        send_approval_email(user.email, user.full_name or user.email.split("@")[0], body.role)
    except Exception:
        pass
    return _to_out(user, db)


@router.post("/{user_id}/refuse")
def refuse_user(user_id: int, body: RefuseRequest, db: Session = Depends(get_db), _=Depends(admin_only)):
    from src.utils.email import send_refusal_email
    user = db.query(User).filter(User.id == user_id, User.status == "pending_approval").first()
    if not user:
        raise HTTPException(status_code=404, detail="Pending user not found")
    user.status = "refused"
    db.commit()
    try:
        send_refusal_email(user.email, user.full_name or user.email.split("@")[0], body.reason or "")
    except Exception:
        pass
    return {"message": "User refused"}


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), current=Depends(admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account here")
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return _to_out(user, db)


@router.post("/{user_id}/reset-password")
def reset_user_password(user_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password("ChangeMe123!")
    user.is_first_login = True
    db.commit()
    return {"message": "Password reset to default. User must change on next login."}
