from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from src.config.database import get_db
from src.models.user import User
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.student import Student
from src.models.attendance import AttendanceSession, AttendanceRecord
from src.models.course import Course
from src.models.department import Department
from src.models.program import Program
from src.models.timetable import ClassSession, TimetableEntry
from src.models.course_material import WeeklyTopic
from src.schemas.attendance import AttendanceRecordIn, AttendanceRecordOut, AttendanceSessionOut, AttendanceSessionCreate, BulkAttendanceSubmit
from src.utils.security import canonical_role, require_roles

router = APIRouter(prefix="/attendance", tags=["Attendance"])
teacher_api_router = APIRouter(prefix="/api/teacher/attendance", tags=["Teacher Attendance"])
VALID_STATUSES = {"present", "absent", "late", "excused"}


class TopicUpdate(BaseModel):
    topic_title: str


def _validate_week(week_number):
    if week_number is not None and (week_number < 1 or week_number > 14):
        raise HTTPException(status_code=400, detail="Week number must be between 1 and 14")


def _validate_status(status: str):
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Status must be present, absent, late, or excused")


def _decorate_record(record: AttendanceRecord) -> AttendanceRecordOut:
    data = AttendanceRecordOut.model_validate(record)
    if record.session:
        data.session_date = record.session.session_date
        data.week_number = record.session.week_number
        if record.session.offering and record.session.offering.course:
            data.course_name = record.session.offering.course.name
            data.course_code = record.session.offering.course.code
    return data


def _teacher(db: Session, user: User) -> Instructor:
    instructor = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return instructor


