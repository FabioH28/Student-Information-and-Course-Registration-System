from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.offering import Offering
from src.models.student import Student
from src.models.user import User
from src.utils.security import get_current_user, require_roles


router = APIRouter(prefix="/offerings", tags=["Offerings"])


class OfferingIn(BaseModel):
    course_id: int
    instructor_id: int
    semester_id: int
    room: str | None = None
    schedule: str | None = None
    capacity: int
    status: str = "active"


class OfferingUpdate(BaseModel):
    room: str | None = None
    schedule: str | None = None
    capacity: int | None = None
    status: str | None = None


@router.get("", response_model=List[dict])
def list_offerings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_offering_payload(item) for item in db.query(Offering).all()]


@router.get("/my", response_model=List[dict])
def my_offerings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        return [_offering_payload(reg.offering) for reg in student.registrations if reg.offering]
    return [_offering_payload(item) for item in db.query(Offering).filter(Offering.instructor.has(user_id=current_user.id)).all()]


@router.get("/{offering_id}", response_model=dict)
def get_offering(offering_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    return _offering_payload(offering)


@router.post("", response_model=dict, status_code=201)
def create_offering(body: OfferingIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = Offering(**body.model_dump(), enrolled=0)
    db.add(offering)
    db.commit()
    db.refresh(offering)
    return _offering_payload(offering)


@router.put("/{offering_id}", response_model=dict)
def update_offering(offering_id: int, body: OfferingUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(offering, key, value)
    db.commit()
    db.refresh(offering)
    return _offering_payload(offering)


def _offering_payload(offering: Offering) -> dict:
    return {
        "id": offering.id,
        "course_id": offering.course_id,
        "instructor_id": offering.instructor_id,
        "semester_id": offering.semester_id,
        "room": offering.room,
        "schedule": offering.schedule,
        "capacity": offering.capacity,
        "enrolled": offering.enrolled,
        "status": offering.status,
    }
