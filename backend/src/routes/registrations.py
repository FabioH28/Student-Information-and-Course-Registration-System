from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.semester import Semester
from src.models.finance import Hold
from src.schemas.registration import RegistrationOut, RegistrationCreate, RegistrationStatusUpdate
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/registrations", tags=["Registrations"])

def _get_student(user_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

@router.get("/me", response_model=List[RegistrationOut])
def my_registrations(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _get_student(current_user.id, db)
    return db.query(Registration).filter(Registration.student_id == student.id).all()

@router.post("", response_model=RegistrationOut, status_code=201)
def register(body: RegistrationCreate, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _get_student(current_user.id, db)

    active_hold = db.query(Hold).filter(Hold.student_id == student.id, Hold.is_active == True).first()
    if active_hold:
        raise HTTPException(status_code=403, detail=f"Registration blocked: {active_hold.effect}")

    offering = db.query(Offering).filter(Offering.id == body.offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")

    semester = db.query(Semester).filter(Semester.id == offering.semester_id).first()
    if datetime.now(timezone.utc).date() > semester.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")

    if offering.enrolled >= offering.capacity:
        raise HTTPException(status_code=400, detail="This offering is full")

    existing = db.query(Registration).filter(
        Registration.student_id == student.id,
        Registration.offering_id == body.offering_id,
        Registration.status == "active"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this offering")

    if offering.course.prerequisite_course_id:
        prereq_passed = db.query(Registration).join(Offering).filter(
            Registration.student_id == student.id,
            Offering.course_id == offering.course.prerequisite_course_id,
            Registration.status == "completed"
        ).first()
        if not prereq_passed:
            raise HTTPException(status_code=400, detail="Prerequisite course not completed")

    reg = Registration(student_id=student.id, offering_id=body.offering_id)
    db.add(reg)
    offering.enrolled += 1
    if offering.enrolled >= offering.capacity:
        offering.status = "full"
    db.commit()
    db.refresh(reg)
    return reg

@router.delete("/{registration_id}", status_code=204)
def drop_course(registration_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _get_student(current_user.id, db)
    reg = db.query(Registration).filter(
        Registration.id == registration_id,
        Registration.student_id == student.id,
        Registration.status == "active"
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Active registration not found")

    semester = db.query(Semester).filter(Semester.id == reg.offering.semester_id).first()
    if datetime.now(timezone.utc).date() > semester.drop_deadline:
        raise HTTPException(status_code=400, detail="Drop deadline has passed")

    reg.status = "dropped"
    reg.offering.enrolled = max(0, reg.offering.enrolled - 1)
    if reg.offering.status == "full":
        reg.offering.status = "active"
    db.commit()

@router.get("", response_model=List[RegistrationOut])
def list_registrations(offering_id: Optional[int] = None, student_id: Optional[int] = None, current_user: User = Depends(require_roles("academic_staff", "instructor", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Registration)
    if offering_id:
        q = q.filter(Registration.offering_id == offering_id)
    if student_id:
        q = q.filter(Registration.student_id == student_id)
    return q.all()

@router.put("/{registration_id}/status", response_model=RegistrationOut)
def update_status(registration_id: int, body: RegistrationStatusUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    reg.status = body.status
    db.commit()
    db.refresh(reg)
    return reg
