from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timezone
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.grade import CourseGradeConfiguration, Grade
from src.models.attendance import AttendanceRecord, AttendanceSession
from src.models.course_status import StudentCourseStatus
from src.models.timetable import TimetableEntry
from src.models.notification import Notification
from src.schemas.grade import BulkGradeSubmit, CourseGradeConfigurationIn, CourseGradeConfigurationOut, GradeOut, GradeUpsert, GradePublish
from src.utils.security import canonical_role, require_roles

router = APIRouter(prefix="/grades", tags=["Grades"])
teacher_api_router = APIRouter(prefix="/api/teacher/grades", tags=["Teacher Grades"])

TOTAL_MAX = 100
ABSENCE_BLOCK_LIMIT = 15.0
COMPONENTS = {
    "midterm": ("Midterm", "midterm_score", "midterm_points"),
    "final_exam": ("Final exam", "final_exam_score", "final_exam_points"),
    "project": ("Project", "project_score", "project_points"),
    "assignments": ("Assignments", "assignment_score", "assignment_points"),
    "quizzes": ("Quizzes", "quiz_score", "quiz_points"),
    "attendance": ("Attendance", "attendance_score", "attendance_points"),
    "participation": ("Participation", "participation_score", "participation_points"),
    "lab_work": ("Lab work / practical work", "lab_work_score", "lab_work_points"),
}


def _calc_final_grade(total: float) -> tuple[int, str]:
    if total < 45:
        return 4, "failed"
    if total <= 54:
        return 5, "passed"
    if total <= 64:
        return 6, "passed"
    if total <= 74:
        return 7, "passed"
    if total <= 84:
        return 8, "passed"
    if total <= 94:
        return 9, "passed"
    return 10, "passed"


def _grade_label(final_grade: int) -> str:
    return "F" if final_grade == 4 else str(final_grade)


def _config_components(config: CourseGradeConfiguration) -> list[dict]:
    components = []
    for key, (label, _, points_field) in COMPONENTS.items():
        points = float(getattr(config, points_field) or 0)
        components.append({"key": key, "label": label, "points": points, "selected": points > 0})
    return components


def _config_payload(config: CourseGradeConfiguration) -> CourseGradeConfigurationOut:
    components = _config_components(config)
    return CourseGradeConfigurationOut(
        id=config.id,
        course_offering_id=config.course_offering_id,
        course_id=config.course_id,
        teacher_id=config.teacher_id,
        semester_id=config.semester_id,
        academic_year=config.academic_year,
        components=components,
        total_points=sum(item["points"] for item in components),
    )


def _default_config(db: Session, offering: Offering, instructor: Instructor) -> CourseGradeConfiguration:
    config = db.query(CourseGradeConfiguration).filter(CourseGradeConfiguration.course_offering_id == offering.id).first()
    if config:
        return config
    config = CourseGradeConfiguration(
        course_offering_id=offering.id,
        course_id=offering.course_id,
        teacher_id=instructor.id,
        semester_id=offering.semester_id,
        academic_year=offering.academic_period or offering.academic_year,
        midterm_points=30,
        final_exam_points=40,
        project_points=20,
        assignment_points=10,
    )
    db.add(config)
    db.flush()
    return config


def _decorate_grade(grade: Grade) -> GradeOut:
    data = GradeOut.model_validate(grade)
    data.can_take_exam = not bool(grade.exam_blocked_due_to_absence)
    reg = grade.registration
    if reg and reg.offering and reg.offering.course:
        data.course_name = reg.offering.course.name
        data.course_code = reg.offering.course.code
    if reg and reg.student:
        data.student_name = f"{reg.student.first_name} {reg.student.last_name}"
    return data


def _absence_eligibility(db: Session, student_id: int, offering_id: int) -> dict:
    today = date.today()
    entries = db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id == offering_id,
        TimetableEntry.timetable_date.isnot(None),
        TimetableEntry.timetable_date <= today,
    ).all()
    if entries:
        total = len(entries)
        absent = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.course_offering_id == offering_id,
            AttendanceRecord.timetable_entry_id.in_([entry.id for entry in entries]),
            AttendanceRecord.status == "absent",
        ).count()
    else:
        total = db.query(AttendanceSession).filter(AttendanceSession.offering_id == offering_id, AttendanceSession.session_date <= today).count()
        absent = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceSession.offering_id == offering_id,
            AttendanceSession.session_date <= today,
            AttendanceRecord.status == "absent",
        ).count()
    percentage = round((absent / total) * 100, 2) if total else 0.0
    return {
        "absence_percentage": percentage,
        "exam_blocked_due_to_absence": percentage > ABSENCE_BLOCK_LIMIT,
    }