def _week_number_for_entry(entry: TimetableEntry) -> int | None:
    if not entry.timetable_date or not entry.offering or not entry.offering.semester:
        return None
    return max(1, ((entry.timetable_date - entry.offering.semester.start_date).days // 7) + 1)


def _entry_payload(entry: TimetableEntry) -> dict:
    room = entry.room_resource or entry.classroom or entry.lab
    room_type = entry.room_type or (room.room_type if room else None)
    locked_message = None
    if entry.timetable_date and entry.timetable_date < date.today():
        locked_message = "Attendance for previous dates is locked and cannot be modified."
    elif entry.timetable_date and entry.timetable_date > date.today():
        locked_message = "Attendance can be marked on the scheduled class day."
    return {
        "id": entry.id,
        "timetable_entry_id": entry.id,
        "course_offering_id": entry.course_offering_id,
        "course_code": entry.offering.course.code,
        "course_name": entry.offering.course.name,
        "week_number": _week_number_for_entry(entry),
        "day_of_week": entry.day_of_week,
        "timetable_date": entry.timetable_date.isoformat() if entry.timetable_date else None,
        "start_time": entry.start_time,
        "end_time": entry.end_time,
        "building_code": entry.building.code if entry.building else None,
        "room_name": room.name if room else entry.room,
        "room_type": room_type or "classroom",
        "is_editable": entry.timetable_date == date.today(),
        "locked_message": locked_message,
    }


def _minutes(value: str | None) -> int | None:
    if not value:
        return None
    try:
        hours, mins = value.split(":")[:2]
        return int(hours) * 60 + int(mins)
    except ValueError:
        return None


def _room_key(entry: TimetableEntry):
    room = entry.room_resource or entry.classroom or entry.lab
    return (entry.building_id, getattr(room, "id", None) or entry.room_id or entry.classroom_id or entry.lab_id or entry.room)


def _entry_groups(entries: list[TimetableEntry]) -> list[list[TimetableEntry]]:
    buckets = {}
    for entry in entries:
        key = (entry.course_offering_id, entry.timetable_date, entry.day_of_week, _room_key(entry))
        buckets.setdefault(key, []).append(entry)
    groups = []
    for bucket in buckets.values():
        ordered = sorted(bucket, key=lambda item: (item.start_time, item.end_time, item.id))
        current = []
        for entry in ordered:
            prev_end = _minutes(current[-1].end_time) if current else None
            cur_start = _minutes(entry.start_time)
            if not current or (prev_end is not None and cur_start is not None and 0 <= cur_start - prev_end <= 15):
                current.append(entry)
                continue
            groups.append(current)
            current = [entry]
        if current:
            groups.append(current)
    return sorted(groups, key=lambda group: (group[0].timetable_date or date.min, group[0].start_time, group[0].id))


def _entry_group_payload(group: list[TimetableEntry]) -> dict:
    first = group[0]
    payload = _entry_payload(first)
    payload["id"] = first.id
    payload["timetable_entry_id"] = first.id
    payload["timetable_entry_ids"] = [entry.id for entry in group]
    payload["start_time"] = first.start_time
    payload["end_time"] = group[-1].end_time
    payload["session_count"] = len(group)
    return payload


def _real_topic(value: str | None) -> str:
    topic = (value or "").strip()
    if topic.lower() in {"lesson session", "scheduled class session"} or topic.lower().endswith(" session"):
        return ""
    return topic


def _entry_group_topic(db: Session, group: list[TimetableEntry]) -> str:
    timetable_ids = [entry.id for entry in group]
    if not timetable_ids:
        return ""
    first = group[0]
    week_number = _week_number_for_entry(first)
    weekly_topic = db.query(WeeklyTopic).filter(
        WeeklyTopic.course_offering_id == first.course_offering_id,
        WeeklyTopic.week_number == week_number,
    ).first() if week_number else None
    if weekly_topic:
        return weekly_topic.topic_title
    sessions = db.query(ClassSession).filter(ClassSession.timetable_entry_id.in_(timetable_ids)).order_by(ClassSession.start_time, ClassSession.id).all()
    for session in sessions:
        topic = _real_topic(session.topic_title)
        if topic:
            return topic
    return ""


def _entry_group_payload_with_topic(db: Session, group: list[TimetableEntry]) -> dict:
    payload = _entry_group_payload(group)
    payload["topic_title"] = _entry_group_topic(db, group)
    return payload


def _save_weekly_topic_for_entry(db: Session, entry: TimetableEntry, instructor: Instructor, topic_title: str) -> WeeklyTopic:
    topic = topic_title.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    week_number = _week_number_for_entry(entry)
    if not week_number:
        raise HTTPException(status_code=400, detail="Session week could not be determined")
    weekly_topic = db.query(WeeklyTopic).filter(
        WeeklyTopic.course_offering_id == entry.course_offering_id,
        WeeklyTopic.teacher_id == instructor.id,
        WeeklyTopic.week_number == week_number,
    ).first()
    if not weekly_topic:
        weekly_topic = WeeklyTopic(
            course_offering_id=entry.course_offering_id,
            course_id=entry.offering.course_id,
            teacher_id=instructor.id,
            week_number=week_number,
            topic_title=topic,
        )
        db.add(weekly_topic)
    else:
        weekly_topic.topic_title = topic

    group = _group_for_entry(db, entry)
    for item in group:
        class_session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == item.id).first()
        if class_session:
            class_session.topic_title = topic
    return weekly_topic


def _primary_weekly_entry_groups(groups: list[list[TimetableEntry]]) -> list[list[TimetableEntry]]:
    by_week: dict[tuple[int, int | None], list[TimetableEntry]] = {}
    for group in groups:
        key = (group[0].course_offering_id, _week_number_for_entry(group[0]))
        current = by_week.get(key)
        if current is None or (group[0].timetable_date or date.min, group[0].start_time) < (current[0].timetable_date or date.min, current[0].start_time):
            by_week[key] = group
    return sorted(by_week.values(), key=lambda group: (group[0].timetable_date or date.min, group[0].start_time, group[0].id))


def _group_for_entry(db: Session, entry: TimetableEntry) -> list[TimetableEntry]:
    entries = db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id == entry.course_offering_id,
        TimetableEntry.timetable_date == entry.timetable_date,
    ).all()
    for group in _entry_groups(entries):
        if any(item.id == entry.id for item in group):
            return group
    return [entry]


