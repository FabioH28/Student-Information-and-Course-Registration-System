from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.semester import Semester
from src.models.user import User
from src.utils.security import get_current_user, require_roles


router = APIRouter(prefix="/semesters", tags=["Semesters"])


class SemesterIn(BaseModel):
    name: str
    start_date: str
    end_date: str
    registration_deadline: str
    drop_deadline: str
    total_weeks: int = 14


class SemesterPatch(BaseModel):
    name: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    registration_deadline: str | None = None
    drop_deadline: str | None = None
    total_weeks: int | None = None
    is_active: bool | None = None


def _serialize(item: Semester) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "start_date": str(item.start_date) if item.start_date else None,
        "end_date": str(item.end_date) if item.end_date else None,
        "registration_deadline": str(item.registration_deadline) if item.registration_deadline else None,
        "drop_deadline": str(item.drop_deadline) if item.drop_deadline else None,
        "total_weeks": getattr(item, "total_weeks", None),
        "is_active": bool(item.is_active),
    }


@router.get("", response_model=List[dict])
def list_semesters(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_serialize(item) for item in db.query(Semester).order_by(Semester.start_date.desc()).all()]


@router.post("", response_model=dict, status_code=201)
def create_semester(body: SemesterIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    item = Semester(**body.model_dump(), is_active=False)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.patch("/{semester_id}", response_model=dict)
def update_semester(semester_id: int, body: SemesterPatch, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    item = db.query(Semester).filter(Semester.id == semester_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Semester not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return _serialize(item)
