"""Student access level tests.

These tests focus on the student-facing part of the system: profile, enrolled
courses, timetable, attendance, grades, progression, materials, assignments,
subject selection, notifications, finance, clubs, and messages.

The tests call route functions directly with an isolated SQLite database. This
keeps them independent from the admin TestClient suite while still exercising
the real route logic and SQLAlchemy models.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import src.models  # noqa: F401 - registers core model tables
from src.config.database import Base
from src.models.attendance import AttendanceRecord, AttendanceSession
from src.models.campus_event import CampusEvent, EventRegistration  # noqa: F401
from src.models.club import Club, ClubCategory, ClubMembership
from src.models.course import Course
from src.models.course_material import Assignment, AssignmentSubmission, CourseMaterial
from src.models.course_selection import StudentCourseSelection
from src.models.department import Department, Faculty
from src.models.finance import Invoice
from src.models.grade import Grade
from src.models.instructor import Instructor
from src.models.message import Message  # noqa: F401
from src.models.notification import Notification
from src.models.offering import Offering
from src.models.program import Program
from src.models.registration import Registration
from src.models.semester import Semester
from src.models.student import Student
from src.models.timetable import TimetableEntry
from src.models.user import User
from src.routes import clubs as club_routes
from src.routes import course_offerings as offering_routes
from src.routes import course_selections as selection_routes
from src.routes import finance as finance_routes
from src.routes import grades as grade_routes
from src.routes import materials as material_routes
from src.routes import messages as message_routes
from src.routes import notifications as notification_routes
from src.routes import students as student_routes
from src.schemas.student import StudentUpdate


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@dataclass
class StudentContext:
    student_user: User
    instructor_user: User
    staff_user: User
    finance_user: User
    student: Student
    instructor: Instructor
    program: Program
    semester: Semester
    offering: Offering
    unpublished_offering: Offering
    other_offering: Offering
    registration: Registration
    grade: Grade
    assignment: Assignment
    submitted_assignment: Assignment
    selection: StudentCourseSelection
    notification: Notification
    club: Club


@pytest.fixture()
def db() -> Session:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _user(db: Session, role: str, email: str, full_name: str) -> User:
    user = User(
        email=email,
        full_name=full_name,
        password_hash="test-hash",
        role=role,
        status="active",
        is_first_login=False,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def seed_student_access(db: Session) -> StudentContext:
    faculty = Faculty(name="Faculty of Engineering", code="ENG")
    department = Department(name="Computer Science", code="CS", faculty=faculty)
    program = Program(
        name="Computer Information Systems",
        code="CIS",
        department=department,
        total_credits=180,
        duration_semesters=6,
    )
    other_faculty = Faculty(name="Faculty of Business", code="BUS")
    other_department = Department(name="Business", code="BUS-D", faculty=other_faculty)
    other_program = Program(
        name="Business Administration",
        code="BBA",
        department=other_department,
        total_credits=180,
        duration_semesters=6,
    )
    db.add_all([faculty, department, program, other_faculty, other_department, other_program])
    db.flush()

    student_user = _user(db, "student", "fabio@student.test", "Fabio Hassan")
    instructor_user = _user(db, "instructor", "ada@cis.test", "Dr. Ada Lovelace")
    staff_user = _user(db, "academic_staff", "staff@cis.test", "Academic Staff")
    finance_user = _user(db, "finance_staff", "finance@cis.test", "Finance Staff")

    student = Student(
        user=student_user,
        student_code="CIS-2026-001",
        first_name="Fabio",
        last_name="Hassan",
        phone="+355600000001",
        date_of_birth=date(2002, 5, 10),
        program=program,
        degree_level="Bachelor",
        academic_year="Bachelor Year 1",
        current_semester=1,
        gpa=Decimal("3.65"),
        status="active",
    )
    instructor = Instructor(
        user=instructor_user,
        first_name="Ada",
        last_name="Lovelace",
        title="Dr.",
        department=department,
    )
    semester = Semester(
        name="Fall 2026",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 12, 20),
        total_weeks=14,
        is_active=True,
        registration_deadline=date(2026, 8, 25),
        drop_deadline=date(2026, 9, 15),
    )
    db.add_all([student, instructor, semester])
    db.flush()

    course = Course(code="CIS101", name="Introduction to CIS", credits=6, department=department)
    second_course = Course(code="CIS102", name="Programming Fundamentals", credits=6, department=department)
    other_course = Course(code="BUS101", name="Business Basics", credits=6, department=other_department)
    db.add_all([course, second_course, other_course])
    db.flush()

    offering = Offering(
        course=course,
        instructor=instructor,
        semester=semester,
        program=program,
        faculty_id=faculty.id,
        academic_year="Bachelor Year 1",
        academic_period="2026-2027",
        group_name="A",
        room="A101",
        schedule="Monday 09:00-11:00 A101",
        capacity=35,
        enrolled=1,
        enrollment_open=True,
        selection_deadline=date.today() + timedelta(days=30),
        status="active",
    )
    unpublished_offering = Offering(
        course=second_course,
        instructor=instructor,
        semester=semester,
        program=program,
        faculty_id=faculty.id,
        academic_year="Bachelor Year 1",
        academic_period="2026-2027",
        group_name="A",
        room="B201",
        schedule="Tuesday 10:00-12:00 B201",
        capacity=35,
        enrolled=1,
        enrollment_open=True,
        selection_deadline=date.today() + timedelta(days=30),
        status="active",
    )
    other_offering = Offering(
        course=other_course,
        instructor=instructor,
        semester=semester,
        program=other_program,
        faculty_id=other_faculty.id,
        academic_year="Bachelor Year 1",
        academic_period="2026-2027",
        group_name="B",
        room="C301",
        schedule="Wednesday 12:00-14:00 C301",
        capacity=1,
        enrolled=1,
        enrollment_open=False,
        selection_deadline=date.today() + timedelta(days=30),
        status="active",
    )
    db.add_all([offering, unpublished_offering, other_offering])
    db.flush()

    registration = Registration(student=student, offering=offering, status="active")
    unpublished_registration = Registration(student=student, offering=unpublished_offering, status="active")
    dropped_registration = Registration(student=student, offering=other_offering, status="dropped")
    db.add_all([registration, unpublished_registration, dropped_registration])
    db.flush()

    grade = Grade(
        registration=registration,
        course_offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        student_id=student.id,
        midterm_score=Decimal("42.00"),
        final_exam_score=Decimal("44.00"),
        total_score=Decimal("86.00"),
        final_grade=9,
        letter_grade="A",
        pass_status="passed",
        is_published=True,
        absence_percentage=Decimal("0.00"),
    )
    unpublished_grade = Grade(
        registration=unpublished_registration,
        course_offering_id=unpublished_offering.id,
        course_id=second_course.id,
        teacher_id=instructor.id,
        student_id=student.id,
        total_score=Decimal("75.00"),
        final_grade=None,
        letter_grade=None,
        pass_status=None,
        is_published=False,
    )
    db.add_all([grade, unpublished_grade])

    timetable = TimetableEntry(
        course_offering_id=offering.id,
        day_of_week="Monday",
        start_time="09:00",
        end_time="11:00",
        teaching_hours=2,
        room="A101",
        is_published=True,
    )
    session_one = AttendanceSession(
        offering=offering,
        session_date=date.today() - timedelta(days=14),
        week_number=1,
        topic="Course introduction",
    )
    session_two = AttendanceSession(
        offering=offering,
        session_date=date.today() - timedelta(days=7),
        week_number=2,
        topic="Systems overview",
    )
    db.add_all([timetable, session_one, session_two])
    db.flush()

    present_record = AttendanceRecord(
        session=session_one,
        student=student,
        course_offering_id=offering.id,
        timetable_entry_id=timetable.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=1,
        attendance_date=session_one.session_date,
        start_time="09:00",
        end_time="11:00",
        status="present",
    )
    absent_record = AttendanceRecord(
        session=session_two,
        student=student,
        course_offering_id=offering.id,
        timetable_entry_id=timetable.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=2,
        attendance_date=session_two.session_date,
        start_time="09:00",
        end_time="11:00",
        status="absent",
        notes="Medical document pending",
    )
    db.add_all([present_record, absent_record])

    visible_material = CourseMaterial(
        offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=1,
        title="Week 1 Slides",
        description="Introductory slides",
        material_kind="link",
        file_url="https://example.test/week-1",
        status="published",
        published_at=datetime.utcnow(),
        is_visible_to_students=True,
    )
    hidden_material = CourseMaterial(
        offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=1,
        title="Teacher Draft",
        description="Hidden draft",
        material_kind="link",
        status="draft",
        is_visible_to_students=False,
    )
    assignment = Assignment(
        course_offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=1,
        title="Reflection Task",
        description="Write a short reflection",
        instructions="Submit text",
        max_points=Decimal("100.00"),
        status="published",
        is_visible_to_students=True,
        published_at=datetime.utcnow(),
    )
    submitted_assignment = Assignment(
        course_offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=2,
        title="Submitted Task",
        description="Already submitted",
        instructions="Submit a link",
        max_points=Decimal("100.00"),
        status="published",
        is_visible_to_students=True,
        published_at=datetime.utcnow(),
    )
    hidden_assignment = Assignment(
        course_offering_id=offering.id,
        course_id=course.id,
        teacher_id=instructor.id,
        week_number=3,
        title="Hidden Assignment",
        max_points=Decimal("100.00"),
        status="hidden",
        is_visible_to_students=False,
    )
    db.add_all([visible_material, hidden_material, assignment, submitted_assignment, hidden_assignment])
    db.flush()

    submission = AssignmentSubmission(
        assignment_id=submitted_assignment.id,
        student_id=student.id,
        submitted_text="https://example.test/submission",
        submitted_at=datetime.utcnow(),
        status="submitted",
        is_published=False,
    )
    db.add(submission)

    invoice = Invoice(
        student=student,
        semester=semester,
        description="Fall tuition",
        amount=Decimal("1200.00"),
        amount_paid=Decimal("200.00"),
        due_date=date.today() + timedelta(days=20),
        status="partial",
    )
    notification = Notification(
        user=student_user,
        title="New grade published",
        message="Your CIS101 grade is available.",
        type="grade",
        is_read=False,
    )
    club_category = ClubCategory(name="Technology")
    club = Club(code="AI", name="AI Club", category_id=None, description="AI student group", status="active", join_mode="open")
    db.add_all([invoice, notification, club_category, club])
    db.flush()
    club.category_id = club_category.id
    membership = ClubMembership(club_id=club.id, student_id=student.id, member_role="member", status="active", joined_at=datetime.utcnow())
    pending_membership = ClubMembership(club_id=club.id, student_id=student.id, member_role="member", status="pending", submitted_at=datetime.utcnow())
    db.add_all([membership, pending_membership])

    selection = StudentCourseSelection(student_id=student.id, course_offering_id=offering.id, status="requested", reason=None)
    db.add(selection)
    db.commit()

    return StudentContext(
        student_user=student_user,
        instructor_user=instructor_user,
        staff_user=staff_user,
        finance_user=finance_user,
        student=student,
        instructor=instructor,
        program=program,
        semester=semester,
        offering=offering,
        unpublished_offering=unpublished_offering,
        other_offering=other_offering,
        registration=registration,
        grade=grade,
        assignment=assignment,
        submitted_assignment=submitted_assignment,
        selection=selection,
        notification=notification,
        club=club,
    )


def test_student_can_view_own_profile(db: Session) -> None:
    ctx = seed_student_access(db)

    profile = student_routes.me(current_user=ctx.student_user, db=db)

    assert profile.student_code == "CIS-2026-001"
    assert profile.first_name == "Fabio"
    assert profile.program_id == ctx.program.id


def test_student_can_update_own_contact_information(db: Session) -> None:
    ctx = seed_student_access(db)

    updated = student_routes.update_me(
        StudentUpdate(phone="+355699999999", date_of_birth=date(2002, 6, 1)),
        current_user=ctx.student_user,
        db=db,
    )

    assert updated.phone == "+355699999999"
    assert updated.date_of_birth == date(2002, 6, 1)


def test_student_my_courses_returns_only_active_enrollments(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_my_courses(current_user=ctx.student_user, db=db)

    assert response["success"] is True
    codes = {course["course_code"] for course in response["data"]}
    assert codes == {"CIS101", "CIS102"}
    assert "BUS101" not in codes


def test_student_course_detail_requires_enrollment(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_course_detail(ctx.offering.id, current_user=ctx.student_user, db=db)

    assert response["data"]["course_code"] == "CIS101"

    with pytest.raises(HTTPException) as exc:
        offering_routes.student_course_detail(ctx.other_offering.id, current_user=ctx.student_user, db=db)
    assert exc.value.status_code == 404


def test_student_timetable_returns_registered_course_schedule(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_timetable(current_user=ctx.student_user, db=db)

    assert response["success"] is True
    assert response["data"][0]["course_code"] == "CIS101"
    assert response["data"][0]["day_of_week"] == "Monday"
    assert response["data"][0]["start_time"] == "09:00"


def test_student_attendance_returns_only_student_records(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_attendance(current_user=ctx.student_user, db=db)

    assert response["success"] is True
    assert [record["status"] for record in response["data"]] == ["present", "absent"]
    assert response["data"][1]["notes"] == "Medical document pending"


def test_student_course_attendance_requires_active_registration(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_course_attendance(ctx.offering.id, current_user=ctx.student_user, db=db)
    assert len(response["data"]) == 2

    with pytest.raises(HTTPException) as exc:
        offering_routes.student_course_attendance(ctx.other_offering.id, current_user=ctx.student_user, db=db)
    assert exc.value.status_code == 404


def test_student_exam_eligibility_uses_absence_policy(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_exam_eligibility(ctx.offering.id, current_user=ctx.student_user, db=db)

    assert response["data"]["total_occurred_sessions"] == 2
    assert response["data"]["absent_sessions"] == 1
    assert response["data"]["exam_blocked_due_to_absence"] is True
    assert response["data"]["blocked_reason"] == "Absences over 15%"


def test_student_grade_lists_hide_unpublished_grades(db: Session) -> None:
    ctx = seed_student_access(db)

    all_grades = offering_routes.student_all_grades(current_user=ctx.student_user, db=db)
    legacy_grades = grade_routes.my_grades(current_user=ctx.student_user, db=db)

    assert len(all_grades["data"]) == 1
    assert all_grades["data"][0]["final_grade"] == 9
    assert len(legacy_grades) == 1
    assert legacy_grades[0].final_grade == 9


def test_student_course_grade_returns_none_until_published(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_course_grades(ctx.unpublished_offering.id, current_user=ctx.student_user, db=db)

    assert response["success"] is True
    assert response["data"] is None


def test_student_progression_counts_passed_credits(db: Session) -> None:
    ctx = seed_student_access(db)

    response = offering_routes.student_progression(current_user=ctx.student_user, db=db)

    assert response["data"]["degree_level"] == "Bachelor"
    assert response["data"]["total_passed_credits"] == 6
    assert response["data"]["graduation_required_credits"] == 180


def test_student_finance_endpoint_returns_own_invoices(db: Session) -> None:
    ctx = seed_student_access(db)

    invoices = finance_routes.my_invoices(current_user=ctx.student_user, db=db)

    assert len(invoices) == 1
    assert invoices[0].description == "Fall tuition"
    assert invoices[0].status == "partial"


def test_student_notifications_can_be_filtered_and_marked_read(db: Session) -> None:
    ctx = seed_student_access(db)

    unread = notification_routes.notifications(unread_only=True, current_user=ctx.student_user, db=db)
    assert [item["title"] for item in unread] == ["New grade published"]

    result = notification_routes.mark_read(ctx.notification.id, current_user=ctx.student_user, db=db)
    assert result == {"ok": True}
    assert notification_routes.notifications(unread_only=True, current_user=ctx.student_user, db=db) == []


def test_student_materials_show_only_visible_published_content(db: Session) -> None:
    ctx = seed_student_access(db)

    materials = material_routes.student_materials(current_user=ctx.student_user, db=db)

    assert [item.title for item in materials] == ["Week 1 Slides"]
    assert materials[0].course_code == "CIS101"


def test_student_course_materials_support_week_filter(db: Session) -> None:
    ctx = seed_student_access(db)

    materials = material_routes.student_course_offering_materials(
        ctx.offering.id,
        week_number=1,
        current_user=ctx.student_user,
        db=db,
    )

    assert len(materials) == 1
    assert materials[0].week_number == 1


def test_student_assignments_show_submission_status(db: Session) -> None:
    ctx = seed_student_access(db)

    assignments = material_routes.student_assignments(ctx.offering.id, current_user=ctx.student_user, db=db)

    titles = {item.title for item in assignments}
    assert titles == {"Reflection Task", "Submitted Task"}
    submitted = next(item for item in assignments if item.title == "Submitted Task")
    assert submitted.my_submission["status"] == "submitted"
    assert submitted.my_submission["submission_type"] == "Link"


def test_student_can_submit_text_assignment(db: Session) -> None:
    ctx = seed_student_access(db)

    submission = asyncio.run(
        material_routes.submit_assignment(
            ctx.assignment.id,
            submitted_text="My reflection answer",
            file=None,
            current_user=ctx.student_user,
            db=db,
        )
    )

    assert submission.status == "submitted"
    assert submission.submitted_text == "My reflection answer"
    assert submission.submission_type == "Text"


def test_available_subjects_marks_student_eligible_and_blocked_options(db: Session) -> None:
    ctx = seed_student_access(db)

    response = selection_routes.available_subjects(current_user=ctx.student_user, db=db)

    by_code = {item["course_code"]: item for item in response["data"]}
    assert by_code["CIS101"]["can_select"] is False
    assert by_code["CIS101"]["blocked_reason"] == "already passed"
    assert by_code["CIS102"]["can_select"] is True
    assert "BUS101" not in by_code


def test_student_course_selection_request_can_be_created_and_dropped(db: Session) -> None:
    ctx = seed_student_access(db)

    response = selection_routes.create_course_selection(
        selection_routes.CourseSelectionIn(course_offering_id=ctx.unpublished_offering.id),
        current_user=ctx.student_user,
        db=db,
    )
    assert response["success"] is True

    selections = selection_routes.my_course_selections(current_user=ctx.student_user, db=db)
    assert {item["course_code"] for item in selections["data"]} == {"CIS101", "CIS102"}

    drop_response = selection_routes.delete_course_selection(response["selection_id"], current_user=ctx.student_user, db=db)
    assert drop_response == {"deleted": True}
    dropped = db.query(StudentCourseSelection).filter(StudentCourseSelection.id == response["selection_id"]).one()
    assert dropped.status == "dropped"


def test_student_course_selection_rejects_unavailable_offering(db: Session) -> None:
    ctx = seed_student_access(db)

    response = selection_routes.create_course_selection(
        selection_routes.CourseSelectionIn(course_offering_id=ctx.other_offering.id),
        current_user=ctx.student_user,
        db=db,
    )

    assert response["success"] is False
    assert "not available" in response["message"]


def test_student_club_directory_includes_membership_state(db: Session) -> None:
    ctx = seed_student_access(db)

    response = club_routes.my_clubs(current_user=ctx.student_user, db=db)

    assert response["memberships"][0]["club_name"] == "AI Club"
    assert response["directory"][0]["club_name"] == "AI Club"
    assert response["directory"][0]["active_members"] == 1
    assert response["directory"][0]["pending_requests"] == 1
    assert response["join_requests"][0]["status"] == "pending"


def test_student_message_contacts_are_restricted_to_instructors_and_academic_staff(db: Session) -> None:
    ctx = seed_student_access(db)

    response = message_routes.contacts(current_user=ctx.student_user, db=db)

    roles = {item["role"] for item in response["contacts"]}
    assert roles == {"academic_staff", "instructor"}


def test_student_can_message_instructor_but_not_finance_staff(db: Session) -> None:
    ctx = seed_student_access(db)

    ok = message_routes.send_message(
        message_routes.SendMessageIn(
            recipient_id=ctx.instructor_user.id,
            subject="Course question",
            body="Can you clarify week 1?",
        ),
        current_user=ctx.student_user,
        db=db,
    )
    assert ok["message"] == "Message sent to Dr. Ada Lovelace."

    with pytest.raises(HTTPException) as exc:
        message_routes.send_message(
            message_routes.SendMessageIn(
                recipient_id=ctx.finance_user.id,
                subject="Finance question",
                body="Can I ask here?",
            ),
            current_user=ctx.student_user,
            db=db,
        )
    assert exc.value.status_code == 403
