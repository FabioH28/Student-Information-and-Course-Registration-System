from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from src.config.database import get_db
from src.models.semester import Semester
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/semesters", tags=["Semesters"])

admin_only = require_roles("system_admin")


class SemesterOut(BaseModel):
    id: int
    name: str
    start_date: str
    end_date: str
    is_active: bool
    registration_deadline: str
    drop_deadline: str

    model_config = {"from_attributes": True}


class SemesterCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    registration_deadline: str
    drop_deadline: str


class SemesterUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    drop_deadline: Optional[str] = None
    is_active: Optional[bool] = None


def _to_out(s: Semester) -> SemesterOut:
    return SemesterOut(
        id=s.id,
        name=s.name,
        start_date=str(s.start_date),
        end_date=str(s.end_date),
        is_active=s.is_active,
        registration_deadline=str(s.registration_deadline),
        drop_deadline=str(s.drop_deadline),
    )


@router.get("", response_model=list[SemesterOut])
def list_semesters(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [_to_out(s) for s in db.query(Semester).order_by(Semester.start_date.desc()).all()]


@router.post("", response_model=SemesterOut, status_code=201)
def create_semester(body: SemesterCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    s = Semester(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        registration_deadline=body.registration_deadline,
        drop_deadline=body.drop_deadline,
        is_active=False,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _to_out(s)


@router.patch("/{semester_id}", response_model=SemesterOut)
def update_semester(semester_id: int, body: SemesterUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    s = db.query(Semester).filter(Semester.id == semester_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Semester not found")
    if body.name is not None:
        s.name = body.name
    if body.start_date is not None:
        s.start_date = body.start_date
    if body.end_date is not None:
        s.end_date = body.end_date
    if body.registration_deadline is not None:
        s.registration_deadline = body.registration_deadline
    if body.drop_deadline is not None:
        s.drop_deadline = body.drop_deadline
    if body.is_active is not None:
        if body.is_active:
            db.query(Semester).filter(Semester.id != semester_id).update({"is_active": False})
        s.is_active = body.is_active
    db.commit()
    db.refresh(s)
    return _to_out(s)
