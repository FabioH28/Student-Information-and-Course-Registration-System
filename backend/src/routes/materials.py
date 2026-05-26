import os
from pathlib import Path
from typing import List, Optional
from uuid import uuid4
from urllib.parse import quote, urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, timezone

from src.config.database import get_db
from src.config.settings import settings
from src.models.course_material import Assignment, AssignmentSubmission, CourseMaterial, CourseWeekTopic, WeeklyTask, WeeklyTopic
from src.models.course import Course
from src.models.department import Department, Faculty
from src.models.instructor import Instructor
from src.models.notification import Notification
from src.models.offering import Offering
from src.models.registration import Registration
from src.models.student import Student
from src.models.timetable import ClassSession, TimetableEntry
from src.models.user import User
from src.schemas.course_material import (
    CourseMaterialOut,
    CourseMaterialUpdate,
    AssignmentOut,
    AssignmentSubmissionOut,
    AssignmentUpdate,
    WeekContentOut,
    WeeklyTaskCreate,
    WeeklyTaskOut,
    WeeklyTaskUpdate,
    WeeklyTopicOut,
    WeeklyTopicUpsert,
)
from src.utils.security import canonical_role, require_roles

router = APIRouter(tags=["Weekly Course Materials"])

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".zip"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
}
MAX_FILE_SIZE = 50 * 1024 * 1024
UPLOAD_ROOT = Path(os.getenv("COURSE_MATERIAL_UPLOAD_DIR", "uploads/course-materials"))


def _teacher_for_user(user: User, db: Session) -> Instructor:
    teacher = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return teacher


def _student_for_user(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def _teacher_offering(offering_id: int, teacher: Instructor, db: Session) -> Offering:
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == teacher.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="You are not assigned to this course offering.")
    return offering


def _resolve_teacher_offering(
    teacher: Instructor,
    db: Session,
    offering_id: Optional[int] = None,
    course_id: Optional[int] = None,
) -> Offering:
    if not offering_id:
        raise HTTPException(status_code=400, detail="course_offering_id is required")
    q = db.query(Offering).filter(Offering.instructor_id == teacher.id)
    if offering_id:
        q = q.filter(Offering.id == offering_id)
    if course_id:
        q = q.filter(Offering.course_id == course_id)
    offering = q.first()
    if not offering:
        raise HTTPException(status_code=403, detail="You are not assigned to this course offering.")
    return offering


def _student_offering(offering_id: int, student: Student, db: Session) -> Offering:
    reg = db.query(Registration).filter(
        Registration.offering_id == offering_id,
        Registration.student_id == student.id,
        Registration.status == "active",
    ).first()
    if not reg:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    return reg.offering


def _validate_week(week_number: int):
    if week_number < 1 or week_number > 14:
        raise HTTPException(status_code=400, detail="Week number must be between 1 and 14")


def _validate_external_url(url: str):
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise HTTPException(status_code=400, detail="External link must be a valid HTTPS URL")


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _parse_publish_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        raise HTTPException(status_code=400, detail="Publish date/time is invalid")
    if parsed.tzinfo:
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _parse_open_window(date_value: Optional[str], time_value: Optional[str], label: str) -> Optional[datetime]:
    if not date_value and not time_value:
        return None
    if not date_value or not time_value:
        raise HTTPException(status_code=400, detail=f"{label} date and time are required")
    try:
        return datetime.fromisoformat(f"{date_value}T{time_value}")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{label} date/time is invalid")


def _resolve_visibility(visibility_mode: str, publish_at_value: Optional[str]) -> tuple[str, bool, Optional[datetime], Optional[datetime]]:
    now = _utc_now_naive()
    if visibility_mode == "schedule_later":
        publish_at = _parse_publish_at(publish_at_value)
        if not publish_at:
            raise HTTPException(status_code=400, detail="Publish date and time are required for scheduled materials")
        if publish_at <= now:
            return "published", True, publish_at, now
        return "scheduled", False, publish_at, None
    if visibility_mode != "publish_now":
        raise HTTPException(status_code=400, detail="Visibility mode must be publish_now or schedule_later")
    return "published", True, None, now


def _publish_due_materials(db: Session):
    now = _utc_now_naive()
    due = db.query(CourseMaterial).filter(
        CourseMaterial.status == "scheduled",
        CourseMaterial.publish_at != None,
        CourseMaterial.publish_at <= now,
    ).all()
    for material in due:
        material.status = "published"
        material.is_visible_to_students = True
        material.published_at = now
    if due:
        db.commit()


def _publish_due_assignments(db: Session):
    now = _utc_now_naive()
    due = db.query(Assignment).filter(
        Assignment.status == "scheduled",
        Assignment.publish_at != None,
        Assignment.publish_at <= now,
    ).all()
    for assignment in due:
        assignment.status = "published"
        assignment.is_visible_to_students = True
        assignment.published_at = now
    if due:
        db.commit()


def _decorate_material(material: CourseMaterial) -> CourseMaterialOut:
    data = CourseMaterialOut.model_validate(material)
    data.course_name = material.offering.course.name if material.offering and material.offering.course else None
    data.course_code = material.offering.course.code if material.offering and material.offering.course else None
    data.teacher_name = f"{material.teacher.first_name} {material.teacher.last_name}" if material.teacher else None
    return data


def _student_visible_materials_query(db: Session):
    _publish_due_materials(db)
    now = _utc_now_naive()
    return db.query(CourseMaterial).filter(
        CourseMaterial.status == "published",
        CourseMaterial.is_visible_to_students == True,
        CourseMaterial.deleted_at == None,
        ((CourseMaterial.publish_at == None) | (CourseMaterial.publish_at <= now)),
    )


def _decorate_task(task: WeeklyTask) -> WeeklyTaskOut:
    data = WeeklyTaskOut.model_validate(task)
    data.course_name = task.offering.course.name if task.offering and task.offering.course else None
    data.course_code = task.offering.course.code if task.offering and task.offering.course else None
    data.teacher_name = f"{task.teacher.first_name} {task.teacher.last_name}" if task.teacher else None
    return data


def _topic_for_week(db: Session, offering_id: int, week_number: int) -> Optional[WeeklyTopic]:
    return db.query(WeeklyTopic).filter(
        WeeklyTopic.course_offering_id == offering_id,
        WeeklyTopic.week_number == week_number,
    ).first()


def _decorate_assignment(db: Session, assignment: Assignment) -> AssignmentOut:
    data = AssignmentOut.model_validate(assignment)
    data.course_name = assignment.offering.course.name if assignment.offering and assignment.offering.course else None
    data.course_code = assignment.offering.course.code if assignment.offering and assignment.offering.course else None
    data.teacher_name = f"{assignment.teacher.first_name} {assignment.teacher.last_name}" if assignment.teacher else None
    if assignment.class_session:
        data.topic_title = _real_topic(assignment.class_session.topic_title) or None
    elif assignment.course_week_topic:
        data.topic_title = assignment.course_week_topic.topic_title
    else:
        topic = _topic_for_week(db, assignment.course_offering_id, assignment.week_number)
        data.topic_title = topic.topic_title if topic else None
    data.submissions_count = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment.id,
        AssignmentSubmission.status.in_(["submitted", "graded", "late"]),
    ).count()
    return data


def _decorate_submission(submission: AssignmentSubmission) -> AssignmentSubmissionOut:
    data = AssignmentSubmissionOut.model_validate(submission)
    student = submission.student
    if student:
        data.student_name = f"{student.first_name} {student.last_name}"
        data.student_code = student.student_code
    if submission.submitted_file_path:
        data.submission_type = "File"
    elif submission.submitted_text and submission.submitted_text.strip().startswith(("http://", "https://")):
        data.submission_type = "Link"
    elif submission.submitted_text:
        data.submission_type = "Text"
    if submission.submitted_file_path:
        data.download_url = f"/api/teacher/assignment-submissions/{submission.id}/download"
    return data


def _submission_placeholder(assignment: Assignment, student: Student) -> AssignmentSubmissionOut:
    return AssignmentSubmissionOut(
        id=None,
        assignment_id=assignment.id,
        student_id=student.id,
        submitted_text=None,
        submitted_file_original_name=None,
        submission_type=None,
        submitted_at=None,
        score=None,
        feedback=None,
        status="not_submitted",
        is_published=False,
        student_name=f"{student.first_name} {student.last_name}",
        student_code=student.student_code,
        download_url=None,
    )


def _assignment_deadline(assignment: Assignment) -> datetime | None:
    if assignment.end_at:
        return assignment.end_at
    if not assignment.due_date:
        return None
    due_time = assignment.due_time or datetime.strptime("23:59", "%H:%M").time()
    return datetime.combine(assignment.due_date, due_time)