def _ensure_attendance_session(db: Session, entry: TimetableEntry) -> AttendanceSession:
    class_session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == entry.id).first()
    session = db.query(AttendanceSession).filter(
        AttendanceSession.offering_id == entry.course_offering_id,
        AttendanceSession.session_date == entry.timetable_date,
    ).first()
    topic = _real_topic(class_session.topic_title if class_session else None) or f"Timetable session {entry.id}"
    if not session:
        session = AttendanceSession(
            offering_id=entry.course_offering_id,
            session_date=entry.timetable_date,
            week_number=_week_number_for_entry(entry),
            topic=topic,
        )
        db.add(session)
        db.flush()
    else:
        session.topic = topic
    return session


def _student_payload(student: Student, record: AttendanceRecord | None) -> dict:
    return {
        "student_id": student.id,
        "student_code": student.student_code,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "attendance_id": record.id if record else None,
        "status": record.status if record else None,
        "notes": record.notes if record else None,
    }


@router.get("/teacher/attendance/filters")
def teacher_attendance_filters(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    offerings = db.query(Offering).filter(Offering.instructor_id == instructor.id, Offering.status == "active").all()
    faculty_map = {}
    program_map = {}
    courses = []
    years = set()
    semesters = set()
    study_levels = set()
    for offering in offerings:
        course = offering.course
        department = course.department if course else None
        faculty = department.faculty if department else None
        program = offering.program
        if faculty:
            faculty_map[faculty.id] = {"id": faculty.id, "name": faculty.name, "code": faculty.code}
        if program:
            program_map[program.id] = {"id": program.id, "name": program.name, "code": program.code, "faculty_id": faculty.id if faculty else None}
        years.add(offering.academic_period or offering.academic_year or "2025-2026")
        if offering.semester:
            semesters.add(offering.semester.name)
        if offering.academic_year and " Year " in offering.academic_year:
            study_levels.add(offering.academic_year.split(" Year ")[0])
        courses.append({
            "course_offering_id": offering.id,
            "course_id": offering.course_id,
            "course_code": course.code if course else None,
            "course_name": course.name if course else None,
            "faculty_id": faculty.id if faculty else None,
            "program_id": program.id if program else None,
            "academic_year": offering.academic_period or offering.academic_year,
            "study_level": offering.academic_year.split(" Year ")[0] if offering.academic_year and " Year " in offering.academic_year else None,
            "semester_id": offering.semester_id,
            "semester": offering.semester.name if offering.semester else None,
        })
    return {
        "faculties": list(faculty_map.values()),
        "programs": list(program_map.values()),
        "academic_years": sorted(years),
        "semesters": sorted(semesters),
        "study_levels": sorted(study_levels),
        "courses": courses,
    }


@router.get("/teacher/attendance/sessions")
def teacher_attendance_sessions(course_offering_id: int, week_number: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    offering = db.query(Offering).filter(Offering.id == course_offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    entries = db.query(TimetableEntry).filter(TimetableEntry.course_offering_id == course_offering_id).all()
    sessions = [_entry_group_payload_with_topic(db, group) for group in _primary_weekly_entry_groups(_entry_groups([entry for entry in entries if _week_number_for_entry(entry) == week_number]))]
    return sorted(sessions, key=lambda item: (item["timetable_date"] or "", item["start_time"]))


@router.get("/teacher/attendance/session/{timetable_entry_id}")
def teacher_attendance_session(timetable_entry_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    entry = db.query(TimetableEntry).join(Offering).filter(TimetableEntry.id == timetable_entry_id, Offering.instructor_id == instructor.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Session not found")
    group = _group_for_entry(db, entry)
    if entry.timetable_date and entry.timetable_date > date.today():
        students = []
        records = {}
    else:
        session = _ensure_attendance_session(db, entry)
        records = {record.student_id: record for record in db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id).all()}
        students = [reg.student for reg in entry.offering.registrations if reg.status == "active" and reg.student]
    db.commit()
    return {"session": _entry_group_payload_with_topic(db, group), "students": [_student_payload(student, records.get(student.id)) for student in students]}


@router.post("/teacher/attendance/session/{timetable_entry_id}/bulk-save")
def teacher_attendance_bulk_save(timetable_entry_id: int, body: BulkAttendanceSubmit, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    entry = db.query(TimetableEntry).join(Offering).filter(TimetableEntry.id == timetable_entry_id, Offering.instructor_id == instructor.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Session not found")
    if entry.timetable_date != date.today():
        raise HTTPException(status_code=403, detail="Attendance for previous dates is locked and cannot be modified.")
    session = _ensure_attendance_session(db, entry)
    group = _group_for_entry(db, entry)
    enrolled_ids = {reg.student_id for reg in entry.offering.registrations if reg.status == "active"}
    for rec in body.records:
        _validate_status(rec.status)
        if rec.student_id not in enrolled_ids:
            raise HTTPException(status_code=400, detail=f"Student {rec.student_id} is not enrolled in this offering")
        record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == rec.student_id).first()
        if not record:
            record = AttendanceRecord(session_id=session.id, student_id=rec.student_id)
            db.add(record)
        record.course_offering_id = entry.course_offering_id
        record.timetable_entry_id = entry.id
        class_session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == entry.id).first()
        record.class_session_id = class_session.id if class_session else None
        record.course_id = entry.offering.course_id
        record.teacher_id = instructor.id
        record.week_number = session.week_number
        record.attendance_date = entry.timetable_date
        record.start_time = entry.start_time
        record.end_time = group[-1].end_time
        record.status = rec.status
        record.notes = rec.notes
    db.commit()
    return {"saved": len(body.records)}


@router.put("/teacher/attendance/{attendance_id}")
def teacher_attendance_update(attendance_id: int, body: AttendanceRecordIn, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == attendance_id, AttendanceRecord.teacher_id == instructor.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if record.attendance_date != date.today():
        raise HTTPException(status_code=403, detail="Attendance for previous dates is locked and cannot be modified.")
    _validate_status(body.status)
    record.status = body.status
    record.notes = body.notes
    db.commit()
    return {"updated": True}


@teacher_api_router.get("/filters")
def api_teacher_attendance_filters(current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    return teacher_attendance_filters(current_user, db)


@teacher_api_router.get("/sessions")
def api_teacher_attendance_sessions(course_offering_id: int, week_number: int, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    return teacher_attendance_sessions(course_offering_id, week_number, current_user, db)


@teacher_api_router.get("/session/{timetable_entry_id}")
def api_teacher_attendance_session(timetable_entry_id: int, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    return teacher_attendance_session(timetable_entry_id, current_user, db)


@teacher_api_router.post("/session/{timetable_entry_id}/bulk-save")
def api_teacher_attendance_bulk_save(timetable_entry_id: int, body: BulkAttendanceSubmit, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    return teacher_attendance_bulk_save(timetable_entry_id, body, current_user, db)


@teacher_api_router.patch("/session/{timetable_entry_id}/topic")
def api_teacher_attendance_topic(timetable_entry_id: int, body: TopicUpdate, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    entry = db.query(TimetableEntry).join(Offering).filter(TimetableEntry.id == timetable_entry_id, Offering.instructor_id == instructor.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Session not found")
    _save_weekly_topic_for_entry(db, entry, instructor, body.topic_title)
    db.commit()
    return _entry_group_payload_with_topic(db, _group_for_entry(db, entry))


@teacher_api_router.get("")
def api_teacher_attendance(classSessionId: int, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    class_session = db.query(ClassSession).filter(ClassSession.id == classSessionId, ClassSession.teacher_id == instructor.id).first()
    if not class_session or not class_session.timetable_entry_id:
        raise HTTPException(status_code=404, detail="Class session not found")
    return teacher_attendance_session(class_session.timetable_entry_id, current_user, db)


@teacher_api_router.post("")
def api_teacher_attendance_save(classSessionId: int, body: BulkAttendanceSubmit, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    instructor = _teacher(db, current_user)
    class_session = db.query(ClassSession).filter(ClassSession.id == classSessionId, ClassSession.teacher_id == instructor.id).first()
    if not class_session or not class_session.timetable_entry_id:
        raise HTTPException(status_code=404, detail="Class session not found")
    return teacher_attendance_bulk_save(class_session.timetable_entry_id, body, current_user, db)


@teacher_api_router.put("/{attendance_id}")
def api_teacher_attendance_update(attendance_id: int, body: AttendanceRecordIn, current_user: User = Depends(require_roles("teacher", "instructor")), db: Session = Depends(get_db)):
    return teacher_attendance_update(attendance_id, body, current_user, db)

@router.get("/offering/{offering_id}/sessions", response_model=List[AttendanceSessionOut])
def list_sessions(offering_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    if canonical_role(current_user.role) == "instructor":
        instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
        if not instructor or not db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first():
            raise HTTPException(status_code=403, detail="Not your offering")
    return db.query(AttendanceSession).filter(AttendanceSession.offering_id == offering_id).all()

@router.post("/offering/{offering_id}/sessions", response_model=AttendanceSessionOut, status_code=201)
def create_session(offering_id: int, body: AttendanceSessionCreate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    _validate_week(body.week_number)
    session = AttendanceSession(offering_id=offering_id, session_date=body.session_date, week_number=body.week_number, topic=body.topic)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/sessions/{session_id}/records", status_code=200)
def submit_attendance(session_id: int, body: BulkAttendanceSubmit, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.offering.instructor_id != instructor.id:
        raise HTTPException(status_code=403, detail="Not your offering")
    if session.session_date != date.today():
        raise HTTPException(status_code=403, detail="Attendance for previous dates is locked and cannot be modified.")
    for rec in body.records:
        _validate_status(rec.status)
        enrolled = db.query(Registration).filter(
            Registration.offering_id == session.offering_id,
            Registration.student_id == rec.student_id,
            Registration.status == "active",
        ).first()
        if not enrolled:
            raise HTTPException(status_code=400, detail=f"Student {rec.student_id} is not enrolled in this offering")
        existing = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == rec.student_id).first()
        if existing:
            existing.status = rec.status
            existing.notes = rec.notes
            existing.course_offering_id = session.offering_id
            existing.course_id = session.offering.course_id
            existing.teacher_id = session.offering.instructor_id
            existing.week_number = session.week_number
            existing.attendance_date = session.session_date
            existing.start_time = existing.start_time
            existing.end_time = existing.end_time
        else:
            db.add(AttendanceRecord(
                session_id=session_id,
                course_offering_id=session.offering_id,
                course_id=session.offering.course_id,
                teacher_id=session.offering.instructor_id,
                student_id=rec.student_id,
                week_number=session.week_number,
                attendance_date=session.session_date,
                status=rec.status,
                notes=rec.notes,
            ))
    db.commit()
    return {"saved": len(body.records)}

@router.get("/sessions/{session_id}/records")
def get_session_records(session_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    if canonical_role(current_user.role) == "instructor":
        instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        if not instructor or not session or session.offering.instructor_id != instructor.id:
            raise HTTPException(status_code=403, detail="Not your offering")
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    return [_decorate_record(r) for r in records]

@router.get("/me", response_model=List[AttendanceRecordOut])
def my_attendance(offering_id: int | None = None, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    q = db.query(AttendanceRecord).join(AttendanceSession).filter(AttendanceRecord.student_id == student.id)
    if offering_id:
        q = q.filter(AttendanceSession.offering_id == offering_id)
    return [_decorate_record(r) for r in q.order_by(AttendanceSession.session_date.desc()).all()]
