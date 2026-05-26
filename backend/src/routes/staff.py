from datetime import date, datetime
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.campus_resource import Building, Classroom
from src.models.department import Department
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.program import Program
from src.models.registration import Registration
from src.models.staff import StaffFacultyScope, StaffProfile
from src.models.student import Student
from src.models.course_selection import StudentCourseSelection
from src.models.timetable import ClassSession, TimetableEntry
from src.models.user import User
from src.routes.course_selections import _selection_block_reason
from src.utils.security import canonical_role, require_roles

router = APIRouter(prefix="/api/staff", tags=["Staff Schedule Management"])

MAX_TEACHER_DAILY_HOURS = 4


class CourseOfferingIn(BaseModel):
    course_id: int
    instructor_id: int
    semester_id: int
    program_id: int
    academic_year: str
    academic_period: str
    capacity: int
    enrollment_open: bool = True
    selection_deadline: Optional[date] = None
    status: str = "active"


class TimetableIn(BaseModel):
    course_offering_id: int
    building_id: int
    room_id: int
    timetable_date: date
    day_of_week: str
    start_time: str
    end_time: str
    teaching_hours: Optional[int] = None
    is_published: bool = True


class AssignTeacherIn(BaseModel):
    instructor_id: int


class EnrollStudentIn(BaseModel):
    student_id: int


def _staff_profile(user: User, db: Session) -> StaffProfile | None:
    return db.query(StaffProfile).filter(StaffProfile.user_id == user.id).first()


def _faculty_id_for_program(db: Session, program_id: int) -> int | None:
    program = db.query(Program).filter(Program.id == program_id).first()
    return program.department.faculty_id if program and program.department else None


def _can_manage_faculty(user: User, faculty_id: int | None, db: Session) -> StaffProfile | None:
    role = canonical_role(user.role)
    if role == "system_admin":
        return _staff_profile(user, db)
    staff = _staff_profile(user, db)
    if not staff:
        raise HTTPException(status_code=403, detail="Staff profile not found")
    if staff.scope == "university":
        return staff
    scoped_faculty_ids = {row.faculty_id for row in db.query(StaffFacultyScope).filter(StaffFacultyScope.user_id == user.id).all()}
    if staff.faculty_id:
        scoped_faculty_ids.add(staff.faculty_id)
    if faculty_id is not None and faculty_id not in scoped_faculty_ids:
        raise HTTPException(status_code=403, detail="Staff can manage schedules only for their own faculty")
    return staff


def _staff_faculty_ids(user: User, db: Session) -> set[int] | None:
    if canonical_role(user.role) == "system_admin":
        return None
    staff = _staff_profile(user, db)
    if not staff:
        return set()
    if staff.scope == "university":
        return None
    ids = {row.faculty_id for row in db.query(StaffFacultyScope).filter(StaffFacultyScope.user_id == user.id).all()}
    if staff.faculty_id:
        ids.add(staff.faculty_id)
    return ids


def _offering_payload(offering: Offering) -> dict:
    faculty = offering.program.department.faculty if offering.program and offering.program.department else None
    return {
        "id": offering.id,
        "course_id": offering.course_id,
        "course_code": offering.course.code if offering.course else None,
        "course_name": offering.course.name if offering.course else None,
        "instructor_id": offering.instructor_id,
        "teacher_name": f"{offering.instructor.title or ''} {offering.instructor.first_name} {offering.instructor.last_name}".strip() if offering.instructor else None,
        "faculty_id": offering.faculty_id or (faculty.id if faculty else None),
        "faculty_name": faculty.name if faculty else None,
        "program_id": offering.program_id,
        "program_name": offering.program.name if offering.program else None,
        "academic_year": offering.academic_year,
        "academic_period": offering.academic_period,
        "capacity": offering.capacity,
        "enrolled": offering.enrolled,
        "enrollment_open": bool(offering.enrollment_open),
        "selection_deadline": offering.selection_deadline,
        "status": offering.status,
    }


def _time_minutes(value: str) -> int:
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.hour * 60 + parsed.minute
        except ValueError:
            continue
    raise HTTPException(status_code=400, detail=f"Invalid time value: {value}")


