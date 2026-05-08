from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.rbac import ROLE_ACADEMIC_STAFF, ROLE_SYSTEM_ADMIN
from app.schemas.teacher import (
    AttendanceRecordBulkRequest,
    AttendanceSessionCreateRequest,
    FinalGradesPublishRequest,
    GradeComponentCreateRequest,
    GradeRecordBulkRequest,
)


def _can_manage_all_academic(actor_roles: list[str] | None = None) -> bool:
    return actor_roles is not None and any(role in actor_roles for role in (ROLE_ACADEMIC_STAFF, ROLE_SYSTEM_ADMIN))


def _get_teacher_profile(db: Session, user_id: int) -> dict:
    teacher = db.execute(
        text(
            """
            SELECT
              tp.id AS teacher_id,
              tp.employee_number,
              tp.title,
              tp.office_location,
              tp.employment_status,
              d.name AS department_name
            FROM teacher_profiles tp
            JOIN departments d ON d.id = tp.department_id
            WHERE tp.user_id = :user_id
            """
        ),
        {"user_id": user_id},
    ).mappings().first()

    if teacher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instructor profile not found for the current account.",
        )

    return dict(teacher)


def _get_academic_staff_profile(db: Session, user_id: int) -> dict:
    staff = db.execute(
        text(
            """
            SELECT
              NULL AS teacher_id,
              ap.employee_number,
              ap.title,
              ap.office_location,
              ap.employment_status,
              'Academic Operations' AS department_name
            FROM admin_profiles ap
            WHERE ap.user_id = :user_id
            """
        ),
        {"user_id": user_id},
    ).mappings().first()

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff profile not found for the current account.",
        )

    return dict(staff)


def _get_academic_actor(db: Session, user_id: int, actor_roles: list[str] | None = None) -> dict:
    if _can_manage_all_academic(actor_roles):
        return _get_academic_staff_profile(db, user_id)
    return _get_teacher_profile(db, user_id)


def _ensure_teacher_offering(db: Session, teacher_id: int | None, offering_id: int, allow_unassigned: bool = False) -> dict:
    access_filter = "" if allow_unassigned else "AND co.teacher_id = :teacher_id"
    offering = db.execute(
        text(
            f"""
            SELECT
              co.id AS offering_id,
              co.teacher_id,
              co.section_code,
              co.status,
              c.code,
              c.title
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            WHERE co.id = :offering_id
              {access_filter}
            """
        ),
        {"offering_id": offering_id, "teacher_id": teacher_id},
    ).mappings().first()

    if offering is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This course offering is not available in your academic workspace.",
        )

    return dict(offering)


def _get_enrolled_students_for_offering(db: Session, offering_id: int) -> list[dict]:
    students = db.execute(
        text(
            """
            SELECT
              e.id AS enrollment_id,
              sp.id AS student_id,
              sp.student_number,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              u.email
            FROM enrollments e
            JOIN student_profiles sp ON sp.id = e.student_id
            JOIN users u ON u.id = sp.user_id
            WHERE e.course_offering_id = :offering_id
              AND e.status IN ('enrolled', 'completed')
            ORDER BY u.last_name ASC, u.first_name ASC
            """
        ),
        {"offering_id": offering_id},
    ).mappings().all()

    return [dict(item) for item in students]


def _get_grade_component_for_teacher(
    db: Session,
    teacher_id: int | None,
    component_id: int,
    allow_unassigned: bool = False,
) -> dict:
    access_filter = "" if allow_unassigned else "AND co.teacher_id = :teacher_id"
    component = db.execute(
        text(
            f"""
            SELECT
              gc.id AS component_id,
              gc.course_offering_id AS offering_id,
              gc.name,
              gc.max_points
            FROM grade_components gc
            JOIN course_offerings co ON co.id = gc.course_offering_id
            WHERE gc.id = :component_id
              {access_filter}
            """
        ),
        {"component_id": component_id, "teacher_id": teacher_id},
    ).mappings().first()

    if component is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This grade component is not available in your academic workspace.",
        )

    return dict(component)


