import re
from math import ceil
from typing import Iterable
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.attendance import AttendanceRecord, AttendanceSession
from src.models.course_material import CourseMaterial
from src.models.course_status import StudentCourseStatus
from src.models.grade import Grade
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.program import Program
from src.models.registration import Registration
from src.models.student import Student
from src.models.timetable import ClassSession, TimetableEntry
from src.models.user import User
from src.utils.security import require_roles

router = APIRouter(prefix="/api", tags=["Course Offerings"])

MIDTERM_MAX = 15
PROJECT_MAX = 15
QUIZ_MAX = 10
FINAL_EXAM_MAX = 60
ABSENCE_BLOCK_LIMIT = 15.0


class AttendanceBulkRecord(BaseModel):
    student_id: int
    status: str
    notes: str | None = None


class AttendanceBulkSave(BaseModel):
    attendance_date: date
    week_number: int | None = None
    records: list[AttendanceBulkRecord]


class GradeBulkRecord(BaseModel):
    student_id: int
    midterm_score: float | None = None
    project_score: float | None = None
    quiz_score: float | None = None
    final_exam_score: float | None = None
    feedback: str | None = None


class GradeBulkSave(BaseModel):
    grades: list[GradeBulkRecord]

DAY_NAMES = {
    "Mon": "Monday",
    "Tue": "Tuesday",
    "Wed": "Wednesday",
    "Thu": "Thursday",
    "Fri": "Friday",
    "Sat": "Saturday",
    "Sun": "Sunday",
}
WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def academic_year_for_semester(current_semester: int | None) -> str:
    if not current_semester:
        return "Academic Year"
    level = "Master" if current_semester > 8 else "Bachelor"
    year = max(1, ((current_semester - 1) // 2) + 1)
    if level == "Master":
        year = max(1, year - 4)
    return f"{level} Year {year}"


def parse_schedule(schedule: str | None, room: str | None = None) -> list[dict]:
    if not schedule:
        return []
    match = re.match(r"(?P<days>[A-Za-z/]+)\s+(?P<start>\d{1,2}:\d{2})-(?P<end>\d{1,2}:\d{2})", schedule.strip())
    if not match:
        return [{"day_of_week": "Scheduled", "start_time": schedule, "end_time": "", "room": room}]
    start = match.group("start")
    end = match.group("end")
    return [
        {"day_of_week": DAY_NAMES.get(day, day), "start_time": start, "end_time": end, "room": room}
        for day in match.group("days").split("/")
    ]


def timetable_for_offering(offering: Offering) -> list[dict]:
    return [
        timetable_group_payload(group, include_course_payload=False)
        for group in group_timetable_entries_for_display(list(offering.timetable_entries), include_date=False)
    ]


def weeks_summary_for_offering(offering: Offering, db: Session | None = None) -> dict:
    today = date.today()
    semester = offering.semester
    total = int(getattr(semester, "total_weeks", None) or 14)

    if db:
        tracked_weeks = {
            int(row[0])
            for row in db.query(AttendanceSession.week_number).filter(
                AttendanceSession.offering_id == offering.id,
                AttendanceSession.week_number.isnot(None),
                AttendanceSession.session_date <= today,
            ).distinct().all()
            if row[0] and 1 <= int(row[0]) <= total
        }
        tracked_weeks.update({
            int(row[0])
            for row in db.query(AttendanceRecord.week_number).filter(
                AttendanceRecord.course_offering_id == offering.id,
                AttendanceRecord.week_number.isnot(None),
                AttendanceRecord.attendance_date <= today,
            ).distinct().all()
            if row[0] and 1 <= int(row[0]) <= total
        })
        tracked_weeks.update({
            int(row[0])
            for row in db.query(ClassSession.week_id).filter(
                ClassSession.course_offering_id == offering.id,
                ClassSession.week_id.isnot(None),
                ClassSession.session_date <= today,
                ClassSession.status.in_(("started", "completed")),
            ).distinct().all()
            if row[0] and 1 <= int(row[0]) <= total
        })
        if tracked_weeks:
            completed = min(total, max(tracked_weeks))
            percentage = round((completed / total) * 100) if total else 0
            return {
                "completedWeeks": completed,
                "totalWeeks": total,
                "weekProgressPercentage": percentage,
                "weeksProgressPercentage": percentage,
            }

    if not semester or not semester.start_date:
        dated_entries = [entry for entry in offering.timetable_entries if entry.timetable_date]
        if not dated_entries:
            return {"completedWeeks": 0, "totalWeeks": total, "weekProgressPercentage": 0, "weeksProgressPercentage": 0}
        semester_start = min(entry.timetable_date for entry in dated_entries)
        semester_end = max(entry.timetable_date for entry in dated_entries)
    else:
        semester_start = semester.start_date
        semester_end = semester.end_date
    if today < semester_start:
        completed = 0
    elif semester_end and today > semester_end:
        completed = total
    else:
        completed = max(0, min(total, (today - semester_start).days // 7))
    percentage = round((completed / total) * 100) if total else 0
    return {
        "completedWeeks": completed,
        "totalWeeks": total,
        "weekProgressPercentage": percentage,
        "weeksProgressPercentage": percentage,
    }


def primary_room(schedule: Iterable[dict], fallback: str | None = None) -> str | None:
    for item in schedule:
        room_name = item.get("room_name") or item.get("classroom_name") or item.get("lab_name") or item.get("auditorium_name") or item.get("room")
        building = item.get("building_code")
        if building and room_name:
            return f"{building} / {room_name}"
        if room_name:
            return room_name
    return fallback


def summarize_schedule(schedule: Iterable[dict]) -> str:
    items = list(schedule)
    if not items:
        return "Schedule pending"
    seen = set()
    lines = []
    for item in sorted(items, key=lambda row: (WEEK_DAYS.index(row["day_of_week"]) if row["day_of_week"] in WEEK_DAYS else 7, row["start_time"])):
        key = (item["day_of_week"], item["start_time"], item["end_time"], item.get("building_code"), item.get("room_name") or item.get("room"))
        if key in seen:
            continue
        seen.add(key)
        room = f" {item.get('building_code')} / {item.get('room_name')}" if item.get("building_code") and item.get("room_name") else ""
        lines.append(f"{item['day_of_week']} {item['start_time']}-{item['end_time']}{room}")
    return "\n".join(lines)


def offering_payload(offering: Offering, program: Program | None = None, academic_year: str | None = None, include_schedule: bool = True, db: Session | None = None) -> dict:
    course = offering.course
    department = course.department if course else None
    faculty = department.faculty if department else None
    semester = offering.semester
    schedule = timetable_for_offering(offering) if include_schedule else []
    active_regs = [reg for reg in offering.registrations if reg.status == "active"]
    program = program or offering.program
    academic_year = academic_year or offering.academic_year or "Academic year not set"
    weeks_summary = weeks_summary_for_offering(offering, db)
    enrollment_percentage = round((len(active_regs) / offering.capacity) * 100) if offering.capacity else 0
    room_label = primary_room(schedule, offering.room)
    study_level = academic_year.split(" Year ")[0] if " Year " in academic_year else None
    return {
        "id": offering.id,
        "course_offering_id": offering.id,
        "courseId": offering.course_id,
        "course_id": offering.course_id,
        "courseCode": course.code if course else f"#{offering.course_id}",
        "course_code": course.code if course else f"#{offering.course_id}",
        "courseName": course.name if course else "Course",
        "course_name": course.name if course else "Course",
        "teacher_name": instructor_display_name(offering.instructor),
        "credits": course.credits if course else None,
        "faculty": faculty.name if faculty else (department.name if department else "Faculty"),
        "faculty_id": faculty.id if faculty else (department.id if department else None),
        "faculty_name": faculty.name if faculty else (department.name if department else "Faculty"),
        "degree_id": program.id if program else None,
        "degree_name": program.name if program else "Program",
        "program_id": program.id if program else None,
        "program": program.name if program else "Program",
        "program_name": program.name if program else "Program",
        "studyLevel": study_level,
        "year": academic_year,
        "academic_year": academic_year,
        "group_id": offering.id,
        "section": offering.group_name or "Group not set",
        "group_name": offering.group_name or "Group not set",
        "semester": semester.name if semester else None,
        "academic_period": offering.academic_period or (semester.name if semester else None),
        "enrolledStudents": len(active_regs),
        "student_count": len(active_regs),
        "maxStudents": offering.capacity,
        "student_capacity": offering.capacity,
        "enrollmentPercentage": enrollment_percentage,
        "status": offering.status,
        "room": room_label,
        "schedule": schedule,
        "schedule_summary": summarize_schedule(schedule),
        **weeks_summary,
    }


def instructor_for_user(user: User, db: Session) -> Instructor:
    instructor = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return instructor


def student_for_user(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def instructor_display_name(instructor: Instructor | None) -> str:
    if not instructor:
        return "Instructor"
    prefix = f"{instructor.title} " if instructor.title else ""
    return f"{prefix}{instructor.first_name} {instructor.last_name}".strip()


def semester_label(value: str | None) -> str | None:
    if not value:
        return None
    lowered = value.lower()
    if "spring" in lowered:
        return "Spring"
    if "winter" in lowered or "fall" in lowered or "autumn" in lowered:
        return "Winter"
    return value


def get_current_week_range(reference_date: date | None = None) -> dict:
    current = reference_date or date.today()
    start = current - timedelta(days=current.weekday())
    end = start + timedelta(days=6)
    if start.year == end.year:
        label = f"{start.day} {MONTH_NAMES[start.month - 1]} – {end.day} {MONTH_NAMES[end.month - 1]} {end.year}"
    else:
        label = f"{start.day} {MONTH_NAMES[start.month - 1]} {start.year} – {end.day} {MONTH_NAMES[end.month - 1]} {end.year}"
    return {"start_date": start, "end_date": end, "label": label}


def date_for_weekday(week_start: date, day_name: str) -> date | None:
    try:
        return week_start + timedelta(days=WEEK_DAYS.index(day_name))
    except ValueError:
        return None


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def teaching_hours_for_entry(entry: TimetableEntry) -> int | None:
    if entry.teaching_hours:
        return entry.teaching_hours
    start = parse_time(entry.start_time)
    end = parse_time(entry.end_time)
    if not start or not end:
        return None
    minutes = max(1, int((end - start).total_seconds() // 60))
    return max(1, ceil(minutes / 50))


def _minutes(value: str | None) -> int | None:
    parsed = parse_time(value)
    if not parsed:
        return None
    return parsed.hour * 60 + parsed.minute


def _room_key(entry: TimetableEntry) -> int | str | None:
    return entry.room_id or entry.classroom_id or entry.lab_id or entry.room


def _continuous(prev: TimetableEntry, current: TimetableEntry) -> bool:
    prev_end = _minutes(prev.end_time)
    current_start = _minutes(current.start_time)
    if prev_end is None or current_start is None:
        return False
    return 0 <= current_start - prev_end <= 15


def group_timetable_entries(entries: list[TimetableEntry]) -> list[list[TimetableEntry]]:
    buckets: dict[tuple, list[TimetableEntry]] = {}
    for entry in entries:
        if not entry.offering:
            continue
        key = (
            entry.offering.instructor_id,
            entry.offering.course_id,
            entry.timetable_date,
            entry.day_of_week,
            entry.building_id,
            _room_key(entry),
        )
        buckets.setdefault(key, []).append(entry)

    groups: list[list[TimetableEntry]] = []
    for bucket in buckets.values():
        ordered = sorted(bucket, key=lambda item: (item.start_time or "", item.end_time or ""))
        current_group: list[TimetableEntry] = []
        for entry in ordered:
            if not current_group or _continuous(current_group[-1], entry):
                current_group.append(entry)
            else:
                groups.append(current_group)
                current_group = [entry]
        if current_group:
            groups.append(current_group)
    return sorted(groups, key=lambda group: (group[0].timetable_date or date.min, group[0].day_of_week, group[0].start_time))


def group_timetable_entries_for_display(entries: list[TimetableEntry], include_date: bool = True) -> list[list[TimetableEntry]]:
    buckets: dict[tuple, list[TimetableEntry]] = {}
    for entry in entries:
        if not entry.offering:
            continue
        key = (
            entry.offering.instructor_id,
            entry.offering.course_id,
            entry.offering.course.code if entry.offering.course else None,
            entry.offering.course.name if entry.offering.course else None,
            entry.timetable_date if include_date else None,
            entry.day_of_week,
            entry.building_id,
            _room_key(entry),
            entry.offering.semester_id,
            entry.offering.academic_year,
            entry.offering.program_id,
        )
        buckets.setdefault(key, []).append(entry)
    groups: list[list[TimetableEntry]] = []
    for bucket in buckets.values():
        ordered = sorted(bucket, key=lambda item: (item.start_time or "", item.end_time or ""))
        current_group: list[TimetableEntry] = []
        for entry in ordered:
            if not current_group or _continuous(current_group[-1], entry):
                current_group.append(entry)
            else:
                groups.append(current_group)
                current_group = [entry]
        if current_group:
            groups.append(current_group)
    return sorted(groups, key=lambda group: (group[0].timetable_date or date.min, group[0].day_of_week, group[0].start_time))


def room_without_prefix(room: str | None) -> str | None:
    if not room:
        return None
    return re.sub(r"^(Room|Classroom|Lab)\s+", "", room.strip(), flags=re.IGNORECASE)


def building_code_from_room(room: str | None) -> str | None:
    value = room_without_prefix(room)
    if not value:
        return None
    match = re.match(r"([A-Za-z]+)", value)
    return match.group(1).upper() if match else None


def lab_name_from_room(room: str | None) -> str | None:
    if room and room.lower().strip().startswith("lab"):
        return room_without_prefix(room)
    return None


def classroom_name_from_room(room: str | None) -> str | None:
    if room and room.lower().strip().startswith("lab"):
        return None
    return room_without_prefix(room)


def room_name_for_type(entry: TimetableEntry, room_type: str) -> str | None:
    room = entry.room_resource or entry.classroom or entry.lab
    actual_type = entry.room_type or (room.room_type if room else None)
    if actual_type == room_type and room:
        return room.name
    if room_type == "lab" and entry.lab:
        return entry.lab.name
    if room_type == "classroom" and entry.classroom and entry.classroom.room_type == "classroom":
        return entry.classroom.name
    if not room and room_type == "classroom":
        return classroom_name_from_room(entry.room)
    if not room and room_type == "lab":
        return lab_name_from_room(entry.room)
    return None


def timetable_group_payload(group: list[TimetableEntry], include_course_payload: bool = True) -> dict:
    entry = group[0]
    offering = entry.offering
    payload = offering_payload(offering, include_schedule=False) if include_course_payload else {}
    start_time = min(item.start_time for item in group)
    end_time = max(item.end_time for item in group)
    teaching_hours = sum(teaching_hours_for_entry(item) or 0 for item in group) or teaching_hours_for_entry(entry)
    room = entry.room_resource or entry.classroom or entry.lab
    room_name = room.name if room else entry.room
    room_type = entry.room_type or (room.room_type if room else None)
    ordered_sessions = sorted(group, key=lambda item: (item.start_time or "", item.end_time or ""))
    return {
        **payload,
        "id": entry.id,
        "timetable_entry_id": entry.id,
        "timetable_entry_ids": [item.id for item in group],
        "subject_id": offering.course_id if offering else entry.course_offering_id,
        "subject_code": offering.course.code if offering and offering.course else payload.get("course_code"),
        "subject_name": offering.course.name if offering and offering.course else payload.get("course_name"),
        "academic_year": offering.academic_year if offering else payload.get("academic_year"),
        "semester": offering.semester.name if offering and offering.semester else payload.get("semester"),
        "degree": offering.academic_year.split(" Year ")[0] if offering and offering.academic_year and " Year " in offering.academic_year else None,
        "program": offering.program.name if offering and offering.program else payload.get("program_name"),
        "day_of_week": entry.day_of_week,
        "day": entry.day_of_week,
        "timetable_date": entry.timetable_date.isoformat() if entry.timetable_date else None,
        "date": entry.timetable_date.isoformat() if entry.timetable_date else None,
        "start_time": start_time,
        "end_time": end_time,
        "display_start_time": start_time,
        "display_end_time": end_time,
        "teaching_hours": teaching_hours,
        "group_name": entry.group.name if entry.group else (offering.group_name if offering else payload.get("group_name")),
        "building_code": entry.building.code if entry.building else building_code_from_room(entry.room or (offering.room if offering else None)),
        "building_id": entry.building_id,
        "room_id": _room_key(entry),
        "room_name": room_name,
        "room_type": room_type,
        "classroom_name": room_name_for_type(entry, "classroom"),
        "lab_name": room_name_for_type(entry, "lab"),
        "auditorium_name": room_name_for_type(entry, "auditorium"),
        "room": entry.room,
        "sessions": [
            {
                "session_id": item.id,
                "timetable_entry_id": item.id,
                "start_time": item.start_time,
                "end_time": item.end_time,
            }
            for item in ordered_sessions
        ],
    }


def timetable_entry_payload(entry: TimetableEntry) -> dict:
    return timetable_group_payload([entry])


def next_timetable_entry(entries: list[TimetableEntry]) -> TimetableEntry | None:
    if not entries:
        return None
    now = datetime.now()
    today_index = now.weekday()
    current_time = now.strftime("%H:%M")

    def sort_key(entry: TimetableEntry):
        try:
            day_index = WEEK_DAYS.index(entry.day_of_week)
        except ValueError:
            day_index = 7
        days_ahead = (day_index - today_index) % 7
        if days_ahead == 0 and entry.start_time < current_time:
            days_ahead = 7
        return (days_ahead, entry.start_time)

    return sorted(entries, key=sort_key)[0]


def timetable_group_start_datetime(group: list[TimetableEntry], now: datetime | None = None) -> datetime | None:
    now = now or datetime.now()
    entry = group[0]
    start_time = min(item.start_time for item in group)
    end_time = max(item.end_time for item in group)
    start = parse_time(start_time)
    end = parse_time(end_time)
    if not start or not end:
        return None

    if entry.timetable_date:
        starts_at = datetime.combine(entry.timetable_date, start.time())
        ends_at = datetime.combine(entry.timetable_date, end.time())
        return starts_at if ends_at >= now else None

    try:
        day_index = WEEK_DAYS.index(entry.day_of_week)
    except ValueError:
        return None

    days_ahead = (day_index - now.weekday()) % 7
    occurrence_date = date.today() + timedelta(days=days_ahead)
    starts_at = datetime.combine(occurrence_date, start.time())
    ends_at = datetime.combine(occurrence_date, end.time())
    if ends_at < now:
        occurrence_date = occurrence_date + timedelta(days=7)
        starts_at = datetime.combine(occurrence_date, start.time())

    semester = entry.offering.semester if entry.offering else None
    if semester:
        if occurrence_date < semester.start_date:
            weeks_until_start = max(0, (semester.start_date - occurrence_date).days // 7)
            occurrence_date = occurrence_date + timedelta(days=weeks_until_start * 7)
            while occurrence_date < semester.start_date:
                occurrence_date = occurrence_date + timedelta(days=7)
            starts_at = datetime.combine(occurrence_date, start.time())
        if occurrence_date > semester.end_date:
            return None

    return starts_at


def next_timetable_group(entries: list[TimetableEntry]) -> list[TimetableEntry] | None:
    groups = group_timetable_entries(entries)
    if not groups:
        return None
    now = datetime.now()
    upcoming = [(starts_at, group) for group in groups if (starts_at := timetable_group_start_datetime(group, now)) is not None]
    if not upcoming:
        return None
    return min(upcoming, key=lambda item: item[0])[1]


def entry_occurs_in_week(entry: TimetableEntry, week_start: date, week_end: date) -> bool:
    if entry.timetable_date:
        return week_start <= entry.timetable_date <= week_end
    return entry.day_of_week in WEEK_DAYS


def weekly_timetable_payload(entries: list[TimetableEntry], week_start: date, week_end: date) -> list[dict]:
    result = []
    for day in WEEK_DAYS:
        day_date = date_for_weekday(week_start, day)
        day_entries = sorted(
            [
                entry for entry in entries
                if entry_occurs_in_week(entry, week_start, week_end)
                and ((entry.timetable_date == day_date) if entry.timetable_date else entry.day_of_week == day)
            ],
            key=lambda item: item.start_time,
        )
        result.append({
            "day_of_week": day,
            "date": day_date.isoformat() if day_date else None,
            "is_today": day_date == date.today(),
            "entries": [timetable_group_payload(group) for group in group_timetable_entries_for_display(day_entries)],
        })
    return result


def grade_payload(grade: Grade | None) -> dict | None:
    if not grade:
        return None
    return {
        "id": grade.id,
        "registration_id": grade.registration_id,
        "midterm_score": float(grade.midterm_score) if grade.midterm_score is not None else None,
        "project_score": float(grade.project_score) if grade.project_score is not None else None,
        "quiz_score": float(grade.quiz_score) if grade.quiz_score is not None else None,
        "final_exam_score": float(grade.final_exam_score) if grade.final_exam_score is not None else None,
        "total_score": float(grade.total_score) if grade.total_score is not None else None,
        "final_grade": grade.final_grade,
        "pass_status": grade.pass_status,
        "exam_blocked_due_to_absence": bool(grade.exam_blocked_due_to_absence),
        "absence_percentage": float(grade.absence_percentage) if grade.absence_percentage is not None else None,
        "can_take_exam": not bool(grade.exam_blocked_due_to_absence),
        "failure_reason": grade.failure_reason,
        "retake_allowed_next_academic_year": bool(grade.retake_allowed_next_academic_year),
        "feedback": grade.feedback,
    }


def absence_eligibility(db: Session, student_id: int, offering_id: int) -> dict:
    today = date.today()
    occurred_entries = db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id == offering_id,
        TimetableEntry.timetable_date.isnot(None),
        TimetableEntry.timetable_date <= today,
    ).all()
    if occurred_entries:
        total_sessions = len(occurred_entries)
        entry_ids = [entry.id for entry in occurred_entries]
        absent_sessions = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.course_offering_id == offering_id,
            AttendanceRecord.timetable_entry_id.in_(entry_ids),
            AttendanceRecord.status == "absent",
        ).count()
    else:
        total_sessions = db.query(AttendanceSession).filter(
            AttendanceSession.offering_id == offering_id,
            AttendanceSession.session_date <= today,
        ).count()
        absent_sessions = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceSession.offering_id == offering_id,
            AttendanceSession.session_date <= today,
            AttendanceRecord.status == "absent",
        ).count()
    percentage = round((absent_sessions / total_sessions) * 100, 2) if total_sessions else 0.0
    blocked = percentage > ABSENCE_BLOCK_LIMIT
    return {
        "absence_percentage": percentage,
        "total_occurred_sessions": total_sessions,
        "absent_sessions": absent_sessions,
        "can_take_exam": not blocked,
        "exam_blocked_due_to_absence": blocked,
        "blocked_reason": "Absences over 15%" if blocked else None,
        "retake_allowed_next_academic_year": blocked,
    }


def apply_absence_block(grade: Grade, eligibility: dict):
    grade.absence_percentage = eligibility["absence_percentage"]
    grade.exam_blocked_due_to_absence = eligibility["exam_blocked_due_to_absence"]
    if eligibility["exam_blocked_due_to_absence"]:
        grade.final_exam_score = None
        grade.total_score = 4
        grade.final_grade = 4
        grade.pass_status = "failed"
        grade.letter_grade = "F"
        grade.failure_reason = "Absences over 15%"
        grade.retake_allowed_next_academic_year = True


def student_attendance_payload(record: AttendanceRecord) -> dict:
    offering = record.session.offering if record.session else None
    entry = record.timetable_entry
    attendance_date = record.attendance_date or (record.session.session_date if record.session else None)
    return {
        "id": record.id,
        "course_offering_id": record.course_offering_id or (offering.id if offering else None),
        "course_code": offering.course.code if offering and offering.course else None,
        "course_name": offering.course.name if offering and offering.course else None,
        "week_number": record.week_number or (record.session.week_number if record.session else None),
        "attendance_date": attendance_date.isoformat() if attendance_date else None,
        "session_date": attendance_date.isoformat() if attendance_date else None,
        "start_time": record.start_time or (entry.start_time if entry else None),
        "end_time": record.end_time or (entry.end_time if entry else None),
        "building_code": entry.building.code if entry and entry.building else None,
        "classroom_name": room_name_for_type(entry, "classroom") if entry else None,
        "lab_name": room_name_for_type(entry, "lab") if entry else None,
        "auditorium_name": room_name_for_type(entry, "auditorium") if entry else None,
        "status": record.status,
        "notes": record.notes,
    }


def calculate_progression(student: Student, db: Session) -> dict:
    degree_level = student.degree_level or ("Master" if student.current_semester > 6 else "Bachelor")
    rows = db.query(Grade, Offering).join(Offering, Offering.id == Grade.course_offering_id).filter(
        Grade.student_id == student.id,
        ((Grade.final_grade >= 5) | (Grade.pass_status == "passed")),
    ).all()
    total_passed_credits = sum((offering.course.credits if offering.course else 0) for _, offering in rows)
    current_year = student.academic_year or academic_year_for_semester(student.current_semester)
    is_master = degree_level.lower() == "master"
    graduation_required = 120 if is_master else 180
    if is_master:
        required_next = 40 if "Year 1" in current_year else graduation_required
        can_progress = "Year 1" in current_year and total_passed_credits >= required_next
    else:
        if "Year 1" in current_year:
            required_next = 31
        elif "Year 2" in current_year:
            required_next = 90
        else:
            required_next = graduation_required
        can_progress = "Year 3" not in current_year and total_passed_credits >= required_next
    graduation_eligible = total_passed_credits >= graduation_required
    if graduation_eligible:
        message = f"Eligible for {degree_level} graduation."
    elif can_progress:
        message = "Eligible to progress to the next academic year."
    else:
        message = f"Needs {max(0, required_next - total_passed_credits)} more passed credits for the next milestone."
    return {
        "degree_level": degree_level,
        "current_academic_year": current_year,
        "total_passed_credits": total_passed_credits,
        "required_for_next_year": required_next,
        "can_progress_to_next_year": can_progress,
        "graduation_required_credits": graduation_required,
        "graduation_eligible": graduation_eligible,
        "message": message,
    }


@router.get("/teacher/my-courses")
def teacher_my_courses(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offerings = db.query(Offering).filter(Offering.instructor_id == instructor.id).all()
    return {"success": True, "data": [offering_payload(offering, db=db) for offering in offerings]}


@router.get("/teacher/dashboard")
def teacher_dashboard(
    week_start: date | None = Query(None),
    week_end: date | None = Query(None),
    current_user: User = Depends(require_roles("instructor")),
    db: Session = Depends(get_db),
):
    instructor = instructor_for_user(current_user, db)
    offerings = db.query(Offering).filter(Offering.instructor_id == instructor.id).all()
    offering_ids = [offering.id for offering in offerings]
    current_week = get_current_week_range()
    if week_start:
        current_week["start_date"] = week_start
        current_week["end_date"] = week_end or (week_start + timedelta(days=6))
        current_week["label"] = get_current_week_range(week_start)["label"]
    week_start_date = current_week["start_date"]
    week_end_date = current_week["end_date"]
    today_name = date.today().strftime("%A")
    today_entries = db.query(TimetableEntry).filter(
        TimetableEntry.course_offering_id.in_(offering_ids),
        TimetableEntry.day_of_week == today_name,
    ).all() if offering_ids else []
    attendance_session_ids = db.query(AttendanceSession.id).filter(AttendanceSession.offering_id.in_(offering_ids)).all() if offering_ids else []
    material_count = db.query(CourseMaterial).filter(CourseMaterial.offering_id.in_(offering_ids)).count() if offering_ids else 0
    active_regs = db.query(Registration).filter(Registration.offering_id.in_(offering_ids), Registration.status == "active").all() if offering_ids else []
    grade_reg_ids = {row[0] for row in db.query(Grade.registration_id).join(Registration).filter(Registration.offering_id.in_(offering_ids)).all()} if offering_ids else set()
    session_ids = [row[0] for row in attendance_session_ids]
    attended_session_ids = {row[0] for row in db.query(AttendanceRecord.session_id).filter(AttendanceRecord.session_id.in_(session_ids)).distinct().all()} if session_ids else set()
    entries = [entry for offering in offerings for entry in offering.timetable_entries]
    weekly_entries = [entry for entry in entries if entry_occurs_in_week(entry, week_start_date, week_end_date)]
    next_group = next_timetable_group(entries)
    next_class = None
    if next_group:
        next_class = timetable_group_payload(next_group)
        next_starts_at = timetable_group_start_datetime(next_group)
        if next_starts_at:
            next_class["timetable_date"] = next_starts_at.date().isoformat()
            next_class["date"] = next_starts_at.date().isoformat()
    academic_period = next((offering.academic_period or (offering.semester.name if offering.semester else None) for offering in offerings), None)
    semester = semester_label(next((offering.semester.name for offering in offerings if offering.semester), None))
    stats = {
        "active_courses": len([offering for offering in offerings if offering.status == "active"]),
        "total_students": len({reg.student_id for reg in active_regs}),
        "todays_classes": len(group_timetable_entries_for_display([entry for entry in weekly_entries if entry.day_of_week == today_name or entry.timetable_date == date.today()])),
        "next_class": next_class,
    }
    return {
        "success": True,
        "data": {
            "teacher": {"id": instructor.id, "name": instructor_display_name(instructor)},
            "semester": semester,
            "stats": stats,
            "teacher_name": instructor_display_name(instructor),
            "academic_period": academic_period,
            "academic_year": academic_period,
            "current_week": {
                "start_date": week_start_date.isoformat(),
                "end_date": week_end_date.isoformat(),
                "label": current_week["label"],
            },
            "active_courses": stats["active_courses"],
            "total_students": stats["total_students"],
            "today_classes": stats["todays_classes"],
            "pending_attendance": max(0, len(session_ids) - len(attended_session_ids)),
            "materials_posted": material_count,
            "pending_grades": len([reg for reg in active_regs if reg.id not in grade_reg_ids]),
            "courses": [offering_payload(offering, db=db) for offering in offerings],
            "today_timetable": [timetable_group_payload(group) for group in group_timetable_entries_for_display(today_entries)],
            "weekly_timetable": weekly_timetable_payload(entries, week_start_date, week_end_date),
        },
    }


@router.get("/teacher/timetable")
def teacher_timetable(current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    entries = db.query(TimetableEntry).join(Offering).filter(Offering.instructor_id == instructor.id).all()
    return {"success": True, "data": [timetable_group_payload(group) for group in group_timetable_entries_for_display(entries)]}


@router.get("/teacher/course-offerings/{offering_id}")
def teacher_course_detail(offering_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    return {"success": True, "data": offering_payload(offering, db=db)}


@router.get("/student/my-courses")
def student_my_courses(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    registrations = db.query(Registration).filter(Registration.student_id == student.id, Registration.status == "active").all()
    return {
        "success": True,
        "data": [
            offering_payload(reg.offering, program=student.program, academic_year=academic_year_for_semester(student.current_semester))
            for reg in registrations
        ],
    }


@router.get("/student/timetable")
def student_timetable(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    offering_ids = db.query(Registration.offering_id).filter(Registration.student_id == student.id, Registration.status == "active")
    entries = db.query(TimetableEntry).filter(TimetableEntry.course_offering_id.in_(offering_ids)).all()
    return {"success": True, "data": [timetable_group_payload(group) for group in group_timetable_entries_for_display(entries)]}


@router.get("/teacher/course-offerings/{offering_id}/attendance")
def teacher_course_attendance(offering_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    sessions = db.query(AttendanceSession).filter(AttendanceSession.offering_id == offering_id).all()
    records = db.query(AttendanceRecord).join(AttendanceSession).filter(AttendanceSession.offering_id == offering_id).all()
    students = [reg.student for reg in offering.registrations if reg.status == "active" and reg.student]
    return {
        "success": True,
        "data": {
            "course": offering_payload(offering, db=db),
            "students": [{"id": s.id, "student_code": s.student_code, "first_name": s.first_name, "last_name": s.last_name} for s in students],
            "sessions": [{"id": s.id, "attendance_date": s.session_date, "week_number": s.week_number, "topic": s.topic} for s in sessions],
            "records": [{"id": r.id, "student_id": r.student_id, "status": r.status, "notes": r.notes, "attendance_date": r.session.session_date if r.session else None, "week_number": r.session.week_number if r.session else None} for r in records],
        },
    }


@router.post("/teacher/course-offerings/{offering_id}/attendance/bulk-save")
def teacher_course_attendance_bulk_save(offering_id: int, body: AttendanceBulkSave, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    session = db.query(AttendanceSession).filter(AttendanceSession.offering_id == offering_id, AttendanceSession.session_date == body.attendance_date).first()
    if not session:
        session = AttendanceSession(offering_id=offering_id, session_date=body.attendance_date, week_number=body.week_number, topic="Class session")
        db.add(session)
        db.flush()
    enrolled_ids = {reg.student_id for reg in offering.registrations if reg.status == "active"}
    for item in body.records:
        if item.student_id not in enrolled_ids:
            raise HTTPException(status_code=400, detail=f"Student {item.student_id} is not enrolled")
        record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == item.student_id).first()
        if record:
            record.status = item.status
            record.notes = item.notes
            record.course_offering_id = offering_id
            record.course_id = offering.course_id
            record.teacher_id = instructor.id
            record.week_number = session.week_number
            record.attendance_date = session.session_date
        else:
            db.add(AttendanceRecord(
                session_id=session.id,
                course_offering_id=offering_id,
                course_id=offering.course_id,
                teacher_id=instructor.id,
                student_id=item.student_id,
                week_number=session.week_number,
                attendance_date=session.session_date,
                status=item.status,
                notes=item.notes,
            ))
    db.commit()
    return {"success": True, "saved": len(body.records)}


@router.get("/teacher/course-offerings/{offering_id}/grades")
def teacher_course_grades(offering_id: int, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    return {
        "success": True,
        "data": [
            {
                "registration_id": reg.id,
                "student_id": reg.student_id,
                "student_name": f"{reg.student.first_name} {reg.student.last_name}" if reg.student else None,
                "grade": grade_payload(reg.grade),
            }
            for reg in offering.registrations if reg.status == "active"
        ],
    }


@router.post("/teacher/course-offerings/{offering_id}/grades/bulk-save")
def teacher_course_grades_bulk_save(offering_id: int, body: GradeBulkSave, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Course offering not found")
    for item in body.grades:
        if item.midterm_score is not None and not 0 <= item.midterm_score <= MIDTERM_MAX:
            raise HTTPException(status_code=400, detail="Midterm score must be between 0 and 15")
        if item.project_score is not None and not 0 <= item.project_score <= PROJECT_MAX:
            raise HTTPException(status_code=400, detail="Project score must be between 0 and 15")
        if item.quiz_score is not None and not 0 <= item.quiz_score <= QUIZ_MAX:
            raise HTTPException(status_code=400, detail="Quiz score must be between 0 and 10")
        if item.final_exam_score is not None and not 0 <= item.final_exam_score <= FINAL_EXAM_MAX:
            raise HTTPException(status_code=400, detail="Final exam score must be between 0 and 60")
        reg = db.query(Registration).filter(Registration.offering_id == offering_id, Registration.student_id == item.student_id, Registration.status == "active").first()
        if not reg:
            raise HTTPException(status_code=400, detail=f"Student {item.student_id} is not enrolled")
        grade = reg.grade or Grade(registration_id=reg.id)
        if not reg.grade:
            db.add(grade)
        grade.course_offering_id = offering_id
        grade.course_id = offering.course_id
        grade.teacher_id = instructor.id
        grade.student_id = item.student_id
        eligibility = absence_eligibility(db, item.student_id, offering_id)
        if eligibility["exam_blocked_due_to_absence"]:
            apply_absence_block(grade, eligibility)
            status = db.query(StudentCourseStatus).filter(
                StudentCourseStatus.student_id == item.student_id,
                StudentCourseStatus.course_offering_id == offering_id,
            ).first()
            if not status:
                status = StudentCourseStatus(student_id=item.student_id, course_offering_id=offering_id, academic_year=offering.academic_period or "2025-2026")
                db.add(status)
            status.status = "failed_absence"
            status.absence_percentage = eligibility["absence_percentage"]
            status.can_take_exam = False
            status.can_retake_next_year = True
            continue
        grade.midterm_score = item.midterm_score
        grade.project_score = item.project_score
        grade.quiz_score = item.quiz_score
        grade.final_exam_score = item.final_exam_score
        total = (item.midterm_score or 0) + (item.project_score or 0) + (item.quiz_score or 0) + (item.final_exam_score or 0)
        grade.total_score = total
        grade.final_grade = 4 if total < 45 else 5 if total <= 54 else 6 if total <= 64 else 7 if total <= 74 else 8 if total <= 84 else 9 if total <= 94 else 10
        grade.pass_status = "failed" if grade.final_grade == 4 else "passed"
        grade.letter_grade = "F" if grade.final_grade == 4 else str(grade.final_grade)
        grade.feedback = item.feedback
    db.commit()
    return {"success": True, "saved": len(body.grades)}


@router.put("/teacher/grades/{grade_id}")
def teacher_update_grade(grade_id: int, body: GradeBulkRecord, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = instructor_for_user(current_user, db)
    grade = db.query(Grade).join(Offering, Offering.id == Grade.course_offering_id).filter(
        Grade.id == grade_id,
        Offering.instructor_id == instructor.id,
    ).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    if body.midterm_score is not None and not 0 <= body.midterm_score <= MIDTERM_MAX:
        raise HTTPException(status_code=400, detail="Midterm score must be between 0 and 15")
    if body.project_score is not None and not 0 <= body.project_score <= PROJECT_MAX:
        raise HTTPException(status_code=400, detail="Project score must be between 0 and 15")
    if body.quiz_score is not None and not 0 <= body.quiz_score <= QUIZ_MAX:
        raise HTTPException(status_code=400, detail="Quiz score must be between 0 and 10")
    if body.final_exam_score is not None and not 0 <= body.final_exam_score <= FINAL_EXAM_MAX:
        raise HTTPException(status_code=400, detail="Final exam score must be between 0 and 60")
    eligibility = absence_eligibility(db, grade.student_id, grade.course_offering_id)
    if eligibility["exam_blocked_due_to_absence"]:
        apply_absence_block(grade, eligibility)
        db.commit()
        db.refresh(grade)
        return {"success": True, "data": grade_payload(grade)}
    grade.midterm_score = body.midterm_score
    grade.project_score = body.project_score
    grade.quiz_score = body.quiz_score
    grade.final_exam_score = body.final_exam_score
    total = (body.midterm_score or 0) + (body.project_score or 0) + (body.quiz_score or 0) + (body.final_exam_score or 0)
    grade.total_score = total
    grade.final_grade = 4 if total < 45 else 5 if total <= 54 else 6 if total <= 64 else 7 if total <= 74 else 8 if total <= 84 else 9 if total <= 94 else 10
    grade.pass_status = "failed" if grade.final_grade == 4 else "passed"
    grade.letter_grade = "F" if grade.final_grade == 4 else str(grade.final_grade)
    grade.feedback = body.feedback
    db.commit()
    db.refresh(grade)
    return {"success": True, "data": grade_payload(grade)}


@router.get("/student/course-offerings/{offering_id}/attendance")
def student_course_attendance(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    reg = db.query(Registration).filter(Registration.student_id == student.id, Registration.offering_id == offering_id, Registration.status == "active").first()
    if not reg:
        raise HTTPException(status_code=404, detail="Course offering not found")
    records = db.query(AttendanceRecord).join(AttendanceSession).filter(AttendanceSession.offering_id == offering_id, AttendanceRecord.student_id == student.id).all()
    return {"success": True, "data": [student_attendance_payload(r) for r in records]}


@router.get("/student/attendance")
def student_attendance(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).all()
    return {"success": True, "data": [student_attendance_payload(r) for r in records]}


@router.get("/student/course-offerings/{offering_id}/exam-eligibility")
def student_exam_eligibility(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    reg = db.query(Registration).filter(Registration.student_id == student.id, Registration.offering_id == offering_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Course offering not found")
    return {"success": True, "data": absence_eligibility(db, student.id, offering_id)}


@router.get("/student/course-offerings/{offering_id}/grades")
def student_course_grades(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    reg = db.query(Registration).filter(Registration.student_id == student.id, Registration.offering_id == offering_id, Registration.status == "active").first()
    if not reg:
        raise HTTPException(status_code=404, detail="Course offering not found")
    return {"success": True, "data": grade_payload(reg.grade) if reg.grade and reg.grade.is_published else None}


@router.get("/student/grades")
def student_all_grades(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    grades = db.query(Grade).filter(Grade.student_id == student.id, Grade.is_published == True).all()
    return {"success": True, "data": [grade_payload(grade) for grade in grades]}


@router.get("/student/progression")
def student_progression(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    return {"success": True, "data": calculate_progression(student, db)}


@router.get("/admin/students/{student_id}/progression")
def admin_student_progression(student_id: int, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"success": True, "data": calculate_progression(student, db)}


@router.get("/student/course-offerings/{offering_id}")
def student_course_detail(offering_id: int, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = student_for_user(current_user, db)
    reg = db.query(Registration).filter(
        Registration.student_id == student.id,
        Registration.offering_id == offering_id,
        Registration.status == "active",
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Course offering not found")
    return {
        "success": True,
        "data": offering_payload(reg.offering, program=student.program, academic_year=academic_year_for_semester(student.current_semester)),
    }