def _teaching_hours(start_time: str, end_time: str, explicit_hours: int | None = None) -> int:
    if explicit_hours is not None:
        if explicit_hours <= 0:
            raise HTTPException(status_code=400, detail="Teaching hours must be greater than 0")
        return explicit_hours
    start = _time_minutes(start_time)
    end = _time_minutes(end_time)
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    return max(1, ceil((end - start) / 50))


def _entry_teaching_hours(entry: TimetableEntry) -> int:
    return _teaching_hours(entry.start_time, entry.end_time, entry.teaching_hours)


def _same_teaching_day_filter(timetable_date: date, day_of_week: str):
    return or_(
        TimetableEntry.timetable_date == timetable_date,
        (TimetableEntry.timetable_date.is_(None) & (TimetableEntry.day_of_week == day_of_week)),
    )


def validate_teacher_daily_hours(
    db: Session,
    instructor_id: int,
    timetable_date: date,
    day_of_week: str,
    start_time: str,
    end_time: str,
    teaching_hours: int | None = None,
    exclude_entry_id: int | None = None,
    exclude_offering_id: int | None = None,
) -> None:
    new_hours = _teaching_hours(start_time, end_time, teaching_hours)
    query = db.query(TimetableEntry).join(Offering).filter(
        Offering.instructor_id == instructor_id,
        _same_teaching_day_filter(timetable_date, day_of_week),
    )
    if exclude_entry_id is not None:
        query = query.filter(TimetableEntry.id != exclude_entry_id)
    if exclude_offering_id is not None:
        query = query.filter(TimetableEntry.course_offering_id != exclude_offering_id)
    existing_hours = sum(_entry_teaching_hours(entry) for entry in query.all())
    if existing_hours + new_hours > MAX_TEACHER_DAILY_HOURS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Teacher daily limit exceeded: a teacher can teach at most "
                f"{MAX_TEACHER_DAILY_HOURS} hours per day. Existing scheduled hours: "
                f"{existing_hours}; requested: {new_hours}."
            ),
        )


def validate_offering_teacher_daily_hours(db: Session, offering: Offering, instructor_id: int) -> None:
    grouped: dict[tuple[date, str], int] = {}
    for entry in offering.timetable_entries:
        if not entry.timetable_date:
            continue
        key = (entry.timetable_date, entry.day_of_week)
        grouped[key] = grouped.get(key, 0) + _entry_teaching_hours(entry)

    for (timetable_date, day_of_week), offering_hours in grouped.items():
        query = db.query(TimetableEntry).join(Offering).filter(
            Offering.instructor_id == instructor_id,
            TimetableEntry.course_offering_id != offering.id,
            _same_teaching_day_filter(timetable_date, day_of_week),
        )
        existing_hours = sum(_entry_teaching_hours(entry) for entry in query.all())
        if existing_hours + offering_hours > MAX_TEACHER_DAILY_HOURS:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Teacher daily limit exceeded: assigning this teacher would schedule "
                    f"{existing_hours + offering_hours} hours on {timetable_date.isoformat()}, "
                    f"above the {MAX_TEACHER_DAILY_HOURS}-hour daily limit."
                ),
            )