def _deadline_passed(assignment: Assignment) -> bool:
    deadline = _assignment_deadline(assignment)
    return bool(deadline and _utc_now_naive() > deadline)


def _assignment_for_week(db: Session, offering: Offering, teacher: Instructor, week_number: int) -> Assignment | None:
    return db.query(Assignment).filter(
        Assignment.course_offering_id == offering.id,
        Assignment.teacher_id == teacher.id,
        Assignment.course_id == offering.course_id,
        Assignment.week_number == week_number,
    ).order_by(Assignment.created_at.desc(), Assignment.id.desc()).first()


def _normalize_semester_name(value: str | None) -> str | None:
    if not value:
        return value
    lowered = value.lower()
    if "spring" in lowered:
        return "Spring"
    if "winter" in lowered or "fall" in lowered or "autumn" in lowered:
        return "Winter"
    return value


def _minutes(value: str | None) -> int | None:
    if not value:
        return None
    parts = value.split(":")
    if len(parts) < 2:
        return None
    try:
        return int(parts[0]) * 60 + int(parts[1])
    except ValueError:
        return None


def _sessions_are_consecutive(previous: ClassSession, current: ClassSession) -> bool:
    previous_end = _minutes(previous.end_time)
    current_start = _minutes(current.start_time)
    if previous_end is None or current_start is None:
        return False
    return 0 <= current_start - previous_end <= 15


def _session_room_key(session: ClassSession) -> tuple:
    return (session.building_id, session.room_id, session.room_type, session.room)


def _group_class_sessions(sessions: list[ClassSession]) -> list[list[ClassSession]]:
    buckets: dict[tuple, list[ClassSession]] = {}
    for session in sessions:
        key = (
            session.teacher_id,
            session.course_id,
            session.course_offering_id,
            session.semester_id,
            session.week_id,
            session.session_date,
        )
        buckets.setdefault(key, []).append(session)
    groups: list[list[ClassSession]] = []
    for bucket in buckets.values():
        ordered = sorted(bucket, key=lambda item: (item.start_time or "", item.end_time or "", item.id or 0))
        groups.append(ordered)
    return sorted(groups, key=lambda group: (group[0].session_date, group[0].start_time, group[0].id or 0))


def _real_topic(value: str | None) -> str:
    topic = (value or "").strip()
    if topic.lower() in {"lesson session", "scheduled class session"} or topic.lower().endswith(" session"):
        return ""
    return topic


def _group_topic(group: list[ClassSession]) -> str:
    for session in sorted(group, key=lambda item: (item.start_time or "", item.id or 0)):
        topic = _real_topic(session.topic_title)
        if topic:
            return topic
    return ""


def _student_visible_assignments_query(db: Session):
    _publish_due_assignments(db)
    now = _utc_now_naive()
    return db.query(Assignment).filter(
        Assignment.status == "published",
        Assignment.is_visible_to_students == True,
        ((Assignment.publish_at == None) | (Assignment.publish_at <= now)),
    )


def _notify_students(db: Session, offering_id: int, title: str, message: str):
    regs = db.query(Registration).filter(Registration.offering_id == offering_id, Registration.status == "active").all()
    for reg in regs:
        if reg.student and reg.student.user_id:
            db.add(Notification(user_id=reg.student.user_id, title=title, message=message, type="info"))


def _notify_user(db: Session, user_id: int | None, title: str, message: str, type_: str = "info"):
    if user_id:
        db.add(Notification(user_id=user_id, title=title, message=message, type=type_))


def _study_level(offering: Offering) -> str | None:
    if offering.academic_year and " Year " in offering.academic_year:
        return offering.academic_year.split(" Year ")[0]
    if offering.program and offering.program.duration_semesters:
        return "Master" if offering.program.duration_semesters <= 4 else "Bachelor"
    return None


def _faculty_for_offering(offering: Offering, db: Session) -> Faculty | None:
    if offering.faculty_id:
        faculty = db.query(Faculty).filter(Faculty.id == offering.faculty_id).first()
        if faculty:
            return faculty
    if offering.program and offering.program.department:
        return offering.program.department.faculty
    if offering.course and offering.course.department:
        return offering.course.department.faculty
    return None


def _week_range(offering: Offering, week_number: int) -> tuple[date, date]:
    if offering.semester:
        start = offering.semester.start_date + timedelta(days=(week_number - 1) * 7)
    else:
        start = datetime.utcnow().date() + timedelta(days=(week_number - 1) * 7)
    return start, start + timedelta(days=6)


def _semester_weeks(offering: Offering) -> list[dict]:
    if not offering.semester:
        return []
    weeks = []
    start = offering.semester.start_date
    current = start
    number = 1
    total_weeks = int(getattr(offering.semester, "total_weeks", None) or 14)
    while current <= offering.semester.end_date and number <= total_weeks:
        end = min(current + timedelta(days=6), offering.semester.end_date)
        weeks.append({
            "id": number,
            "week_id": number,
            "week_number": number,
            "name": f"Week {number}",
            "start_date": current.isoformat(),
            "end_date": end.isoformat(),
            "semester_id": offering.semester_id,
            "academic_year": offering.academic_period or offering.academic_year,
        })
        current = end + timedelta(days=1)
        number += 1
    return weeks


def _week_entries(db: Session, offering: Offering, week_number: int) -> list[TimetableEntry]:
    start, end = _week_range(offering, week_number)
    return db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id == offering.id,
        TimetableEntry.timetable_date != None,
        TimetableEntry.timetable_date >= start,
        TimetableEntry.timetable_date <= end,
    ).order_by(TimetableEntry.timetable_date, TimetableEntry.start_time).all()


