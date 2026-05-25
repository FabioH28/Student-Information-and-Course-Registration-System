from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.attendance import AttendanceRecord
from src.models.course_selection import CoursePrerequisite, StudentCourseSelection
from src.models.grade import Grade
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.student import Student
from src.models.timetable import TimetableEntry
from src.models.user import User
from src.utils.security import require_roles

router = APIRouter(prefix="/api/student", tags=["Student Course Selections"])

SEMESTER_CREDIT_LIMIT = 30
ACADEMIC_YEAR_CREDIT_LIMIT = 60


class CourseSelectionIn(BaseModel):
    course_offering_id: int


def _student(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def _time_overlap(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    return a_start < b_end and b_start < a_end


def _has_conflict(db: Session, student: Student, offering: Offering) -> bool:
    selected_ids = [
        row[0] for row in db.query(StudentCourseSelection.course_offering_id).filter(
            StudentCourseSelection.student_id == student.id,
            StudentCourseSelection.status.in_(["requested", "selected", "approved", "enrolled"]),
        ).all()
        if row[0] != offering.id
    ]
    enrolled_ids = [
        row[0] for row in db.query(Registration.offering_id).filter(
            Registration.student_id == student.id,
            Registration.status == "active",
        ).all()
        if row[0] != offering.id
    ]
    compare_ids = set(selected_ids + enrolled_ids)
    new_entries = db.query(TimetableEntry).filter(TimetableEntry.course_offering_id == offering.id).all()
    existing_entries = db.query(TimetableEntry).filter(TimetableEntry.course_offering_id.in_(compare_ids)).all() if compare_ids else []
    for new in new_entries:
        for existing in existing_entries:
            same_date = new.timetable_date and existing.timetable_date and new.timetable_date == existing.timetable_date
            same_day = not new.timetable_date and not existing.timetable_date and new.day_of_week == existing.day_of_week
            if (same_date or same_day) and _time_overlap(new.start_time, new.end_time, existing.start_time, existing.end_time):
                return True
    return False


def _passed_course(db: Session, student_id: int, course_id: int) -> bool:
    return db.query(Grade).filter(
        Grade.student_id == student_id,
        Grade.course_id == course_id,
        Grade.pass_status == "passed",
    ).first() is not None


def _course_prerequisite_ids(db: Session, offering: Offering) -> set[int]:
    prerequisite_ids = {
        row[0] for row in db.query(CoursePrerequisite.prerequisite_course_id).filter(
            CoursePrerequisite.course_id == offering.course_id,
        ).all()
    }
    if offering.course and offering.course.prerequisite_course_id:
        prerequisite_ids.add(offering.course.prerequisite_course_id)
    return prerequisite_ids


def _active_selection_statuses() -> list[str]:
    return ["requested", "selected", "approved", "enrolled"]


def _selected_offerings(db: Session, student: Student, exclude_offering_id: int | None = None) -> list[Offering]:
    offerings = [
        reg.offering for reg in db.query(Registration).filter(
            Registration.student_id == student.id,
            Registration.status == "active",
        ).all()
        if reg.offering and reg.offering_id != exclude_offering_id
    ]
    selections = db.query(StudentCourseSelection).filter(
        StudentCourseSelection.student_id == student.id,
        StudentCourseSelection.status.in_(_active_selection_statuses()),
    ).all()
    seen = {offering.id for offering in offerings}
    for selection in selections:
        if not selection.offering or selection.course_offering_id == exclude_offering_id:
            continue
        if selection.offering.id not in seen:
            offerings.append(selection.offering)
            seen.add(selection.offering.id)
    return offerings


def _credit_block_reason(db: Session, student: Student, offering: Offering) -> str | None:
    selected = _selected_offerings(db, student, exclude_offering_id=offering.id)
    new_credits = offering.course.credits if offering.course else 0
    semester_credits = new_credits + sum(
        item.course.credits for item in selected
        if item.course and item.semester_id == offering.semester_id
    )
    if semester_credits > SEMESTER_CREDIT_LIMIT:
        return "You cannot register for more than 30 credits in one semester."
    academic_year_credits = new_credits + sum(
        item.course.credits for item in selected
        if item.course and (item.academic_period or "") == (offering.academic_period or "")
    )
    if academic_year_credits > ACADEMIC_YEAR_CREDIT_LIMIT:
        return "You cannot register for more than 60 credits in one academic year."
    return None


def _selection_block_reason(db: Session, student: Student, offering: Offering) -> str | None:
    faculty_id = student.program.department.faculty_id if student.program and student.program.department else None
    department_id = student.program.department_id if student.program else None
    offering_faculty_id = offering.faculty_id or (offering.program.department.faculty_id if offering.program and offering.program.department else None)
    offering_department_id = offering.program.department_id if offering.program else (offering.course.department_id if offering.course else None)
    if offering_faculty_id != faculty_id or offering.program_id != student.program_id or offering_department_id != department_id:
        return "not available for your faculty, department, or program"
    student_level = (student.degree_level or "").lower()
    offering_level = (offering.academic_year or "").lower()
    if student_level and offering_level and student_level not in offering_level:
        return "not available for your study level"
    if offering.academic_year and student.academic_year and offering.academic_year != student.academic_year:
        status = db.query(Grade).filter(
            Grade.student_id == student.id,
            Grade.course_id == offering.course_id,
            Grade.pass_status == "failed",
            Grade.exam_blocked_due_to_absence == True,
        ).first()
        if not status:
            return "not available for your program/year"
    if not offering.enrollment_open:
        return "selection is closed"
    if offering.selection_deadline and offering.selection_deadline < date.today():
        return "selection deadline passed"
    if offering.enrolled >= offering.capacity:
        return "course is full"
    if _passed_course(db, student.id, offering.course_id):
        return "already passed"
    for prerequisite_id in _course_prerequisite_ids(db, offering):
        if not _passed_course(db, student.id, prerequisite_id):
            return "prerequisite not passed"
    credit_reason = _credit_block_reason(db, student, offering)
    if credit_reason:
        return credit_reason
    if _has_conflict(db, student, offering):
        return "timetable conflict"
    return None


def _offering_payload(db: Session, student: Student, offering: Offering) -> dict:
    reason = _selection_block_reason(db, student, offering)
    return {
        "course_offering_id": offering.id,
        "course_id": offering.course_id,
        "course_code": offering.course.code if offering.course else None,
        "course_name": offering.course.name if offering.course else None,
        "program_id": offering.program_id,
        "academic_year": offering.academic_year,
        "academic_period": offering.academic_period,
        "capacity": offering.capacity,
        "enrolled": offering.enrolled,
        "credits": offering.course.credits if offering.course else None,
        "can_select": reason is None,
        "blocked_reason": reason,
    }


@router.get("/available-subjects")
def available_subjects(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student(current_user, db)
    faculty_id = student.program.department.faculty_id if student.program and student.program.department else None
    offerings = db.query(Offering).filter(Offering.faculty_id == faculty_id, Offering.status == "active").all()
    return {"success": True, "data": [_offering_payload(db, student, offering) for offering in offerings]}


@router.get("/course-selections")
def my_course_selections(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student(current_user, db)
    rows = db.query(StudentCourseSelection).filter(StudentCourseSelection.student_id == student.id).all()
    data = []
    for row in rows:
        offering = db.query(Offering).filter(Offering.id == row.course_offering_id).first()
        data.append({
            "id": row.id,
            "course_offering_id": row.course_offering_id,
            "course_code": offering.course.code if offering and offering.course else None,
            "course_name": offering.course.name if offering and offering.course else None,
            "status": row.status,
            "reason": row.reason,
            "selected_at": row.selected_at,
            "approved_at": row.approved_at,
        })
    return {"success": True, "data": data}


@router.post("/course-selections")
def create_course_selection(body: CourseSelectionIn, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student(current_user, db)
    offering = db.query(Offering).filter(Offering.id == body.course_offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    reason = _selection_block_reason(db, student, offering)
    status = "rejected" if reason else "requested"
    existing = db.query(StudentCourseSelection).filter(
        StudentCourseSelection.student_id == student.id,
        StudentCourseSelection.course_offering_id == offering.id,
    ).first()
    if existing:
        existing.status = status
        existing.reason = reason
        selection = existing
    else:
        selection = StudentCourseSelection(student_id=student.id, course_offering_id=offering.id, status=status, reason=reason)
        db.add(selection)
    db.commit()
    return {"success": reason is None, "message": "Subject requested" if reason is None else reason, "selection_id": selection.id}


@router.delete("/course-selections/{selection_id}")
def delete_course_selection(selection_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student(current_user, db)
    selection = db.query(StudentCourseSelection).filter(StudentCourseSelection.id == selection_id, StudentCourseSelection.student_id == student.id).first()
    if not selection:
        raise HTTPException(status_code=404, detail="Course selection not found")
    selection.status = "dropped"
    db.commit()
    return {"deleted": True}