def _calculate_letter_grade(numeric_grade: float) -> str:
    if numeric_grade >= 93:
        return "A"
    if numeric_grade >= 90:
        return "A-"
    if numeric_grade >= 87:
        return "B+"
    if numeric_grade >= 83:
        return "B"
    if numeric_grade >= 80:
        return "B-"
    if numeric_grade >= 77:
        return "C+"
    if numeric_grade >= 73:
        return "C"
    if numeric_grade >= 70:
        return "C-"
    if numeric_grade >= 60:
        return "D"
    return "F"


def _grade_points_for_letter(letter_grade: str) -> float:
    return {
        "A": 4.0,
        "A-": 3.7,
        "B+": 3.3,
        "B": 3.0,
        "B-": 2.7,
        "C+": 2.3,
        "C": 2.0,
        "C-": 1.7,
        "D": 1.0,
        "F": 0.0,
    }.get(letter_grade, 0.0)


def create_attendance_session(
    db: Session,
    user_id: int,
    payload: AttendanceSessionCreateRequest,
    actor_roles: list[str] | None = None,
) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    offering = _ensure_teacher_offering(db, teacher["teacher_id"], payload.offering_id, allow_unassigned=_can_manage_all_academic(actor_roles))

    meeting_id = payload.course_meeting_id
    if meeting_id is not None:
        meeting = db.execute(
            text(
                """
                SELECT id
                FROM course_meetings
                WHERE id = :meeting_id
                  AND course_offering_id = :offering_id
                """
            ),
            {"meeting_id": meeting_id, "offering_id": payload.offering_id},
        ).scalar_one_or_none()
        if meeting is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected meeting does not belong to this course offering.",
            )

    db.execute(
        text(
            """
            INSERT INTO attendance_sessions (
              course_offering_id,
              course_meeting_id,
              session_date,
              start_time,
              end_time,
              topic,
              status,
              created_by_teacher_id
            ) VALUES (
              :course_offering_id,
              :course_meeting_id,
              :session_date,
              :start_time,
              :end_time,
              :topic,
              :status,
              :created_by_teacher_id
            )
            """
        ),
        {
            "course_offering_id": payload.offering_id,
            "course_meeting_id": payload.course_meeting_id,
            "session_date": payload.session_date,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "topic": payload.topic,
            "status": payload.status,
                "created_by_teacher_id": teacher.get("teacher_id"),
            },
        )
    session_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    db.commit()

    return {
        "session_id": int(session_id),
        "offering_id": offering["offering_id"],
        "course_code": offering["code"],
        "course_title": offering["title"],
        "section_code": offering["section_code"],
        "session_date": payload.session_date,
        "status": payload.status,
    }