def _week_id_for_entry(entry: TimetableEntry, offering: Offering) -> int:
    if entry.timetable_date and offering.semester and offering.semester.start_date:
        return max(1, ((entry.timetable_date - offering.semester.start_date).days // 7) + 1)
    return 1


def _sync_class_session(db: Session, entry: TimetableEntry, offering: Offering) -> None:
    if not entry.timetable_date:
        return
    session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == entry.id).first()
    if not session:
        session = ClassSession(timetable_entry_id=entry.id)
        db.add(session)
    session.course_offering_id = offering.id
    session.teacher_id = offering.instructor_id
    session.course_id = offering.course_id
    session.faculty_id = offering.faculty_id
    session.program_id = offering.program_id
    session.semester_id = offering.semester_id
    session.week_id = _week_id_for_entry(entry, offering)
    session.session_date = entry.timetable_date
    session.day_of_week = entry.day_of_week
    session.start_time = entry.start_time
    session.end_time = entry.end_time
    session.building_id = entry.building_id
    session.room_id = entry.room_id or entry.classroom_id or entry.lab_id
    session.room_type = entry.room_type
    session.lab_id = entry.lab_id
    session.room = entry.room


@router.get("/course-offerings")
def list_course_offerings(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Offering)
    if canonical_role(current_user.role) != "system_admin":
        faculty_ids = _staff_faculty_ids(current_user, db)
        if faculty_ids == set():
            raise HTTPException(status_code=403, detail="Staff profile not found")
        if faculty_ids is not None:
            q = q.filter(Offering.faculty_id.in_(faculty_ids))
    return [_offering_payload(item) for item in q.all()]


@router.post("/course-offerings", status_code=201)
def create_course_offering(body: CourseOfferingIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    faculty_id = _faculty_id_for_program(db, body.program_id)
    staff = _can_manage_faculty(current_user, faculty_id, db)
    offering = Offering(**body.model_dump(), faculty_id=faculty_id, created_by_staff_id=staff.id if staff else None, enrolled=0)
    db.add(offering)
    db.commit()
    db.refresh(offering)
    return _offering_payload(offering)


@router.put("/course-offerings/{offering_id}")
def update_course_offering(offering_id: int, body: CourseOfferingIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    faculty_id = _faculty_id_for_program(db, body.program_id)
    staff = _can_manage_faculty(current_user, faculty_id, db)
    for field, value in body.model_dump().items():
        setattr(offering, field, value)
    offering.faculty_id = faculty_id
    offering.created_by_staff_id = offering.created_by_staff_id or (staff.id if staff else None)
    db.commit()
    return _offering_payload(offering)


@router.delete("/course-offerings/{offering_id}")
def delete_course_offering(offering_id: int, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    _can_manage_faculty(current_user, offering.faculty_id, db)
    db.delete(offering)
    db.commit()
    return {"deleted": True}


@router.post("/course-offerings/{offering_id}/assign-teacher")
def assign_teacher(offering_id: int, body: AssignTeacherIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    _can_manage_faculty(current_user, offering.faculty_id, db)
    instructor = db.query(Instructor).filter(Instructor.id == body.instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Teacher not found")
    validate_offering_teacher_daily_hours(db, offering, instructor.id)
    offering.instructor_id = instructor.id
    for entry in offering.timetable_entries:
        _sync_class_session(db, entry, offering)
    db.commit()
    db.refresh(offering)
    return _offering_payload(offering)


@router.get("/instructors")
def list_instructors(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    """Lightweight list of instructors for staff pickers (offering creation, teacher assignment)."""
    rows = db.query(Instructor).all()
    return [
        {
            "id": ins.id,
            "user_id": ins.user_id,
            "name": f"{(ins.title + ' ') if ins.title else ''}{ins.first_name} {ins.last_name}".strip(),
            "first_name": ins.first_name,
            "last_name": ins.last_name,
            "title": ins.title,
            "department_id": ins.department_id,
            "department_name": ins.department.name if getattr(ins, "department", None) else None,
        }
        for ins in rows
    ]


@router.get("/course-selections")
def list_course_selections(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(StudentCourseSelection).join(Offering, Offering.id == StudentCourseSelection.course_offering_id)
    if canonical_role(current_user.role) != "system_admin":
        faculty_ids = _staff_faculty_ids(current_user, db)
        if faculty_ids == set():
            raise HTTPException(status_code=403, detail="Staff profile not found")
        if faculty_ids is not None:
            q = q.filter(Offering.faculty_id.in_(faculty_ids))
    rows = q.all()
    return [
        {
            "id": row.id,
            "student_id": row.student_id,
            "student_name": f"{row.student.first_name} {row.student.last_name}" if getattr(row, "student", None) else None,
            "course_offering_id": row.course_offering_id,
            "course_code": row.offering.course.code if getattr(row, "offering", None) and row.offering.course else None,
            "course_name": row.offering.course.name if getattr(row, "offering", None) and row.offering.course else None,
            "status": row.status,
            "reason": row.reason,
            "selected_at": row.selected_at,
            "approved_at": row.approved_at,
        }
        for row in rows
    ]


def _selection_for_staff(selection_id: int, current_user: User, db: Session) -> StudentCourseSelection:
    selection = db.query(StudentCourseSelection).filter(StudentCourseSelection.id == selection_id).first()
    if not selection:
        raise HTTPException(status_code=404, detail="Course selection not found")
    _can_manage_faculty(current_user, selection.offering.faculty_id if selection.offering else None, db)
    return selection


def _enroll_student(db: Session, offering: Offering, student_id: int) -> Registration:
    registration = db.query(Registration).filter(Registration.offering_id == offering.id, Registration.student_id == student_id).first()
    if registration:
        registration.status = "active"
    else:
        registration = Registration(offering_id=offering.id, student_id=student_id, status="active")
        db.add(registration)
    active_count = db.query(Registration).filter(Registration.offering_id == offering.id, Registration.status == "active").count()
    offering.enrolled = active_count + (0 if registration.id else 1)
    if offering.enrolled >= offering.capacity:
        offering.status = "full"
    return registration


@router.post("/course-selections/{selection_id}/approve")
def approve_course_selection(selection_id: int, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    selection = _selection_for_staff(selection_id, current_user, db)
    if selection.status not in {"requested", "selected", "approved"}:
        raise HTTPException(status_code=400, detail=f"Selection is already {selection.status}")
    if not selection.student or not selection.offering:
        raise HTTPException(status_code=400, detail="Selection is missing student or offering data")
    reason = _selection_block_reason(db, selection.student, selection.offering)
    if reason:
        selection.status = "rejected"
        selection.reason = reason
        db.commit()
        raise HTTPException(status_code=400, detail=reason)
    staff = _staff_profile(current_user, db)
    selection.status = "enrolled"
    selection.reason = None
    selection.approved_at = datetime.utcnow()
    selection.approved_by_staff_id = staff.id if staff else None
    _enroll_student(db, selection.offering, selection.student_id)
    db.commit()
    return {"success": True, "selection_id": selection.id, "status": selection.status}


@router.post("/course-selections/{selection_id}/reject")
def reject_course_selection(selection_id: int, reason: str = "Rejected by staff", current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    selection = _selection_for_staff(selection_id, current_user, db)
    selection.status = "rejected"
    selection.reason = reason
    db.commit()
    return {"success": True, "selection_id": selection.id, "status": selection.status, "reason": selection.reason}


@router.post("/course-offerings/{offering_id}/enroll-student")
def enroll_student(offering_id: int, body: EnrollStudentIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    _can_manage_faculty(current_user, offering.faculty_id, db)
    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    reason = _selection_block_reason(db, student, offering)
    if reason:
        raise HTTPException(status_code=400, detail=reason)
    registration = _enroll_student(db, offering, body.student_id)
    selection = db.query(StudentCourseSelection).filter(StudentCourseSelection.student_id == body.student_id, StudentCourseSelection.course_offering_id == offering_id).first()
    if selection:
        selection.status = "enrolled"
        selection.approved_at = datetime.utcnow()
        staff = _staff_profile(current_user, db)
        selection.approved_by_staff_id = staff.id if staff else None
        selection.reason = None
    db.commit()
    return {"success": True, "registration_id": registration.id}


@router.get("/timetable")
def list_timetable(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(TimetableEntry).join(Offering)
    if canonical_role(current_user.role) != "system_admin":
        faculty_ids = _staff_faculty_ids(current_user, db)
        if faculty_ids == set():
            raise HTTPException(status_code=403, detail="Staff profile not found")
        if faculty_ids is not None:
            q = q.filter(Offering.faculty_id.in_(faculty_ids))
    return [entry_payload(entry) for entry in q.all()]


def entry_payload(entry: TimetableEntry) -> dict:
    room = entry.room_resource or entry.classroom or entry.lab
    return {
        "id": entry.id,
        "course_offering_id": entry.course_offering_id,
        "course_code": entry.offering.course.code if entry.offering and entry.offering.course else None,
        "course_name": entry.offering.course.name if entry.offering and entry.offering.course else None,
        "building_id": entry.building_id,
        "building_code": entry.building.code if entry.building else None,
        "room_id": entry.room_id,
        "room_name": room.name if room else entry.room,
        "room_type": entry.room_type or (room.room_type if room else None),
        "timetable_date": entry.timetable_date,
        "day_of_week": entry.day_of_week,
        "start_time": entry.start_time,
        "end_time": entry.end_time,
        "teaching_hours": entry.teaching_hours,
        "is_published": bool(entry.is_published),
    }


@router.post("/timetable", status_code=201)
def create_timetable(body: TimetableIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    offering = db.query(Offering).filter(Offering.id == body.course_offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    staff = _can_manage_faculty(current_user, offering.faculty_id, db)
    room = db.query(Classroom).filter(Classroom.id == body.room_id, Classroom.building_id == body.building_id).first()
    if not room:
        raise HTTPException(status_code=400, detail="Room does not belong to selected building")
    validate_teacher_daily_hours(
        db,
        offering.instructor_id,
        body.timetable_date,
        body.day_of_week,
        body.start_time,
        body.end_time,
        body.teaching_hours,
    )
    entry = TimetableEntry(
        **body.model_dump(),
        room_type=room.room_type,
        classroom_id=room.id if room.room_type == "classroom" else None,
        lab_id=room.id if room.room_type == "lab" else None,
        room=room.name,
        created_by_staff_id=staff.id if staff else None,
    )
    db.add(entry)
    db.flush()
    _sync_class_session(db, entry, offering)
    db.commit()
    db.refresh(entry)
    return entry_payload(entry)


@router.put("/timetable/{entry_id}")
def update_timetable(entry_id: int, body: TimetableIn, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    offering = db.query(Offering).filter(Offering.id == body.course_offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    _can_manage_faculty(current_user, offering.faculty_id if offering else None, db)
    room = db.query(Classroom).filter(Classroom.id == body.room_id, Classroom.building_id == body.building_id).first()
    if not room:
        raise HTTPException(status_code=400, detail="Room does not belong to selected building")
    validate_teacher_daily_hours(
        db,
        offering.instructor_id,
        body.timetable_date,
        body.day_of_week,
        body.start_time,
        body.end_time,
        body.teaching_hours,
        exclude_entry_id=entry.id,
    )
    for field, value in body.model_dump().items():
        setattr(entry, field, value)
    entry.room_type = room.room_type
    entry.classroom_id = room.id if room.room_type == "classroom" else None
    entry.lab_id = room.id if room.room_type == "lab" else None
    entry.room = room.name
    _sync_class_session(db, entry, offering)
    db.commit()
    return entry_payload(entry)


@router.delete("/timetable/{entry_id}")
def delete_timetable(entry_id: int, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    _can_manage_faculty(current_user, entry.offering.faculty_id if entry.offering else None, db)
    session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == entry.id).first()
    if session:
        db.delete(session)
    db.delete(entry)
    db.commit()
    return {"deleted": True}


@router.get("/buildings")
def buildings(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    return db.query(Building).all()


@router.get("/rooms")
def rooms(building_id: Optional[int] = None, current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Classroom)
    if building_id:
        q = q.filter(Classroom.building_id == building_id)
    return q.all()


@router.get("/faculty-programs")
def faculty_programs(current_user: User = Depends(require_roles("staff", "admin", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Program)
    if canonical_role(current_user.role) != "system_admin":
        faculty_ids = _staff_faculty_ids(current_user, db)
        if faculty_ids == set():
            raise HTTPException(status_code=403, detail="Staff profile not found")
        if faculty_ids is not None:
            q = q.join(Department, Department.id == Program.department_id).filter(Department.faculty_id.in_(faculty_ids))
    return [{"id": p.id, "name": p.name, "code": p.code, "faculty_id": p.department.faculty_id if p.department else None} for p in q.all()]
