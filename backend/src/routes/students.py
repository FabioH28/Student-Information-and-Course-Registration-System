from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.student import Student
from src.models.user import User
from src.schemas.student import StudentAdminUpdate, StudentOut, StudentUpdate
from src.utils.security import get_current_user, require_roles


router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me", response_model=StudentOut)
def me(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/me", response_model=StudentOut)
def update_me(body: StudentUpdate, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@router.get("", response_model=List[StudentOut])
def list_students(current_user: User = Depends(require_roles("academic_staff", "instructor", "finance_staff", "system_admin")), db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, body: StudentAdminUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    values = body.model_dump(exclude_none=True)
    is_active = values.pop("is_active", None)
    for key, value in values.items():
        setattr(student, key, value)
    if is_active is not None and student.user:
        student.user.is_active = is_active
    db.commit()
    db.refresh(student)
    return student