def record_attendance_for_session(
    db: Session,
    user_id: int,
    session_id: int,
    payload: AttendanceRecordBulkRequest,
    actor_roles: list[str] | None = None,
) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    access_filter = "" if _can_manage_all_academic(actor_roles) else "AND co.teacher_id = :teacher_id"
    session = db.execute(
        text(
            """
            SELECT
              attendance_sessions.id AS session_id,
              attendance_sessions.course_offering_id AS offering_id,
              attendance_sessions.session_date,
              c.code,
              c.title
            FROM attendance_sessions
            JOIN course_offerings co ON co.id = attendance_sessions.course_offering_id
            JOIN courses c ON c.id = co.course_id
            WHERE attendance_sessions.id = :session_id
              {access_filter}
            """
            .format(access_filter=access_filter)
        ),
        {"session_id": session_id, "teacher_id": teacher["teacher_id"]},
    ).mappings().first()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance session not found in your academic workspace.",
        )

    valid_students = {
        student["student_id"]: student
        for student in _get_enrolled_students_for_offering(db, session["offering_id"])
    }

    recorded_at = datetime.now(UTC).replace(tzinfo=None)
    for record in payload.records:
        if record.student_id not in valid_students:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more students are not enrolled in this offering.",
            )

        db.execute(
            text(
                """
                INSERT INTO attendance_records (
                  attendance_session_id,
                  student_id,
                  status,
                  remarks,
                  recorded_by_teacher_id,
                  recorded_at
                ) VALUES (
                  :attendance_session_id,
                  :student_id,
                  :status,
                  :remarks,
                  :recorded_by_teacher_id,
                  :recorded_at
                )
                ON DUPLICATE KEY UPDATE
                  status = VALUES(status),
                  remarks = VALUES(remarks),
                  recorded_by_teacher_id = VALUES(recorded_by_teacher_id),
                  recorded_at = VALUES(recorded_at)
                """
            ),
            {
                "attendance_session_id": session_id,
                "student_id": record.student_id,
                "status": record.status,
                "remarks": record.remarks,
                "recorded_by_teacher_id": teacher.get("teacher_id"),
                "recorded_at": recorded_at,
            },
        )

    db.commit()

    absent_count = sum(1 for record in payload.records if record.status == "absent")
    return {
        "session_id": int(session_id),
        "recorded_students": len(payload.records),
        "absent_students": absent_count,
        "message": f"Attendance saved for {session['code']} - {session['title']}.",
    }


def create_grade_component(
    db: Session,
    user_id: int,
    payload: GradeComponentCreateRequest,
    actor_roles: list[str] | None = None,
) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    offering = _ensure_teacher_offering(db, teacher["teacher_id"], payload.offering_id, allow_unassigned=_can_manage_all_academic(actor_roles))

    total_weight = db.execute(
        text(
            """
            SELECT COALESCE(SUM(weight_percentage), 0)
            FROM grade_components
            WHERE course_offering_id = :offering_id
            """
        ),
        {"offering_id": payload.offering_id},
    ).scalar_one()

    if float(total_weight or 0) + payload.weight_percentage > 100.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The total weight for this offering would exceed 100%.",
        )

    db.execute(
        text(
            """
            INSERT INTO grade_components (
              course_offering_id,
              name,
              component_type,
              max_points,
              weight_percentage,
              due_at,
              sort_order,
              is_published
            ) VALUES (
              :course_offering_id,
              :name,
              :component_type,
              :max_points,
              :weight_percentage,
              :due_at,
              :sort_order,
              :is_published
            )
            """
        ),
        {
            "course_offering_id": payload.offering_id,
            "name": payload.name,
            "component_type": payload.component_type,
            "max_points": payload.max_points,
            "weight_percentage": payload.weight_percentage,
            "due_at": payload.due_at,
            "sort_order": payload.sort_order,
            "is_published": payload.is_published,
        },
    )
    component_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    db.commit()

    return {
        "component_id": int(component_id),
        "offering_id": offering["offering_id"],
        "course_code": offering["code"],
        "course_title": offering["title"],
        "name": payload.name,
        "component_type": payload.component_type,
        "weight_percentage": payload.weight_percentage,
    }


