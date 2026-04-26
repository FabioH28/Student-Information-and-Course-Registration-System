from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.schemas.student import StudentOut, StudentUpdate, StudentAdminUpdate
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me", response_model=StudentOut)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

@router.put("/me", response_model=StudentOut)
def update_my_profile(body: StudentUpdate, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student

@router.get("", response_model=List[StudentOut])
def list_students(current_user: User = Depends(require_roles("academic_staff", "finance_staff", "system_admin", "instructor")), db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, current_user: User = Depends(require_roles("academic_staff", "finance_staff", "system_admin", "instructor")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, body: StudentAdminUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, value in body.model_dump(exclude_none=True).items():
        if field == "is_active":
            student.user.is_active = value
        else:
            setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student
