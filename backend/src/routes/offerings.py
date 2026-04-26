from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src.config.database import get_db
from src.models.user import User
from src.models.offering import Offering
from src.models.instructor import Instructor
from src.schemas.offering import OfferingOut, OfferingCreate, OfferingUpdate
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/offerings", tags=["Offerings"])

@router.get("", response_model=List[OfferingOut])
def list_offerings(semester_id: Optional[int] = None, course_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Offering)
    if semester_id:
        q = q.filter(Offering.semester_id == semester_id)
    if course_id:
        q = q.filter(Offering.course_id == course_id)
    return q.all()

@router.get("/my", response_model=List[OfferingOut])
def my_offerings(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return db.query(Offering).filter(Offering.instructor_id == instructor.id).all()

@router.get("/{offering_id}", response_model=OfferingOut)
def get_offering(offering_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    return offering

@router.post("", response_model=OfferingOut, status_code=201)
def create_offering(body: OfferingCreate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = Offering(**body.model_dump())
    db.add(offering)
    db.commit()
    db.refresh(offering)
    return offering

@router.put("/{offering_id}", response_model=OfferingOut)
def update_offering(offering_id: int, body: OfferingUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(offering, field, value)
    db.commit()
    db.refresh(offering)
    return offering
