from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.grade import Grade
from src.schemas.grade import GradeOut, GradeUpsert, GradePublish
from src.utils.security import require_roles

router = APIRouter(prefix="/grades", tags=["Grades"])

def _calc_letter(total: float) -> str:
    if total >= 93: return "A"
    if total >= 90: return "A-"
    if total >= 87: return "B+"
    if total >= 83: return "B"
    if total >= 80: return "B-"
    if total >= 77: return "C+"
    if total >= 73: return "C"
    if total >= 70: return "C-"
    if total >= 67: return "D+"
    if total >= 60: return "D"
    return "F"

@router.get("/me", response_model=List[GradeOut])
def my_grades(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    regs = db.query(Registration).filter(Registration.student_id == student.id).all()
    return [r.grade for r in regs if r.grade and r.grade.is_published]

@router.get("/offering/{offering_id}", response_model=List[GradeOut])
def grades_for_offering(offering_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    regs = db.query(Registration).filter(Registration.offering_id == offering_id).all()
    return [r.grade for r in regs if r.grade]

@router.put("/offering/{offering_id}/registration/{registration_id}", response_model=GradeOut)
def upsert_grade(offering_id: int, registration_id: int, body: GradeUpsert, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")

    reg = db.query(Registration).filter(Registration.id == registration_id, Registration.offering_id == offering_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    grade = reg.grade
    if not grade:
        grade = Grade(registration_id=registration_id)
        db.add(grade)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(grade, field, value)

    midterm = float(grade.midterm_score or 0)
    assignment = float(grade.assignment_score or 0)
    final = float(grade.final_score or 0)
    total = round(midterm * 0.30 + assignment * 0.30 + final * 0.40, 2)
    grade.total_score = total
    grade.letter_grade = _calc_letter(total)
    grade.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(grade)
    return grade

@router.post("/publish", status_code=200)
def publish_grades(body: GradePublish, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    grades = db.query(Grade).join(Registration).join(Offering).filter(
        Grade.registration_id.in_(body.registration_ids),
        Offering.instructor_id == instructor.id
    ).all()

    for g in grades:
        g.is_published = True
    db.commit()
    return {"published": len(grades)}
