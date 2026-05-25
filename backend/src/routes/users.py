from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.instructor import Instructor
from src.models.user import User
from src.models.offering import Offering
from src.utils.security import hash_password, require_roles


router = APIRouter(prefix="/users", tags=["Users"])
instructor_profile_router = APIRouter(prefix="/api/instructor", tags=["Instructor Profile"])


class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    full_name: str | None = None


class UserPatch(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class ApproveIn(BaseModel):
    role: str


class RefuseIn(BaseModel):
    reason: str | None = None


@router.get("", response_model=List[dict])
def list_users(current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    return [_payload(user) for user in db.query(User).all()]


@router.get("/pending", response_model=List[dict])
def pending_users(current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    return [_payload(user) for user in db.query(User).filter(User.status == "pending_approval").all()]


@router.post("", response_model=dict, status_code=201)
def create_user(body: UserCreate, current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    user = User(email=body.email, full_name=body.full_name, password_hash=hash_password(body.password), role=body.role, status="active", is_first_login=True, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _payload(user)


@router.post("/{user_id}/approve", response_model=dict)
def approve_user(user_id: int, body: ApproveIn, current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    user.status = "active"
    user.is_active = True
    db.commit()
    db.refresh(user)
    return _payload(user)


@router.post("/{user_id}/refuse")
def refuse_user(user_id: int, body: RefuseIn, current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "refused"
    user.is_active = False
    db.commit()
    return {"message": "User refused"}


@router.patch("/{user_id}", response_model=dict)
def update_user(user_id: int, body: UserPatch, current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return _payload(user)


@router.post("/{user_id}/reset-password")
def reset_user_password(user_id: int, current_user: User = Depends(require_roles("system_admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password("password123")
    user.is_first_login = True
    db.commit()
    return {"message": "Password reset to password123"}


def _payload(user: User) -> dict:
    display_name = user.full_name or user.email.split("@")[0]
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "status": user.status,
        "is_active": user.is_active,
        "is_first_login": user.is_first_login,
        "display_name": display_name,
        "created_at": user.created_at,
    }


@instructor_profile_router.get("/profile", response_model=dict)
def instructor_profile(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    department = instructor.department
    faculty = department.faculty if department else None
    offerings = db.query(Offering).filter(Offering.instructor_id == instructor.id, Offering.status == "active").all()
    return {
        "full_name": f"{instructor.first_name} {instructor.last_name}".strip() or current_user.full_name or current_user.email,
        "role": "Instructor",
        "email": current_user.email,
        "title": instructor.title,
        "faculty": faculty.name if faculty else None,
        "department": department.name if department else None,
        "account_status": current_user.status,
        "assigned_courses": [
            {
                "id": offering.id,
                "course_code": offering.course.code if offering.course else None,
                "course_name": offering.course.name if offering.course else None,
                "academic_year": offering.academic_period or offering.academic_year,
                "semester": offering.semester.name if offering.semester else None,
                "program": offering.program.name if offering.program else None,
                "schedule": offering.schedule,
                "room": offering.room,
            }
            for offering in offerings
        ],
    }