def record_grade_scores(
    db: Session,
    user_id: int,
    component_id: int,
    payload: GradeRecordBulkRequest,
    actor_roles: list[str] | None = None,
) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    component = _get_grade_component_for_teacher(
        db,
        teacher["teacher_id"],
        component_id,
        allow_unassigned=_can_manage_all_academic(actor_roles),
    )

    valid_students = {
        student["student_id"]: student
        for student in _get_enrolled_students_for_offering(db, component["offering_id"])
    }

    for record in payload.records:
        if record.student_id not in valid_students:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more students are not enrolled in this offering.",
            )
        if record.score_awarded is not None and record.score_awarded > float(component["max_points"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scores cannot exceed the component maximum of {component['max_points']}.",
            )

        percentage = None
        letter_grade = None
        if record.score_awarded is not None:
            percentage = round((record.score_awarded / float(component["max_points"])) * 100, 2)
            letter_grade = _calculate_letter_grade(percentage)

        graded_at = datetime.now(UTC).replace(tzinfo=None)
        published_at = graded_at if record.publish else None

        db.execute(
            text(
                """
                INSERT INTO grade_records (
                  grade_component_id,
                  student_id,
                  score_awarded,
                  percentage,
                  letter_grade,
                  remarks,
                  graded_by_teacher_id,
                  graded_at,
                  published_at
                ) VALUES (
                  :grade_component_id,
                  :student_id,
                  :score_awarded,
                  :percentage,
                  :letter_grade,
                  :remarks,
                  :graded_by_teacher_id,
                  :graded_at,
                  :published_at
                )
                ON DUPLICATE KEY UPDATE
                  score_awarded = VALUES(score_awarded),
                  percentage = VALUES(percentage),
                  letter_grade = VALUES(letter_grade),
                  remarks = VALUES(remarks),
                  graded_by_teacher_id = VALUES(graded_by_teacher_id),
                  graded_at = VALUES(graded_at),
                  published_at = CASE
                    WHEN VALUES(published_at) IS NULL THEN grade_records.published_at
                    ELSE VALUES(published_at)
                  END
                """
            ),
            {
                "grade_component_id": component_id,
                "student_id": record.student_id,
                "score_awarded": record.score_awarded,
                "percentage": percentage,
                "letter_grade": letter_grade,
                "remarks": record.remarks,
                "graded_by_teacher_id": teacher.get("teacher_id"),
                "graded_at": graded_at,
                "published_at": published_at,
            },
        )

    db.commit()

    return {
        "component_id": int(component_id),
        "recorded_scores": len(payload.records),
        "message": f"Scores saved for {component['name']}.",
    }


def publish_final_grades(
    db: Session,
    user_id: int,
    payload: FinalGradesPublishRequest,
    actor_roles: list[str] | None = None,
) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    offering = _ensure_teacher_offering(db, teacher["teacher_id"], payload.offering_id, allow_unassigned=_can_manage_all_academic(actor_roles))

    valid_enrollments = {
        row["enrollment_id"]: row
        for row in db.execute(
            text(
                """
                SELECT
                  e.id AS enrollment_id
                FROM enrollments e
                WHERE e.course_offering_id = :offering_id
                  AND e.status IN ('enrolled', 'completed')
                """
            ),
            {"offering_id": payload.offering_id},
        ).mappings().all()
    }

    published_at = datetime.now(UTC).replace(tzinfo=None)
    for grade in payload.grades:
        if grade.enrollment_id not in valid_enrollments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more enrollments do not belong to this offering.",
            )

        letter_grade = _calculate_letter_grade(grade.numeric_grade)
        grade_points = _grade_points_for_letter(letter_grade)

        db.execute(
            text(
                """
                UPDATE enrollments
                SET final_numeric_grade = :numeric_grade,
                    final_letter_grade = :letter_grade,
                    grade_points = :grade_points,
                    final_grade_status = 'published',
                    final_grade_published_at = :published_at,
                    final_grade_approved_by_teacher_id = :approved_by_teacher_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :enrollment_id
                """
            ),
            {
                "numeric_grade": grade.numeric_grade,
                "letter_grade": letter_grade,
                "grade_points": grade_points,
                "published_at": published_at,
                "approved_by_teacher_id": teacher.get("teacher_id"),
                "enrollment_id": grade.enrollment_id,
            },
        )

    db.commit()

    return {
        "offering_id": offering["offering_id"],
        "published_count": len(payload.grades),
        "message": f"Final grades published for {offering['code']} - {offering['title']}.",
    }