def _apply_absence_policy(db: Session, grade: Grade, offering: Offering, student_id: int) -> bool:
    eligibility = _absence_eligibility(db, student_id, offering.id)
    grade.absence_percentage = eligibility["absence_percentage"]
    grade.exam_blocked_due_to_absence = eligibility["exam_blocked_due_to_absence"]
    if not eligibility["exam_blocked_due_to_absence"]:
        return False
    grade.final_exam_score = None
    grade.total_score = 4
    grade.final_grade = 4
    grade.pass_status = "failed"
    grade.letter_grade = "F"
    grade.failure_reason = "Absences over 15%"
    grade.retake_allowed_next_academic_year = True
    status = db.query(StudentCourseStatus).filter(
        StudentCourseStatus.student_id == student_id,
        StudentCourseStatus.course_offering_id == offering.id,
    ).first()
    if not status:
        status = StudentCourseStatus(student_id=student_id, course_offering_id=offering.id, academic_year=offering.academic_period or "2025-2026")
        db.add(status)
    status.status = "failed_absence"
    status.absence_percentage = eligibility["absence_percentage"]
    status.can_take_exam = False
    status.can_retake_next_year = True
    return True


def _validate_component(name: str, value, max_score: float):
    if value is None:
        return
    score = float(value)
    if score < 0 or score > max_score:
        raise HTTPException(status_code=400, detail=f"{name} must be between 0 and {max_score}")


def _apply_grade_payload(grade: Grade, body: GradeUpsert, config: CourseGradeConfiguration):
    data = body.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(grade, field, value)
    total = 0.0
    for key, (label, score_field, points_field) in COMPONENTS.items():
        max_points = float(getattr(config, points_field) or 0)
        value = float(getattr(grade, score_field) or 0)
        if max_points <= 0:
            setattr(grade, score_field, None)
            continue
        _validate_component(f"{label} score", value, max_points)
        total += value
    if total > TOTAL_MAX:
        raise HTTPException(status_code=400, detail="Total score cannot exceed 100")
    final_grade, pass_status = _calc_final_grade(total)
    grade.total_score = total
    grade.final_grade = final_grade
    grade.pass_status = pass_status
    grade.letter_grade = _grade_label(final_grade)
    grade.updated_at = datetime.now(timezone.utc)