def _session_week_number(offering: Offering, session_date: date) -> int:
    if offering.semester and offering.semester.start_date:
        return max(1, ((session_date - offering.semester.start_date).days // 7) + 1)
    return 1


def _session_room(entry: TimetableEntry) -> tuple[Optional[int], Optional[int], Optional[str], Optional[int], Optional[str]]:
    room = entry.room_resource or entry.classroom or entry.lab
    return (
        entry.building_id,
        getattr(room, "id", None) or entry.room_id or entry.classroom_id or entry.lab_id,
        entry.room_type or (getattr(room, "room_type", None) if room else None),
        entry.lab_id,
        getattr(room, "name", None) or entry.room,
    )


def _sync_class_sessions(db: Session, offering: Offering, teacher: Instructor, week_number: Optional[int] = None, target_date: Optional[date] = None) -> list[ClassSession]:
    entries_q = db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id == offering.id,
        TimetableEntry.timetable_date != None,
    )
    if week_number:
        start, end = _week_range(offering, week_number)
        entries_q = entries_q.filter(TimetableEntry.timetable_date >= start, TimetableEntry.timetable_date <= end)
    if target_date:
        entries_q = entries_q.filter(TimetableEntry.timetable_date == target_date)
    entries = entries_q.order_by(TimetableEntry.timetable_date, TimetableEntry.start_time, TimetableEntry.id).all()

    by_day: dict[date, int] = {}
    sessions = []
    for entry in entries:
        actual_week = _session_week_number(offering, entry.timetable_date)
        by_day[entry.timetable_date] = by_day.get(entry.timetable_date, 0) + 1
        building_id, room_id, room_type, lab_id, room = _session_room(entry)
        session = db.query(ClassSession).filter(ClassSession.timetable_entry_id == entry.id).first()
        if not session:
            session = ClassSession(
                timetable_entry_id=entry.id,
                course_offering_id=offering.id,
                teacher_id=teacher.id,
                course_id=offering.course_id,
                faculty_id=offering.faculty_id,
                program_id=offering.program_id,
                semester_id=offering.semester_id,
                week_id=actual_week,
                session_date=entry.timetable_date,
                day_of_week=entry.day_of_week,
                start_time=entry.start_time,
                end_time=entry.end_time,
                created_by_teacher=False,
            )
            db.add(session)
        session.teacher_id = teacher.id
        session.course_id = offering.course_id
        session.faculty_id = offering.faculty_id
        session.program_id = offering.program_id
        session.semester_id = offering.semester_id
        session.week_id = actual_week
        session.session_date = entry.timetable_date
        session.day_of_week = entry.day_of_week
        session.start_time = entry.start_time
        session.end_time = entry.end_time
        session.building_id = building_id
        session.room_id = room_id
        session.room_type = room_type
        session.lab_id = lab_id
        session.room = room
        session.session_order = by_day[entry.timetable_date]
        sessions.append(session)
    db.flush()
    return sessions


def _session_payload(session: ClassSession, materials: Optional[list[CourseMaterial]] = None, assignments_count: int = 0, students_count: int = 0) -> dict:
    return {
        "id": session.id,
        "class_session_id": session.id,
        "timetable_entry_id": session.timetable_entry_id,
        "course_offering_id": session.course_offering_id,
        "course_id": session.course_id,
        "teacher_id": session.teacher_id,
        "faculty_id": session.faculty_id,
        "program_id": session.program_id,
        "semester_id": session.semester_id,
        "week_id": session.week_id,
        "week_number": session.week_id,
        "date": session.session_date.isoformat(),
        "session_date": session.session_date.isoformat(),
        "day": session.day_of_week,
        "day_of_week": session.day_of_week,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "session_order": session.session_order,
        "hour_number": session.session_order,
        "topic_id": session.id,
        "topic_title": session.topic_title or "",
        "topic_description": session.topic_description,
        "description": session.topic_description,
        "status": session.status,
        "room": session.room,
        "room_type": session.room_type,
        "course_code": session.offering.course.code if session.offering and session.offering.course else None,
        "course_name": session.offering.course.name if session.offering and session.offering.course else None,
        "materials_count": len(materials or []),
        "assignments_count": assignments_count,
        "students_count": students_count,
        "materials": [_decorate_material(material).model_dump(mode="json") for material in (materials or [])],
    }


def _weekly_topic_for_offering(db: Session, offering_id: int, week_number: int) -> Optional[WeeklyTopic]:
    return db.query(WeeklyTopic).filter(
        WeeklyTopic.course_offering_id == offering_id,
        WeeklyTopic.week_number == week_number,
    ).first()


def _primary_weekly_groups(groups: list[list[ClassSession]]) -> list[list[ClassSession]]:
    by_week: dict[tuple[int, int], list[ClassSession]] = {}
    for group in groups:
        key = (group[0].course_offering_id, group[0].week_id)
        current = by_week.get(key)
        if current is None or (group[0].session_date, group[0].start_time or "") < (current[0].session_date, current[0].start_time or ""):
            by_week[key] = group
    return sorted(by_week.values(), key=lambda group: (group[0].session_date, group[0].start_time, group[0].id or 0))


def _session_group_payload(group: list[ClassSession], materials: Optional[list[CourseMaterial]] = None, assignments_count: int = 0, students_count: int = 0, weekly_topic: Optional[WeeklyTopic] = None) -> dict:
    first = min(group, key=lambda session: (session.start_time or "", session.id or 0))
    last = max(group, key=lambda session: (session.end_time or "", session.id or 0))
    payload = _session_payload(first, materials, assignments_count, students_count)
    descriptions: list[str] = []
    for session in sorted(group, key=lambda item: (item.start_time or "", item.id or 0)):
        description = (session.topic_description or "").strip()
        if description and description not in descriptions:
            descriptions.append(description)
    payload["id"] = first.id
    payload["class_session_id"] = first.id
    payload["topic_id"] = first.id
    payload["start_time"] = first.start_time
    payload["end_time"] = last.end_time
    payload["session_ids"] = [session.id for session in group]
    payload["class_session_ids"] = [session.id for session in group]
    payload["timetable_entry_ids"] = [session.timetable_entry_id for session in group if session.timetable_entry_id]
    payload["session_count"] = len(group)
    payload["topic_title"] = weekly_topic.topic_title if weekly_topic else _group_topic(group)
    payload["description"] = "\n".join(descriptions) if descriptions else None
    return payload


def _topic_payload(topic: CourseWeekTopic, materials: list[CourseMaterial], entry: Optional[TimetableEntry] = None) -> dict:
    return {
        "topic_id": topic.id,
        "date": topic.topic_date.isoformat(),
        "day": topic.day_of_week,
        "start_time": entry.start_time if entry else None,
        "end_time": entry.end_time if entry else None,
        "topic_title": topic.topic_title,
        "description": topic.description,
        "materials_count": len(materials),
        "materials": [_decorate_material(material).model_dump(mode="json") for material in materials],
    }


def _ensure_week_topics(db: Session, offering: Offering, teacher: Instructor, week_number: int) -> list[CourseWeekTopic]:
    entries = _week_entries(db, offering, week_number)
    if not entries:
        return []

    entry_by_date: dict[date, TimetableEntry] = {}
    for entry in entries:
        if entry.timetable_date and entry.timetable_date not in entry_by_date:
            entry_by_date[entry.timetable_date] = entry
    scheduled_dates = set(entry_by_date.keys())

    existing = db.query(CourseWeekTopic).filter(
        CourseWeekTopic.course_offering_id == offering.id,
        CourseWeekTopic.week_number == week_number,
    ).all()

    by_date = {topic.topic_date: topic for topic in existing if topic.topic_date in scheduled_dates}
    for index, topic_date in enumerate(sorted(scheduled_dates)):
        if topic_date in by_date:
            topic = by_date[topic_date]
            topic.sort_order = index
            if not topic.day_of_week:
                topic.day_of_week = topic_date.strftime("%A")
            continue
        entry = entry_by_date[topic_date]
        topic = CourseWeekTopic(
            course_offering_id=offering.id,
            course_id=offering.course_id,
            teacher_id=teacher.id,
            week_number=week_number,
            topic_date=topic_date,
            day_of_week=topic_date.strftime("%A"),
            topic_title=f"{offering.course.code if offering.course else 'Class'}: {entry.start_time}-{entry.end_time}",
            sort_order=index,
        )
        db.add(topic)
    db.flush()
    topics = db.query(CourseWeekTopic).filter(
        CourseWeekTopic.course_offering_id == offering.id,
        CourseWeekTopic.week_number == week_number,
        CourseWeekTopic.topic_date.in_(scheduled_dates),
    ).all()
    return sorted(topics, key=lambda item: (item.topic_date, item.sort_order))


def _validate_course_week_topic(db: Session, offering: Offering, teacher: Instructor, week_number: int, topic_id: Optional[int]) -> CourseWeekTopic:
    if not topic_id:
        raise HTTPException(status_code=400, detail="A real scheduled topic/session is required")
    topic = db.query(CourseWeekTopic).filter(
        CourseWeekTopic.id == topic_id,
        CourseWeekTopic.course_offering_id == offering.id,
        CourseWeekTopic.week_number == week_number,
        CourseWeekTopic.teacher_id == teacher.id,
    ).first()
    if not topic:
        raise HTTPException(status_code=400, detail="Selected topic does not belong to this course/week")
    real_dates = {entry.timetable_date for entry in _week_entries(db, offering, week_number)}
    if topic.topic_date not in real_dates:
        raise HTTPException(status_code=400, detail="Selected topic is not linked to a real scheduled class session")
    return topic


def _validate_class_session(db: Session, offering: Offering, teacher: Instructor, week_number: int, session_id: Optional[int]) -> ClassSession:
    if not session_id:
        raise HTTPException(status_code=400, detail="A real class session is required")
    _sync_class_sessions(db, offering, teacher, week_number)
    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.teacher_id == teacher.id,
        ClassSession.course_offering_id == offering.id,
        ClassSession.course_id == offering.course_id,
        ClassSession.week_id == week_number,
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Selected class session does not belong to this course/week")
    return session


@router.get("/teacher/materials/filters")
def teacher_material_filters(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    offerings = db.query(Offering).filter(Offering.instructor_id == teacher.id, Offering.status == "active").all()

    faculties: dict[int, dict] = {}
    programs: dict[int, dict] = {}
    academic_years: set[str] = set()
    semesters: set[str] = set()
    study_levels: set[str] = set()
    program_study_levels: dict[str, dict] = {}
    academic_year_semesters: dict[str, dict] = {}
    courses = []

    for offering in offerings:
        course = offering.course
        program = offering.program
        faculty = None
        if offering.faculty_id:
            faculty = db.query(Faculty).filter(Faculty.id == offering.faculty_id).first()
        if not faculty and program and program.department:
            faculty = program.department.faculty
        if not faculty and course and course.department:
            faculty = course.department.faculty

        faculty_id = faculty.id if faculty else offering.faculty_id
        program_id = program.id if program else offering.program_id
        if faculty_id and faculty:
            faculties[faculty_id] = {"id": faculty_id, "name": faculty.name}
        if program_id and program:
            programs[program_id] = {"id": program_id, "faculty_id": faculty_id, "name": program.name}
        study_level = _study_level(offering)
        if program_id and program and study_level:
            key = f"{program_id}:{study_level}"
            program_study_levels[key] = {
                "id": key,
                "program_id": program_id,
                "faculty_id": faculty_id,
                "study_level": study_level,
                "label": f"{program.name} — {study_level}",
            }
        if offering.academic_year:
            academic_years.add(offering.academic_year)
            if " Year " in offering.academic_year:
                study_levels.add(offering.academic_year.split(" Year ")[0])
        if offering.semester:
            semesters.add(_normalize_semester_name(offering.semester.name) or offering.semester.name)
            key = f"{offering.academic_period or offering.academic_year}:{offering.semester_id}"
            academic_year_semesters[key] = {
                "id": key,
                "academic_year": offering.academic_period or offering.academic_year,
                "semester_id": offering.semester_id,
                "semester": _normalize_semester_name(offering.semester.name),
                "label": f"{offering.academic_period or offering.academic_year} · {_normalize_semester_name(offering.semester.name)}",
            }
        courses.append({
            "course_offering_id": offering.id,
            "course_id": offering.course_id,
            "faculty_id": faculty_id,
            "program_id": program_id,
            "academic_year": offering.academic_year,
            "semester_id": offering.semester_id,
            "semester": _normalize_semester_name(offering.semester.name) if offering.semester else None,
            "study_level": study_level,
            "course_code": course.code if course else None,
            "course_name": course.name if course else None,
            "label": f"{course.code} — {course.name}" if course else f"Offering {offering.id}",
        })

    return {
        "faculties": sorted(faculties.values(), key=lambda item: item["name"]),
        "programs": sorted(programs.values(), key=lambda item: item["name"]),
        "academic_years": sorted(academic_years),
        "semesters": sorted(semesters),
        "study_levels": sorted(study_levels),
        "programStudyLevels": sorted(program_study_levels.values(), key=lambda item: item["label"]),
        "academicYearSemesters": sorted(academic_year_semesters.values(), key=lambda item: item["label"]),
        "courses": sorted(courses, key=lambda item: (item.get("course_code") or "", item["course_offering_id"])),
    }


@router.get("/teacher/filters")
def teacher_shared_filters(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    return teacher_material_filters(current_user, db)


@router.get("/teacher/materials/courses")
def teacher_material_courses(
    faculty_id: int,
    program_id: int,
    study_level: str,
    semester_id: int,
    academic_year: str | None = None,
    academic_year_id: int | None = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    offerings = db.query(Offering).filter(
        Offering.instructor_id == teacher.id,
        Offering.program_id == program_id,
        Offering.semester_id == semester_id,
        Offering.status == "active",
    ).all()
    result = []
    for offering in offerings:
        faculty = _faculty_for_offering(offering, db)
        if (faculty.id if faculty else None) != faculty_id:
            continue
        if _study_level(offering) != study_level:
            continue
        if academic_year and (offering.academic_period or offering.academic_year) != academic_year:
            continue
        result.append({
            "teacher_course_assignment_id": offering.id,
            "course_offering_id": offering.id,
            "course_id": offering.course_id,
            "course_code": offering.course.code if offering.course else None,
            "course_name": offering.course.name if offering.course else None,
            "group_name": offering.group_name,
            "label": f"{offering.course.code} — {offering.course.name}" if offering.course else f"Offering {offering.id}",
        })
    return result


@router.get("/teacher/courses")
def teacher_shared_courses(
    faculty_id: Optional[int] = None,
    program_id: Optional[int] = None,
    study_level: Optional[str] = None,
    semester_id: Optional[int] = None,
    academic_year: str | None = None,
    academic_year_id: int | None = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    if not (faculty_id and program_id and study_level and semester_id):
        teacher = _teacher_for_user(current_user, db)
        return [{
            "teacher_course_assignment_id": offering.id,
            "course_offering_id": offering.id,
            "course_id": offering.course_id,
            "course_code": offering.course.code if offering.course else None,
            "course_name": offering.course.name if offering.course else None,
            "faculty_id": (_faculty_for_offering(offering, db).id if _faculty_for_offering(offering, db) else None),
            "program_id": offering.program_id,
            "semester_id": offering.semester_id,
            "academic_year": offering.academic_period or offering.academic_year,
            "study_level": _study_level(offering),
            "group_name": offering.group_name,
            "label": f"{offering.course.code} - {offering.course.name}" if offering.course else f"Offering {offering.id}",
        } for offering in db.query(Offering).filter(Offering.instructor_id == teacher.id, Offering.status == "active").all()]
    return teacher_material_courses(faculty_id, program_id, study_level, semester_id, academic_year, academic_year_id, current_user, db)


@router.get("/teacher/course-detail/{course_id}")
def teacher_course_detail(course_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == course_id, Offering.instructor_id == teacher.id).first()
    if not offering:
        offering = db.query(Offering).filter(Offering.course_id == course_id, Offering.instructor_id == teacher.id, Offering.status == "active").first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course not found")
    faculty = _faculty_for_offering(offering, db)
    return {
        "course_offering_id": offering.id,
        "course_id": offering.course_id,
        "course_code": offering.course.code if offering.course else None,
        "course_name": offering.course.name if offering.course else None,
        "faculty_id": faculty.id if faculty else None,
        "faculty_name": faculty.name if faculty else None,
        "program_id": offering.program_id,
        "program_name": offering.program.name if offering.program else None,
        "study_level": _study_level(offering),
        "academic_year": offering.academic_period or offering.academic_year,
        "semester_id": offering.semester_id,
        "semester": offering.semester.name if offering.semester else None,
    }


@router.get("/teacher/course-sessions")
def teacher_course_sessions(
    course_id: Optional[int] = None,
    week_id: Optional[int] = None,
    courseId: Optional[int] = None,
    weekId: Optional[int] = None,
    faculty_id: Optional[int] = None,
    facultyId: Optional[int] = None,
    program_id: Optional[int] = None,
    programId: Optional[int] = None,
    study_level: Optional[str] = None,
    studyLevelId: Optional[int] = None,
    semester_id: Optional[int] = None,
    semesterId: Optional[int] = None,
    academic_year: Optional[str] = None,
    academic_year_id: Optional[int] = None,
    academicYearId: Optional[int] = None,
    date: Optional[date] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    course_id = course_id or courseId
    week_id = week_id or weekId
    faculty_id = faculty_id or facultyId
    program_id = program_id or programId
    semester_id = semester_id or semesterId
    if not course_id:
        raise HTTPException(status_code=400, detail="courseId is required")
    q = db.query(Offering).filter(Offering.instructor_id == teacher.id, Offering.course_id == course_id, Offering.status == "active")
    if program_id:
        q = q.filter(Offering.program_id == program_id)
    if semester_id:
        q = q.filter(Offering.semester_id == semester_id)
    offerings = q.all()
    for offering in offerings:
        faculty = _faculty_for_offering(offering, db)
        if faculty_id and (faculty.id if faculty else None) != faculty_id:
            continue
        if study_level and _study_level(offering) != study_level:
            continue
        if academic_year and (offering.academic_period or offering.academic_year) != academic_year:
            continue
    sessions = _sync_class_sessions(db, offering, teacher, week_id, date)
    groups = _primary_weekly_groups(_group_class_sessions(sessions))
    db.commit()
    return [_session_group_payload(group, weekly_topic=_weekly_topic_for_offering(db, group[0].course_offering_id, group[0].week_id)) for group in groups if (not week_id or group[0].week_id == week_id)]
    raise HTTPException(status_code=404, detail="No assigned course context found")


@router.get("/teacher/sessions")
def teacher_sessions_alias(
    facultyId: Optional[int] = None,
    programId: Optional[int] = None,
    studyLevelId: Optional[int] = None,
    academicYearId: Optional[int] = None,
    semesterId: Optional[int] = None,
    courseId: Optional[int] = None,
    weekId: Optional[int] = None,
    date: Optional[date] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    return teacher_course_sessions(courseId, weekId, None, None, facultyId, None, programId, None, None, studyLevelId, None, semesterId, None, None, academicYearId, date, current_user, db)


@router.get("/teacher/sessions/today")
def teacher_today_sessions(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    today = date.today()
    offerings = db.query(Offering).filter(Offering.instructor_id == teacher.id, Offering.status == "active").all()
    sessions: list[ClassSession] = []
    for offering in offerings:
        sessions.extend(_sync_class_sessions(db, offering, teacher, target_date=today))
    db.commit()
    return [
        _session_group_payload(group, students_count=len([reg for reg in group[0].offering.registrations if reg.status == "active"]))
        for group in _primary_weekly_groups(_group_class_sessions(sessions))
    ]


@router.patch("/teacher/sessions/{session_id}/topic")
def update_session_topic(session_id: int, body: dict, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    session = db.query(ClassSession).filter(ClassSession.id == session_id, ClassSession.teacher_id == teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    topic = (body.get("topic_title") or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    if session.session_date != date.today():
        raise HTTPException(status_code=403, detail="Topics can only be edited on the scheduled class day")
    group = [
        group
        for group in _group_class_sessions(db.query(ClassSession).filter(
            ClassSession.course_offering_id == session.course_offering_id,
            ClassSession.teacher_id == teacher.id,
            ClassSession.week_id == session.week_id,
            ClassSession.session_date == session.session_date,
        ).all())
        if any(item.id == session.id for item in group)
    ][0]
    weekly_topic = _weekly_topic_for_offering(db, session.course_offering_id, session.week_id)
    if not weekly_topic:
        weekly_topic = WeeklyTopic(
            course_offering_id=session.course_offering_id,
            course_id=session.course_id,
            teacher_id=teacher.id,
            week_number=session.week_id,
            topic_title=topic,
        )
        db.add(weekly_topic)
    else:
        weekly_topic.topic_title = topic
    for item in group:
        item.topic_title = topic
        item.topic_description = body.get("topic_description")
    db.commit()
    return _session_group_payload(group, weekly_topic=weekly_topic)


@router.patch("/teacher/sessions/{session_id}/start")
def start_session(session_id: int, body: dict, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    session = db.query(ClassSession).filter(ClassSession.id == session_id, ClassSession.teacher_id == teacher.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    if session.session_date != date.today():
        raise HTTPException(status_code=403, detail="Only today's class session can be started")
    group = [
        group
        for group in _group_class_sessions(db.query(ClassSession).filter(
            ClassSession.course_offering_id == session.course_offering_id,
            ClassSession.teacher_id == teacher.id,
            ClassSession.week_id == session.week_id,
            ClassSession.session_date == session.session_date,
        ).all())
        if any(item.id == session.id for item in group)
    ][0]
    existing_topic = _group_topic(group)
    requested_topic = (body.get("topic_title") or body.get("topic") or "").strip()
    if existing_topic and requested_topic and requested_topic != existing_topic:
        raise HTTPException(status_code=409, detail="A topic already exists for this teaching session.")
    if not existing_topic and not requested_topic:
        raise HTTPException(status_code=400, detail="Topic is required to start attendance.")
    weekly_topic = _weekly_topic_for_offering(db, session.course_offering_id, session.week_id)
    if weekly_topic and requested_topic and requested_topic != weekly_topic.topic_title:
        raise HTTPException(status_code=409, detail="A topic already exists for this course week.")
    topic = weekly_topic.topic_title if weekly_topic else existing_topic or requested_topic
    if not weekly_topic:
        weekly_topic = WeeklyTopic(
            course_offering_id=session.course_offering_id,
            course_id=session.course_id,
            teacher_id=teacher.id,
            week_number=session.week_id,
            topic_title=topic,
        )
        db.add(weekly_topic)
    for item in group:
        item.topic_title = topic
        item.status = "started"
    db.commit()
    return _session_group_payload(group, weekly_topic=weekly_topic)


@router.get("/teacher/materials/terms")
def teacher_material_terms(
    faculty_id: int,
    program_id: int,
    study_level: str,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    offerings = db.query(Offering).filter(
        Offering.instructor_id == teacher.id,
        Offering.program_id == program_id,
        Offering.status == "active",
    ).all()
    terms: dict[str, dict] = {}
    for offering in offerings:
        faculty = _faculty_for_offering(offering, db)
        if (faculty.id if faculty else None) != faculty_id:
            continue
        if _study_level(offering) != study_level:
            continue
        if not offering.semester_id or not offering.semester:
            continue
        academic_year_name = offering.academic_period or offering.academic_year or offering.semester.name
        key = f"{academic_year_name}_{offering.semester_id}"
        terms[key] = {
            "academic_year_id": None,
            "academic_year_name": academic_year_name,
            "semester_id": offering.semester_id,
            "semester_name": _normalize_semester_name(offering.semester.name),
            "label": f"{academic_year_name} · {_normalize_semester_name(offering.semester.name)}",
            "value": key,
        }
    ordered = sorted(terms.values(), key=lambda item: (item["academic_year_name"] or "", item["semester_name"] or ""), reverse=True)
    return {"terms": ordered}


@router.get("/teacher/materials/weeks")
def teacher_material_weeks(
    teacher_course_assignment_id: int,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    offering = _teacher_offering(teacher_course_assignment_id, teacher, db)
    return _semester_weeks(offering)


@router.get("/teacher/materials")
def teacher_materials(
    teacher_course_assignment_id: Optional[int] = None,
    week_id: Optional[int] = None,
    offering_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    degree_id: Optional[int] = None,
    program_id: Optional[int] = None,
    academic_year: Optional[str] = None,
    course_id: Optional[int] = None,
    week_number: Optional[int] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    _publish_due_materials(db)
    teacher = _teacher_for_user(current_user, db)
    if teacher_course_assignment_id and week_id:
        offering = _teacher_offering(teacher_course_assignment_id, teacher, db)
        _validate_week(week_id)
        sessions = _sync_class_sessions(db, offering, teacher, week_id)
        groups = _primary_weekly_groups(_group_class_sessions(sessions))
        materials = db.query(CourseMaterial).filter(
            CourseMaterial.offering_id == offering.id,
            CourseMaterial.week_number == week_id,
            CourseMaterial.deleted_at == None,
        ).all()
        by_session: dict[int, list[CourseMaterial]] = {}
        for material in materials:
            if material.class_session_id:
                by_session.setdefault(material.class_session_id, []).append(material)
        assignment_counts: dict[int, int] = {}
        assignments = db.query(Assignment).filter(
            Assignment.course_offering_id == offering.id,
            Assignment.week_number == week_id,
        ).all()
        for assignment in assignments:
            if assignment.class_session_id:
                assignment_counts[assignment.class_session_id] = assignment_counts.get(assignment.class_session_id, 0) + 1
        start, end = _week_range(offering, week_id)
        db.commit()
        weekly_topic = _weekly_topic_for_offering(db, offering.id, week_id)
        return {
            "week": {
                "id": week_id,
                "week_id": week_id,
                "week_number": week_id,
                "name": f"Week {week_id}",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            "days": [
                _session_group_payload(
                    group,
                    [material for session in group for material in by_session.get(session.id, [])],
                    sum(assignment_counts.get(session.id, 0) for session in group),
                    weekly_topic=weekly_topic,
                )
                for group in groups
            ],
        }
    q = db.query(CourseMaterial).join(Offering).filter(Offering.instructor_id == teacher.id)
    q = q.filter(CourseMaterial.deleted_at == None)
    if offering_id:
        q = q.filter(CourseMaterial.offering_id == offering_id)
    if course_id:
        q = q.filter(Offering.course_id == course_id)
    if faculty_id:
        department_ids = [row[0] for row in db.query(Department.id).filter(Department.faculty_id == faculty_id).all()]
        if department_ids:
            q = q.filter(Offering.course.has(Course.department_id.in_(department_ids)))
        else:
            q = q.filter(Offering.course.has(department_id=faculty_id))
    if week_number:
        _validate_week(week_number)
        q = q.filter(CourseMaterial.week_number == week_number)
    return [_decorate_material(m) for m in q.order_by(CourseMaterial.week_number, CourseMaterial.created_at.desc()).all()]


@router.get("/teacher/materials/{material_id}", response_model=CourseMaterialOut)
def teacher_material(material_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id, CourseMaterial.teacher_id == teacher.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return _decorate_material(material)


@router.get("/teacher/courses/{offering_id}/weeks/{week_number}/materials", response_model=WeekContentOut)
def teacher_week_content(offering_id: int, week_number: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    _validate_week(week_number)
    teacher = _teacher_for_user(current_user, db)
    _teacher_offering(offering_id, teacher, db)
    materials = db.query(CourseMaterial).filter(CourseMaterial.offering_id == offering_id, CourseMaterial.week_number == week_number).all()
    tasks = db.query(WeeklyTask).filter(WeeklyTask.offering_id == offering_id, WeeklyTask.week_number == week_number).all()
    return WeekContentOut(week_number=week_number, topic=_topic_for_week(db, offering_id, week_number), materials=[_decorate_material(m) for m in materials], tasks=[_decorate_task(t) for t in tasks])


@router.get("/teacher/course-offerings/{offering_id}/weeks/{week_number}/topic", response_model=Optional[WeeklyTopicOut])
def get_teacher_week_topic(offering_id: int, week_number: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    _validate_week(week_number)
    teacher = _teacher_for_user(current_user, db)
    _teacher_offering(offering_id, teacher, db)
    return _topic_for_week(db, offering_id, week_number)


@router.post("/teacher/course-offerings/{offering_id}/weeks/{week_number}/topic", response_model=WeeklyTopicOut, status_code=201)
def save_teacher_week_topic(offering_id: int, week_number: int, body: WeeklyTopicUpsert, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    _validate_week(week_number)
    teacher = _teacher_for_user(current_user, db)
    offering = _teacher_offering(offering_id, teacher, db)
    if not body.topic_title.strip():
        raise HTTPException(status_code=400, detail="Topic title is required")
    topic = _topic_for_week(db, offering_id, week_number)
    if topic:
        topic.topic_title = body.topic_title.strip()
        topic.topic_description = body.topic_description
    else:
        topic = WeeklyTopic(
            course_offering_id=offering.id,
            course_id=offering.course_id,
            teacher_id=teacher.id,
            week_number=week_number,
            topic_title=body.topic_title.strip(),
            topic_description=body.topic_description,
        )
        db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/teacher/weekly-topics/{topic_id}", response_model=WeeklyTopicOut)
def update_teacher_week_topic(topic_id: int, body: WeeklyTopicUpsert, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    topic = db.query(WeeklyTopic).filter(WeeklyTopic.id == topic_id, WeeklyTopic.teacher_id == teacher.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Weekly topic not found")
    if not body.topic_title.strip():
        raise HTTPException(status_code=400, detail="Topic title is required")
    topic.topic_title = body.topic_title.strip()
    topic.topic_description = body.topic_description
    db.commit()
    db.refresh(topic)
    return topic


@router.get("/teacher/course-offerings/{offering_id}/materials", response_model=List[CourseMaterialOut])
def teacher_course_offering_materials(
    offering_id: int,
    week_number: Optional[int] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    _teacher_offering(offering_id, teacher, db)
    q = db.query(CourseMaterial).filter(CourseMaterial.offering_id == offering_id)
    if week_number:
        _validate_week(week_number)
        q = q.filter(CourseMaterial.week_number == week_number)
    return [_decorate_material(m) for m in q.order_by(CourseMaterial.week_number, CourseMaterial.created_at.desc()).all()]


@router.post("/teacher/materials", response_model=CourseMaterialOut, status_code=201)
async def create_material(
    teacher_course_assignment_id: Optional[int] = Form(None),
    offering_id: Optional[int] = Form(None),
    week_id: Optional[int] = Form(None),
    class_session_id: Optional[int] = Form(None),
    course_week_topic_id: Optional[int] = Form(None),
    faculty_id: Optional[int] = Form(None),
    degree_id: Optional[int] = Form(None),
    program_id: Optional[int] = Form(None),
    academic_year: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    week_number: Optional[int] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    classwork_description: Optional[str] = Form(None),
    homework_description: Optional[str] = Form(None),
    material_kind: Optional[str] = Form(None),
    material_type: Optional[str] = Form(None),
    external_url: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    visibility_mode: str = Form("publish_now"),
    visibility_status: Optional[str] = Form(None),
    publish_at: Optional[str] = Form(None),
    scheduled_publish_at: Optional[str] = Form(None),
    is_visible_to_students: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    offering_id = teacher_course_assignment_id or offering_id
    week_number = week_id or week_number
    if not week_number:
        raise HTTPException(status_code=400, detail="week_id is required")
    _validate_week(week_number)
    if not title.strip():
        raise HTTPException(status_code=400, detail="Material title is required")
    material_kind = material_type or material_kind
    if material_kind not in {"file", "link", "video", "text"}:
        raise HTTPException(status_code=400, detail="Material must be file, link, video, or text")

    teacher = _teacher_for_user(current_user, db)
    offering = _resolve_teacher_offering(teacher, db, offering_id=offering_id, course_id=course_id)
    session = _validate_class_session(db, offering, teacher, week_number, class_session_id or course_week_topic_id)
    normalized_visibility = visibility_status or visibility_mode
    if normalized_visibility == "published":
        normalized_visibility = "publish_now"
    if normalized_visibility == "draft":
        status, visible_to_students, publish_at_dt, published_at_dt = "draft", False, None, None
    elif normalized_visibility == "hidden":
        status, visible_to_students, publish_at_dt, published_at_dt = "hidden", False, None, None
    else:
        status, visible_to_students, publish_at_dt, published_at_dt = _resolve_visibility(normalized_visibility, scheduled_publish_at or publish_at)
    file_path = None
    original_file_name = None
    file_mime_type = None
    file_size = None

    if material_kind == "link":
        external_url = link_url or external_url
        if not external_url:
            raise HTTPException(status_code=400, detail="External URL is required")
        _validate_external_url(external_url)
    elif material_kind == "video":
        if not video_url:
            raise HTTPException(status_code=400, detail="Video URL is required")
        _validate_external_url(video_url)
        external_url = video_url
    elif material_kind == "text":
        if not text_content or not text_content.strip():
            raise HTTPException(status_code=400, detail="Text content is required")
    else:
        if not file:
            raise HTTPException(status_code=400, detail="Uploaded file is required")
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only PDF, PPT, PPTX, images, and ZIP files are allowed")
        if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail="Only PDF, PPT, PPTX, images, and ZIP files are allowed")
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Uploaded file exceeds the 25MB limit")
        safe_name = f"{uuid4().hex}{ext}"
        folder = UPLOAD_ROOT / str(offering.course.department_id) / str(offering.course_id) / f"week-{week_number}"
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / safe_name
        destination.write_bytes(content)
        file_path = str(destination)
        external_url = f"/api/materials/p/{safe_name}"
        original_file_name = file.filename
        file_mime_type = file.content_type
        file_size = len(content)

    material = CourseMaterial(
        offering_id=offering.id,
        course_id=offering.course_id,
        teacher_id=teacher.id,
        week_number=week_number,
        class_session_id=session.id,
        course_week_topic_id=course_week_topic_id,
        title=title.strip(),
        description=description,
        classwork_description=classwork_description,
        homework_description=homework_description,
        weekly_topic_id=getattr(_topic_for_week(db, offering.id, week_number), "id", None),
        material_kind=material_kind,
        file_path=file_path,
        file_url=external_url if material_kind == "file" else None,
        external_url=external_url,
        link_url=link_url or (external_url if material_kind == "link" else None),
        video_url=video_url,
        text_content=text_content,
        original_file_name=original_file_name,
        file_mime_type=file_mime_type,
        file_size=file_size,
        status=status,
        publish_at=publish_at_dt,
        published_at=published_at_dt,
        is_visible_to_students=visible_to_students,
    )
    db.add(material)
    if visible_to_students:
        _notify_students(db, offering.id, "New weekly material", f"{offering.course.code} Week {week_number}: {title.strip()}")
    db.commit()
    db.refresh(material)
    return _decorate_material(material)


@router.post("/teacher/course-offerings/{offering_id}/materials", response_model=CourseMaterialOut, status_code=201)
async def create_course_offering_material(
    offering_id: int,
    week_number: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    classwork_description: Optional[str] = Form(None),
    homework_description: Optional[str] = Form(None),
    material_kind: str = Form(...),
    external_url: Optional[str] = Form(None),
    visibility_mode: str = Form("publish_now"),
    publish_at: Optional[str] = Form(None),
    is_visible_to_students: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    return await create_material(
        offering_id=offering_id,
        week_number=week_number,
        title=title,
        description=description,
        classwork_description=classwork_description,
        homework_description=homework_description,
        material_kind=material_kind,
        external_url=external_url,
        visibility_mode=visibility_mode,
        publish_at=publish_at,
        is_visible_to_students=is_visible_to_students,
        file=file,
        current_user=current_user,
        db=db,
    )


@router.put("/teacher/materials/{material_id}", response_model=CourseMaterialOut)
def update_material(material_id: int, body: CourseMaterialUpdate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id, CourseMaterial.teacher_id == teacher.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    data = body.model_dump(exclude_none=True)
    if "week_number" in data:
        _validate_week(data["week_number"])
    if "external_url" in data and data["external_url"]:
        _validate_external_url(data["external_url"])
    if "publish_at" in data and data["publish_at"]:
        publish_at = data["publish_at"]
        if publish_at.tzinfo:
            publish_at = publish_at.astimezone(timezone.utc).replace(tzinfo=None)
        data["publish_at"] = publish_at
        if publish_at <= _utc_now_naive():
            data["status"] = "published"
            data["is_visible_to_students"] = True
            data["published_at"] = _utc_now_naive()
    for field, value in data.items():
        setattr(material, field, value)
    db.commit()
    db.refresh(material)
    return _decorate_material(material)


@router.patch("/teacher/materials/{material_id}/visibility", response_model=CourseMaterialOut)
def update_material_visibility(material_id: int, body: dict, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id, CourseMaterial.teacher_id == teacher.id, CourseMaterial.deleted_at == None).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    status = body.get("visibility_status") or body.get("status")
    if status not in {"draft", "published", "scheduled", "hidden"}:
        raise HTTPException(status_code=400, detail="Invalid visibility status")
    material.status = status
    material.is_visible_to_students = status == "published"
    if status == "published":
        material.published_at = _utc_now_naive()
    if status == "scheduled" and body.get("scheduled_publish_at"):
        material.publish_at = _parse_publish_at(body.get("scheduled_publish_at"))
    db.commit()
    db.refresh(material)
    return _decorate_material(material)


@router.delete("/teacher/materials/{material_id}", status_code=204)
def delete_material(material_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id, CourseMaterial.teacher_id == teacher.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    material.deleted_at = _utc_now_naive()
    material.is_visible_to_students = False
    db.commit()


@router.get("/materials/{material_id}/view")
def view_material(material_id: int, current_user: User = Depends(require_roles("student", "instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    _publish_due_materials(db)
    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if canonical_role(current_user.role) == "student":
        _student_offering(material.offering_id, _student_for_user(current_user, db), db)
        if material.status != "published" or not material.is_visible_to_students:
            raise HTTPException(status_code=404, detail="Material not found")
    if canonical_role(current_user.role) == "instructor":
        teacher = _teacher_for_user(current_user, db)
        if material.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Not your material")
    if material.material_kind == "link":
        return RedirectResponse(material.external_url)
    if not material.file_path or not Path(material.file_path).exists():
        raise HTTPException(status_code=404, detail="Stored file not found")
    response = FileResponse(material.file_path, media_type=material.file_mime_type or "application/octet-stream", filename=material.original_file_name)
    filename = quote(material.original_file_name or "material")
    response.headers["content-disposition"] = f"inline; filename*=UTF-8''{filename}"
    return response


@router.get("/teacher/materials/{material_id}/view")
def teacher_view_material(material_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    return view_material(material_id, current_user, db)


@router.get("/materials/{material_id}/download")
def download_material(material_id: int, current_user: User = Depends(require_roles("student", "instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    response = view_material(material_id, current_user, db)
    if isinstance(response, FileResponse):
        response.headers["content-disposition"] = response.headers["content-disposition"].replace("inline", "attachment")
    return response


@router.get("/teacher/materials/{material_id}/download")
def teacher_download_material(material_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    return download_material(material_id, current_user, db)


@router.get("/student/materials", response_model=List[CourseMaterialOut])
def student_materials(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student_for_user(current_user, db)
    offering_ids = db.query(Registration.offering_id).filter(Registration.student_id == student.id, Registration.status == "active")
    materials = _student_visible_materials_query(db).filter(
        CourseMaterial.offering_id.in_(offering_ids),
    ).order_by(CourseMaterial.offering_id, CourseMaterial.week_number, CourseMaterial.created_at.desc()).all()
    return [_decorate_material(m) for m in materials]


@router.get("/student/courses/{offering_id}/materials", response_model=List[CourseMaterialOut])
def student_course_materials(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student_for_user(current_user, db)
    _student_offering(offering_id, student, db)
    materials = _student_visible_materials_query(db).filter(CourseMaterial.offering_id == offering_id).all()
    return [_decorate_material(m) for m in materials]


@router.get("/student/course-offerings/{offering_id}/materials", response_model=List[CourseMaterialOut])
def student_course_offering_materials(
    offering_id: int,
    week_number: Optional[int] = None,
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = _student_for_user(current_user, db)
    _student_offering(offering_id, student, db)
    q = _student_visible_materials_query(db).filter(CourseMaterial.offering_id == offering_id)
    if week_number:
        _validate_week(week_number)
        q = q.filter(CourseMaterial.week_number == week_number)
    return [_decorate_material(m) for m in q.order_by(CourseMaterial.week_number, CourseMaterial.created_at.desc()).all()]


@router.get("/student/courses/{offering_id}/weeks/{week_number}/materials", response_model=WeekContentOut)
def student_week_content(offering_id: int, week_number: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    _validate_week(week_number)
    student = _student_for_user(current_user, db)
    _student_offering(offering_id, student, db)
    materials = _student_visible_materials_query(db).filter(
        CourseMaterial.offering_id == offering_id,
        CourseMaterial.week_number == week_number,
    ).all()
    tasks = db.query(WeeklyTask).filter(
        WeeklyTask.offering_id == offering_id,
        WeeklyTask.week_number == week_number,
        WeeklyTask.is_visible_to_students == True,
    ).all()
    return WeekContentOut(week_number=week_number, topic=_topic_for_week(db, offering_id, week_number), materials=[_decorate_material(m) for m in materials], tasks=[_decorate_task(t) for t in tasks])


@router.get("/student/course-offerings/{offering_id}/weeks/{week_number}/topic", response_model=Optional[WeeklyTopicOut])
def get_student_week_topic(offering_id: int, week_number: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    _validate_week(week_number)
    student = _student_for_user(current_user, db)
    _student_offering(offering_id, student, db)
    return _topic_for_week(db, offering_id, week_number)


@router.get("/teacher/course-offerings/{offering_id}/assignments", response_model=List[AssignmentOut])
def teacher_assignments(
    offering_id: int,
    week_number: Optional[int] = None,
    class_session_id: Optional[int] = None,
    course_week_topic_id: Optional[int] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    _teacher_offering(offering_id, teacher, db)
    q = db.query(Assignment).filter(Assignment.course_offering_id == offering_id)
    if week_number:
        _validate_week(week_number)
        q = q.filter(Assignment.week_number == week_number)
    return [_decorate_assignment(db, item) for item in q.order_by(Assignment.week_number, Assignment.created_at.desc()).limit(1 if week_number else 100).all()]


@router.get("/teacher/assignments", response_model=List[AssignmentOut])
def teacher_assignments_alias(
    courseId: Optional[int] = None,
    weekId: Optional[int] = None,
    classSessionId: Optional[int] = None,
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    teacher = _teacher_for_user(current_user, db)
    q = db.query(Assignment).filter(Assignment.teacher_id == teacher.id)
    if courseId:
        q = q.filter(Assignment.course_id == courseId)
    if weekId:
        q = q.filter(Assignment.week_number == weekId)
    return [_decorate_assignment(db, item) for item in q.order_by(Assignment.week_number, Assignment.created_at.desc()).limit(1 if weekId else 100).all()]


@router.post("/teacher/course-offerings/{offering_id}/assignments", response_model=AssignmentOut, status_code=201)
async def create_assignment(
    offering_id: int,
    week_number: int = Form(...),
    class_session_id: Optional[int] = Form(None),
    course_week_topic_id: Optional[int] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    instructions: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    due_time: Optional[str] = Form(None),
    max_points: float = Form(100),
    visibility_mode: str = Form("publish_now"),
    publish_at: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    _validate_week(week_number)
    if not title.strip():
        raise HTTPException(status_code=400, detail="Assignment title is required")
    if max_points < 0 or max_points > 100:
        raise HTTPException(status_code=400, detail="Assignment max score must be between 0 and 100")
    teacher = _teacher_for_user(current_user, db)
    offering = _teacher_offering(offering_id, teacher, db)
    session = _validate_class_session(db, offering, teacher, week_number, class_session_id or course_week_topic_id)
    start_at = _parse_open_window(start_date, start_time, "Start")
    end_at = _parse_open_window(end_date, end_time, "End")
    if start_at and end_at and end_at < start_at:
        raise HTTPException(status_code=400, detail="End date/time cannot be before start date/time")
    status, visible_to_students, publish_at_dt, published_at_dt = _resolve_visibility(visibility_mode, publish_at)
    attachment_path = attachment_original_name = attachment_mime_type = None
    attachment_size = None
    if file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Uploaded file exceeds the 25MB limit")
        ext = Path(file.filename or "").suffix.lower()
        safe_name = f"{uuid4().hex}{ext}"
        folder = UPLOAD_ROOT / str(offering.course.department_id) / str(offering.course_id) / f"week-{week_number}" / "assignments"
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / safe_name
        destination.write_bytes(content)
        attachment_path = str(destination)
        attachment_original_name = file.filename
        attachment_mime_type = file.content_type
        attachment_size = len(content)
    assignment = _assignment_for_week(db, offering, teacher, week_number)
    is_new = assignment is None
    if not assignment:
        assignment = Assignment(
            course_offering_id=offering.id,
            course_id=offering.course_id,
            teacher_id=teacher.id,
            week_number=week_number,
        )
        db.add(assignment)
    assignment.weekly_topic_id = getattr(_topic_for_week(db, offering.id, week_number), "id", None)
    assignment.class_session_id = session.id
    assignment.course_week_topic_id = course_week_topic_id
    assignment.title = title.strip()
    assignment.description = description
    assignment.instructions = instructions
    assignment.start_at = start_at
    assignment.end_at = end_at
    assignment.due_date = end_at.date() if end_at else (datetime.fromisoformat(due_date).date() if due_date else None)
    assignment.due_time = end_at.time() if end_at else (datetime.strptime(due_time, "%H:%M").time() if due_time else None)
    assignment.max_points = 100
    if attachment_path:
        assignment.attachment_path = attachment_path
        assignment.attachment_original_name = attachment_original_name
        assignment.attachment_mime_type = attachment_mime_type
        assignment.attachment_size = attachment_size
    assignment.status = status
    assignment.is_visible_to_students = visible_to_students
    assignment.publish_at = publish_at_dt
    assignment.published_at = published_at_dt
    if visible_to_students:
        _notify_students(db, offering.id, "New assignment" if is_new else "Assignment updated", f"{offering.course.code} Week {week_number}: {title.strip()}")
    db.commit()
    db.refresh(assignment)
    return _decorate_assignment(db, assignment)


@router.post("/teacher/assignments", response_model=AssignmentOut, status_code=201)
async def create_assignment_alias(
    teacher_course_assignment_id: int = Form(...),
    week_id: int = Form(...),
    class_session_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    instructions: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    due_time: Optional[str] = Form(None),
    max_points: float = Form(100),
    visibility_mode: str = Form("publish_now"),
    publish_at: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    return await create_assignment(
        offering_id=teacher_course_assignment_id,
        week_number=week_id,
        class_session_id=class_session_id,
        title=title,
        description=description,
        instructions=instructions,
        start_date=start_date,
        start_time=start_time,
        end_date=end_date,
        end_time=end_time,
        due_date=due_date,
        due_time=due_time,
        max_points=max_points,
        visibility_mode=visibility_mode,
        publish_at=publish_at,
        file=file,
        current_user=current_user,
        db=db,
    )


@router.put("/teacher/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, body: AssignmentUpdate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.teacher_id == teacher.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    data = body.model_dump(exclude_none=True)
    if "week_number" in data:
        _validate_week(data["week_number"])
    if "max_points" in data and (data["max_points"] < 0 or data["max_points"] > 100):
        raise HTTPException(status_code=400, detail="Assignment max score must be between 0 and 100")
    for field, value in data.items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return _decorate_assignment(db, assignment)


@router.delete("/teacher/assignments/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.teacher_id == teacher.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()


@router.get("/student/course-offerings/{offering_id}/assignments", response_model=List[AssignmentOut])
def student_assignments(offering_id: int, week_number: Optional[int] = None, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = _student_for_user(current_user, db)
    _student_offering(offering_id, student, db)
    q = _student_visible_assignments_query(db).filter(Assignment.course_offering_id == offering_id)
    if week_number:
        _validate_week(week_number)
        q = q.filter(Assignment.week_number == week_number)
    output = []
    for item in q.order_by(Assignment.week_number, Assignment.created_at.desc()).all():
        decorated = _decorate_assignment(db, item)
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == item.id,
            AssignmentSubmission.student_id == student.id,
        ).first()
        if submission:
            decorated.my_submission = _decorate_submission(submission).model_dump(mode="json")
        output.append(decorated)
    return output


@router.post("/student/assignments/{assignment_id}/submission", response_model=AssignmentSubmissionOut, status_code=201)
async def submit_assignment(
    assignment_id: int,
    submitted_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = _student_for_user(current_user, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.status != "published" or not assignment.is_visible_to_students:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _student_offering(assignment.course_offering_id, student, db)
    if _deadline_passed(assignment):
        raise HTTPException(status_code=403, detail="Deadline passed. Late submission edits are not allowed.")
    if not (submitted_text and submitted_text.strip()) and not file:
        raise HTTPException(status_code=400, detail="Submission text or file is required")
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment.id,
        AssignmentSubmission.student_id == student.id,
    ).first()
    if not submission:
        submission = AssignmentSubmission(assignment_id=assignment.id, student_id=student.id)
        db.add(submission)
    elif submission.status == "graded":
        raise HTTPException(status_code=403, detail="Graded submissions cannot be edited")
    if submitted_text is not None:
        submission.submitted_text = submitted_text
    if file:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Uploaded file exceeds the 50MB limit")
        ext = Path(file.filename or "").suffix.lower()
        if ext and ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File type is not allowed")
        folder = UPLOAD_ROOT / str(assignment.course_id) / f"assignment-{assignment.id}" / "submissions"
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / f"{student.id}-{uuid4().hex}{ext}"
        destination.write_bytes(content)
        submission.submitted_file_path = str(destination)
        submission.submitted_file_original_name = file.filename
    submission.submitted_at = _utc_now_naive()
    submission.status = "submitted"
    submission.is_published = False
    _notify_user(
        db,
        assignment.teacher.user_id if assignment.teacher else None,
        "Assignment submitted",
        f"{student.first_name} {student.last_name} submitted {assignment.title}.",
        "info",
    )
    db.commit()
    db.refresh(submission)
    return _decorate_submission(submission)


@router.get("/teacher/assignments/{assignment_id}/submissions", response_model=List[AssignmentSubmissionOut])
def teacher_assignment_submissions(assignment_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.teacher_id == teacher.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    submissions = {
        item.student_id: item
        for item in db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()
    }
    students = [reg.student for reg in assignment.offering.registrations if reg.status == "active" and reg.student]
    return [
        _decorate_submission(submissions[student.id]) if student.id in submissions else _submission_placeholder(assignment, student)
        for student in students
    ]


@router.patch("/teacher/assignment-submissions/{submission_id}", response_model=AssignmentSubmissionOut)
def teacher_score_submission(submission_id: int, body: dict, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    submission = db.query(AssignmentSubmission).join(Assignment).filter(
        AssignmentSubmission.id == submission_id,
        Assignment.teacher_id == teacher.id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if "score" in body and body["score"] is not None:
        score = float(body["score"])
        max_points = float(submission.assignment.max_points or 100)
        if score < 0 or score > max_points or score > 100:
            raise HTTPException(status_code=400, detail="Score must be between 0 and the assignment max score, up to 100")
        submission.score = score
    if "feedback" in body:
        submission.feedback = body.get("feedback")
    if submission.score is not None or submission.feedback:
        submission.status = "graded"
        submission.is_published = True
    _notify_user(
        db,
        submission.student.user_id if submission.student else None,
        "Assignment feedback updated",
        f"Your submission for {submission.assignment.title} has feedback or a score.",
        "success",
    )
    db.commit()
    db.refresh(submission)
    return _decorate_submission(submission)


@router.patch("/teacher/assignments/{assignment_id}/submissions/{student_id}", response_model=AssignmentSubmissionOut)
def teacher_score_student_submission(assignment_id: int, student_id: int, body: dict, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.teacher_id == teacher.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    reg = db.query(Registration).filter(
        Registration.offering_id == assignment.course_offering_id,
        Registration.student_id == student_id,
        Registration.status == "active",
    ).first()
    if not reg or not reg.student:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student_id,
    ).first()
    if not submission:
        submission = AssignmentSubmission(assignment_id=assignment_id, student_id=student_id, status="not_submitted")
        db.add(submission)
    if "score" in body and body["score"] is not None:
        score = float(body["score"])
        max_points = float(assignment.max_points or 100)
        if score < 0 or score > max_points or score > 100:
            raise HTTPException(status_code=400, detail="Score must be between 0 and the assignment max score, up to 100")
        submission.score = score
    if "feedback" in body:
        submission.feedback = body.get("feedback")
    submission.status = "graded"
    submission.is_published = True
    _notify_user(
        db,
        reg.student.user_id,
        "Assignment grade published",
        f"Your assignment result for {assignment.title} has been published.",
        "success",
    )
    db.commit()
    db.refresh(submission)
    return _decorate_submission(submission)


@router.get("/teacher/assignment-submissions/{submission_id}/download")
def teacher_download_submission(submission_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    submission = db.query(AssignmentSubmission).join(Assignment).filter(
        AssignmentSubmission.id == submission_id,
        Assignment.teacher_id == teacher.id,
    ).first()
    if not submission or not submission.submitted_file_path:
        raise HTTPException(status_code=404, detail="Submitted file not found")
    path = Path(submission.submitted_file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Submitted file not found")
    return FileResponse(path, filename=submission.submitted_file_original_name or "submission")


@router.post("/teacher/tasks", response_model=WeeklyTaskOut, status_code=201)
def create_task(body: WeeklyTaskCreate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    _validate_week(body.week_number)
    teacher = _teacher_for_user(current_user, db)
    _teacher_offering(body.offering_id, teacher, db)
    task = WeeklyTask(teacher_id=teacher.id, **body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return _decorate_task(task)


@router.put("/teacher/tasks/{task_id}", response_model=WeeklyTaskOut)
def update_task(task_id: int, body: WeeklyTaskUpdate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    task = db.query(WeeklyTask).filter(WeeklyTask.id == task_id, WeeklyTask.teacher_id == teacher.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = body.model_dump(exclude_none=True)
    if "week_number" in data:
        _validate_week(data["week_number"])
    for field, value in data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return _decorate_task(task)


@router.delete("/teacher/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    teacher = _teacher_for_user(current_user, db)
    task = db.query(WeeklyTask).filter(WeeklyTask.id == task_id, WeeklyTask.teacher_id == teacher.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