def get_teacher_dashboard(db: Session, user_id: int) -> dict:
    teacher = _get_teacher_profile(db, user_id)
    teacher_id = teacher["teacher_id"]

    summary = db.execute(
        text(
            """
            SELECT
              (SELECT COUNT(*) FROM course_offerings WHERE teacher_id = :teacher_id) AS assigned_courses,
              (
                SELECT COUNT(DISTINCT e.student_id)
                FROM enrollments e
                JOIN course_offerings co ON co.id = e.course_offering_id
                WHERE co.teacher_id = :teacher_id
                  AND e.status = 'enrolled'
              ) AS active_students,
              (
                SELECT COUNT(*)
                FROM course_meetings cm
                JOIN course_offerings co ON co.id = cm.course_offering_id
                WHERE co.teacher_id = :teacher_id
              ) AS scheduled_meetings,
              (
                SELECT COUNT(*)
                FROM final_grades fg
                WHERE fg.approved_by_teacher_id = :teacher_id
                  AND fg.status = 'published'
              ) AS published_final_grades,
              (
                SELECT COUNT(*)
                FROM notification_recipients nr
                WHERE nr.user_id = :user_id
                  AND nr.read_at IS NULL
              ) AS unread_notifications
            """
        ),
        {"teacher_id": teacher_id, "user_id": user_id},
    ).mappings().one()

    today_schedule = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              co.section_code,
              cm.start_time,
              cm.end_time,
              COALESCE(r.name, r.code, 'TBA') AS room_name
            FROM course_meetings cm
            JOIN course_offerings co ON co.id = cm.course_offering_id
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN rooms r ON r.id = COALESCE(cm.room_id, co.room_id)
            WHERE co.teacher_id = :teacher_id
              AND cm.day_of_week = LOWER(DAYNAME(CURDATE()))
            ORDER BY cm.start_time ASC
            LIMIT 20
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    course_health = db.execute(
        text(
            """
            SELECT
              c.code,
              c.title,
              co.section_code,
              co.status,
              COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) AS enrolled_count,
              co.capacity
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            WHERE co.teacher_id = :teacher_id
            GROUP BY
              c.code,
              c.title,
              co.section_code,
              co.status,
              co.capacity
            ORDER BY c.code ASC, co.section_code ASC
            LIMIT 8
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "summary": {
            "assigned_courses": int(summary["assigned_courses"] or 0),
            "active_students": int(summary["active_students"] or 0),
            "scheduled_meetings": int(summary["scheduled_meetings"] or 0),
            "published_final_grades": int(summary["published_final_grades"] or 0),
            "unread_notifications": int(summary["unread_notifications"] or 0),
        },
        "today_schedule": [dict(item) for item in today_schedule],
        "course_health": [dict(item) for item in course_health],
    }


def get_teacher_courses(db: Session, user_id: int) -> dict:
    teacher = _get_teacher_profile(db, user_id)
    teacher_id = teacher["teacher_id"]

    items = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              c.credit_hours,
              at.name AS term_name,
              co.section_code,
              co.delivery_mode,
              co.capacity,
              co.status,
              COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) AS enrolled_count,
              GROUP_CONCAT(
                DISTINCT CONCAT(
                  UPPER(LEFT(cm.day_of_week, 3)),
                  ' ',
                  TIME_FORMAT(cm.start_time, '%h:%i %p'),
                  '-',
                  TIME_FORMAT(cm.end_time, '%h:%i %p')
                )
                ORDER BY cm.day_of_week, cm.start_time
                SEPARATOR ' | '
              ) AS meeting_summary
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            JOIN academic_terms at ON at.id = co.academic_term_id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            LEFT JOIN course_meetings cm ON cm.course_offering_id = co.id
            WHERE co.teacher_id = :teacher_id
            GROUP BY
              co.id,
              c.code,
              c.title,
              c.credit_hours,
              at.name,
              co.section_code,
              co.delivery_mode,
              co.capacity,
              co.status
            ORDER BY at.start_date DESC, c.code ASC, co.section_code ASC
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "items": [dict(item) for item in items],
    }


def get_teacher_students(db: Session, user_id: int, actor_roles: list[str] | None = None) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    teacher_id = teacher["teacher_id"]
    access_filter = "" if _can_manage_all_academic(actor_roles) else "WHERE co.teacher_id = :teacher_id"

    items = db.execute(
        text(
            f"""
            SELECT
              e.id AS enrollment_id,
              co.id AS offering_id,
              sp.id AS student_id,
              sp.student_number,
              u.first_name,
              u.last_name,
              u.email,
              c.code AS course_code,
              c.title AS course_title,
              co.section_code,
              e.status AS enrollment_status,
              COALESCE(risk.risk_level, 'low') AS risk_level,
              fg.numeric_grade,
              fg.letter_grade
            FROM enrollments e
            JOIN course_offerings co ON co.id = e.course_offering_id
            JOIN courses c ON c.id = co.course_id
            JOIN student_profiles sp ON sp.id = e.student_id
            JOIN users u ON u.id = sp.user_id
            LEFT JOIN vw_latest_student_risk risk ON risk.student_id = sp.id
            LEFT JOIN final_grades fg ON fg.enrollment_id = e.id
            {access_filter}
            ORDER BY c.code ASC, u.last_name ASC, u.first_name ASC
            LIMIT 300
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "items": [dict(item) for item in items],
    }


def get_teacher_attendance_hub(db: Session, user_id: int, actor_roles: list[str] | None = None) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    teacher_id = teacher["teacher_id"]
    access_filter = "" if _can_manage_all_academic(actor_roles) else "WHERE co.teacher_id = :teacher_id"

    summary = db.execute(
        text(
            f"""
            SELECT
              COUNT(DISTINCT attendance_sessions.id) AS total_sessions,
              COUNT(DISTINCT CASE WHEN attendance_sessions.session_date = CURDATE() THEN attendance_sessions.id END) AS today_sessions,
              COUNT(DISTINCT attendance_records.id) AS recorded_marks,
              COUNT(DISTINCT CASE WHEN attendance_records.status = 'absent' THEN attendance_records.id END) AS absences_logged
            FROM course_offerings co
            LEFT JOIN attendance_sessions ON attendance_sessions.course_offering_id = co.id
            LEFT JOIN attendance_records ON attendance_records.attendance_session_id = attendance_sessions.id
            {access_filter}
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().one()

    recent_sessions = db.execute(
        text(
            f"""
            SELECT
              attendance_sessions.id AS session_id,
              co.id AS offering_id,
              c.code,
              c.title,
              co.section_code,
              attendance_sessions.session_date,
              attendance_sessions.topic,
              attendance_sessions.status,
              COUNT(attendance_records.id) AS recorded_students,
              SUM(CASE WHEN attendance_records.status = 'absent' THEN 1 ELSE 0 END) AS absent_students
            FROM attendance_sessions
            JOIN course_offerings co ON co.id = attendance_sessions.course_offering_id
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN attendance_records ON attendance_records.attendance_session_id = attendance_sessions.id
            {access_filter}
            GROUP BY
              attendance_sessions.id,
              co.id,
              c.code,
              c.title,
              co.section_code,
              attendance_sessions.session_date,
              attendance_sessions.topic,
              attendance_sessions.status
            ORDER BY attendance_sessions.session_date DESC, attendance_sessions.id DESC
            LIMIT 20
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    offerings = db.execute(
        text(
            f"""
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              co.section_code,
              co.status,
              COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) AS enrolled_count
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            {access_filter}
            GROUP BY
              co.id,
              c.code,
              c.title,
              co.section_code,
              co.status
            ORDER BY c.code ASC, co.section_code ASC
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "summary": {
            "total_sessions": int(summary["total_sessions"] or 0),
            "today_sessions": int(summary["today_sessions"] or 0),
            "recorded_marks": int(summary["recorded_marks"] or 0),
            "absences_logged": int(summary["absences_logged"] or 0),
        },
        "offerings": [dict(item) for item in offerings],
        "recent_sessions": [dict(item) for item in recent_sessions],
    }


def get_teacher_gradebook(db: Session, user_id: int, actor_roles: list[str] | None = None) -> dict:
    teacher = _get_academic_actor(db, user_id, actor_roles)
    teacher_id = teacher["teacher_id"]
    access_filter = "" if _can_manage_all_academic(actor_roles) else "WHERE co.teacher_id = :teacher_id"

    summary = db.execute(
        text(
            f"""
            SELECT
              COUNT(DISTINCT gc.id) AS grade_components,
              COUNT(DISTINCT gr.id) AS graded_records,
              COUNT(DISTINCT CASE WHEN fg.status = 'published' THEN fg.id END) AS published_final_grades
            FROM course_offerings co
            LEFT JOIN grade_components gc ON gc.course_offering_id = co.id
            LEFT JOIN grade_records gr ON gr.grade_component_id = gc.id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            LEFT JOIN final_grades fg ON fg.enrollment_id = e.id
            {access_filter}
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().one()

    offerings = db.execute(
        text(
            f"""
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              co.section_code,
              COUNT(DISTINCT gc.id) AS component_count,
              COUNT(DISTINCT gr.id) AS graded_records,
              COUNT(DISTINCT CASE WHEN fg.status = 'published' THEN fg.id END) AS published_final_grades
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN grade_components gc ON gc.course_offering_id = co.id
            LEFT JOIN grade_records gr ON gr.grade_component_id = gc.id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            LEFT JOIN final_grades fg ON fg.enrollment_id = e.id
            {access_filter}
            GROUP BY
              co.id,
              c.code,
              c.title,
              co.section_code
            ORDER BY c.code ASC, co.section_code ASC
            LIMIT 50
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    components = db.execute(
        text(
            f"""
            SELECT
              gc.id AS component_id,
              gc.course_offering_id AS offering_id,
              gc.name,
              gc.component_type,
              gc.max_points,
              gc.weight_percentage,
              gc.due_at,
              gc.sort_order,
              gc.is_published
            FROM grade_components gc
            JOIN course_offerings co ON co.id = gc.course_offering_id
            {access_filter}
            ORDER BY gc.course_offering_id ASC, gc.sort_order ASC, gc.id ASC
            """
        ),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "summary": {
            "grade_components": int(summary["grade_components"] or 0),
            "graded_records": int(summary["graded_records"] or 0),
            "published_final_grades": int(summary["published_final_grades"] or 0),
        },
        "offerings": [dict(item) for item in offerings],
        "components": [dict(item) for item in components],
    }


def get_instructor_timetable(db: Session, user_id: int) -> dict:
    teacher = _get_teacher_profile(db, user_id)
    meetings = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              co.section_code,
              cm.day_of_week,
              cm.start_time,
              cm.end_time,
              COALESCE(r.name, co.schedule_notes) AS location_name,
              cm.meeting_type
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            JOIN course_meetings cm ON cm.course_offering_id = co.id
            LEFT JOIN rooms r ON r.id = COALESCE(cm.room_id, co.room_id)
            WHERE co.teacher_id = :teacher_id
              AND co.status IN ('open', 'in_progress', 'completed')
            ORDER BY FIELD(
              cm.day_of_week,
              'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
            ), cm.start_time ASC
            """
        ),
        {"teacher_id": teacher["teacher_id"]},
    ).mappings().all()

    return {
        "teacher": teacher,
        "meetings": [dict(item) for item in meetings],
    }


def get_teacher_inbox(db: Session, user_id: int) -> dict:
    teacher = _get_teacher_profile(db, user_id)

    items = db.execute(
        text(
            """
            SELECT
              nr.id AS recipient_id,
              n.id AS notification_id,
              n.category,
              n.severity,
              n.title,
              n.message,
              n.action_label,
              n.action_url,
              n.created_at,
              nr.read_at
            FROM notification_recipients nr
            JOIN notifications n ON n.id = nr.notification_id
            WHERE nr.user_id = :user_id
              AND n.category != 'audit'
            ORDER BY n.created_at DESC, nr.id DESC
            LIMIT 100
            """
        ),
        {"user_id": user_id},
    ).mappings().all()

    return {
        "teacher": teacher,
        "items": [dict(item) for item in items],
    }