@router.get("/offering/{offering_id}/configuration", response_model=CourseGradeConfigurationOut)
def get_grade_configuration(offering_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    config = _default_config(db, offering, instructor)
    db.commit()
    db.refresh(config)
    return _config_payload(config)


@router.put("/offering/{offering_id}/configuration", response_model=CourseGradeConfigurationOut)
def save_grade_configuration(offering_id: int, body: CourseGradeConfigurationIn, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    selected = [item for item in body.components if item.selected]
    if not selected:
        raise HTTPException(status_code=400, detail="Select at least one grading component")
    total = 0.0
    values = {field: 0 for _, _, field in COMPONENTS.values()}
    for item in selected:
        if item.key not in COMPONENTS:
            raise HTTPException(status_code=400, detail=f"Unknown grading component: {item.key}")
        points = float(item.points)
        if points <= 0:
            raise HTTPException(status_code=400, detail="Selected components must have points greater than 0")
        total += points
        values[COMPONENTS[item.key][2]] = points
    if round(total, 2) != 100:
        raise HTTPException(status_code=400, detail=f"Total grading points must equal 100. Current total: {total:g}.")
    config = _default_config(db, offering, instructor)
    for field, value in values.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return _config_payload(config)

@router.get("/me", response_model=List[GradeOut])
def my_grades(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    """Return published grades for the authenticated student."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    regs = db.query(Registration).filter(Registration.student_id == student.id).all()
    return [_decorate_grade(r.grade) for r in regs if r.grade and r.grade.is_published]

@router.get("/student/courses/{offering_id}", response_model=List[GradeOut])
def my_course_grades(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    regs = db.query(Registration).filter(
        Registration.student_id == student.id,
        Registration.offering_id == offering_id,
    ).all()
    return [_decorate_grade(r.grade) for r in regs if r.grade and r.grade.is_published]

@router.get("/offering/{offering_id}", response_model=List[GradeOut])
def grades_for_offering(offering_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    """List all grades for a given offering; visible to instructor and staff."""
    if canonical_role(current_user.role) == "instructor":
        instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
        if not instructor or not db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first():
            raise HTTPException(status_code=403, detail="Not your offering")
    regs = db.query(Registration).filter(Registration.offering_id == offering_id, Registration.status == "active").all()
    return [_decorate_grade(r.grade) for r in regs if r.grade]

@router.put("/offering/{offering_id}/registration/{registration_id}", response_model=GradeOut)
def upsert_grade(offering_id: int, registration_id: int, body: GradeUpsert, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    """Create or update grade components and recompute weighted total."""
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")

    reg = db.query(Registration).filter(Registration.id == registration_id, Registration.offering_id == offering_id, Registration.status == "active").first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    grade = reg.grade
    if not grade:
        grade = Grade(registration_id=registration_id)
        db.add(grade)
    grade.course_offering_id = offering_id
    grade.course_id = offering.course_id
    grade.teacher_id = instructor.id
    grade.student_id = reg.student_id
    config = _default_config(db, offering, instructor)

    if _apply_absence_policy(db, grade, offering, reg.student_id):
        db.commit()
        db.refresh(grade)
        return _decorate_grade(grade)

    _apply_grade_payload(grade, body, config)
    was_published = bool(grade.is_published)
    grade.is_published = True

    if not was_published and reg.student:
        db.add(Notification(
            user_id=reg.student.user_id,
            title="Grade published",
            message=f"Your grade for {offering.course.code} {offering.course.name} has been published.",
            type="success",
        ))
    db.commit()
    db.refresh(grade)
    return _decorate_grade(grade)

@router.post("/bulk-save", status_code=200)
def bulk_save_grades(body: BulkGradeSubmit, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.id == body.offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    config = _default_config(db, offering, instructor)
    for item in body.grades:
        reg = db.query(Registration).filter(Registration.id == item.registration_id, Registration.offering_id == body.offering_id, Registration.status == "active").first()
        if not reg:
            raise HTTPException(status_code=404, detail=f"Registration {item.registration_id} not found")
        grade = reg.grade or Grade(registration_id=item.registration_id)
        if not reg.grade:
            db.add(grade)
        grade.course_offering_id = body.offering_id
        grade.course_id = offering.course_id
        grade.teacher_id = instructor.id
        grade.student_id = reg.student_id
        if _apply_absence_policy(db, grade, offering, reg.student_id):
            continue
        _apply_grade_payload(grade, GradeUpsert(**item.model_dump(exclude={"registration_id"})), config)
    db.commit()
    return {"saved": len(body.grades)}

@router.post("/publish", status_code=200)
def publish_grades(body: GradePublish, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    """Flip is_published for a batch of registrations owned by this instructor."""
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    grades = db.query(Grade).join(Registration).join(Offering).filter(
        Grade.registration_id.in_(body.registration_ids),
        Registration.status == "active",
        Offering.instructor_id == instructor.id
    ).all()

    for g in grades:
        was_published = g.is_published
        g.is_published = True
        if not was_published and g.registration and g.registration.student:
            course = g.registration.offering.course
            db.add(Notification(
                user_id=g.registration.student.user_id,
                title="Grade published",
                message=f"Your grade for {course.code} {course.name} has been published.",
                type="success",
            ))
    db.commit()
    return {"published": len(grades)}


@teacher_api_router.get("")
def api_teacher_grades(courseId: int, assignmentId: int | None = None, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.course_id == courseId, Offering.instructor_id == instructor.id, Offering.status == "active").first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your course")
    return grades_for_offering(offering.id, current_user, db)


@teacher_api_router.post("")
def api_teacher_grade_save(body: dict, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    offering_id = body.get("course_offering_id")
    registration_id = body.get("registration_id")
    if not offering_id or not registration_id:
        raise HTTPException(status_code=400, detail="course_offering_id and registration_id are required")
    payload = GradeUpsert(**{key: value for key, value in body.items() if key in {"midterm_score", "assignment_score", "project_score", "quiz_score", "final_exam_score", "attendance_score", "participation_score", "lab_work_score", "feedback"}})
    return upsert_grade(offering_id, registration_id, payload, current_user, db)
