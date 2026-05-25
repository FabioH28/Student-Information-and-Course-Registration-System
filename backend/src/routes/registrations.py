from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.attendance import AttendanceRecord
from src.models.semester import Semester
from src.schemas.registration import RegistrationOut, RegistrationCreate, RegistrationStatusUpdate
from src.utils.security import canonical_role, get_current_user, require_roles

router = APIRouter(prefix="/registrations", tags=["Registrations"])

def _registration_payload(reg: Registration, db: Session) -> dict:
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.course_offering_id == reg.offering_id,
        AttendanceRecord.student_id == reg.student_id,
    ).all()
    attendance_percentage = None
    if records:
        attended = sum(1 for record in records if record.status in {"present", "late", "excused"})
        attendance_percentage = round((attended / len(records)) * 100, 2)
    return {
        "id": reg.id,
        "student_id": reg.student_id,
        "offering_id": reg.offering_id,
        "registered_at": reg.registered_at,
        "status": reg.status,
        "attendance_percentage": attendance_percentage,
    }

def _get_student(user_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

@router.get("/me", response_model=List[RegistrationOut])
def my_registrations(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _get_student(current_user.id, db)
    registrations = db.query(Registration).filter(Registration.student_id == student.id).all()
    return [_registration_payload(reg, db) for reg in registrations]

@router.post("", response_model=RegistrationOut, status_code=201)
def register(body: RegistrationCreate, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    _get_student(current_user.id, db)
    raise HTTPException(
        status_code=400,
        detail="Students must request subjects from Available Subjects. Staff/Admin approval is required before enrollment.",
    )

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
    if canonical_role(current_user.role) == "instructor":
        instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor profile not found")
        q = q.join(Offering).filter(Offering.instructor_id == instructor.id)
    if offering_id:
        q = q.filter(Registration.offering_id == offering_id)
    if student_id:
        q = q.filter(Registration.student_id == student_id)
    return [_registration_payload(reg, db) for reg in q.all()]

@router.put("/{registration_id}/status", response_model=RegistrationOut)
def update_status(registration_id: int, body: RegistrationStatusUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    reg.status = body.status
    db.commit()
    db.refresh(reg)
    return reg
