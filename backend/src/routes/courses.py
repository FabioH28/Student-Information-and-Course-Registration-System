from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src.config.database import get_db
from src.models.user import User
from src.models.course import Course
from src.schemas.course import CourseOut, CourseCreate, CourseUpdate
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("", response_model=List[CourseOut])
def list_courses(department_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Course)
    if department_id:
        q = q.filter(Course.department_id == department_id)
    return q.all()

@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("", response_model=CourseOut, status_code=201)
def create_course(body: CourseCreate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    course = Course(**body.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, body: CourseUpdate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course

@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
