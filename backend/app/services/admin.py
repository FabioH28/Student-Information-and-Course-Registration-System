from datetime import UTC, date, datetime
import re
import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.rbac import (
    ROLE_ACADEMIC_STAFF,
    ROLE_COMMUNICATION_STAFF,
    ROLE_FINANCE_STAFF,
    ROLE_INSTRUCTOR,
    ROLE_STUDENT,
    ROLE_SYSTEM_ADMIN,
    STAFF_ROLES,
)
from app.core.security import hash_password
from app.schemas.admin import (
    AcademicTermUpsertRequest,
    AdminCreateUserRequest,
    AdminPasswordResetResponse,
    AdminProvisionUserResponse,
    CampusEventUpsertRequest,
    ClubJoinRequestReviewRequest,
    ClubUpsertRequest,
    CourseOfferingUpsertRequest,
    EnrollmentStatusUpdateRequest,
    FinancialHoldCreateRequest,
    InvoiceCreateRequest,
    NewsPostUpsertRequest,
    PaymentCreateRequest,
    ProvisionedIdentifiers,
    UserStatusUpdateRequest,
)
from app.schemas.auth import UserSummary
from app.services.auth import get_identity_by_email, get_identity_by_user_id, serialize_user


def _create_audit_log(
    db: Session,
    actor_user_id: int | None,
    entity_type: str,
    entity_id: str | int,
    action: str,
    summary: str,
) -> None:
    return


def _get_admin_profile_id(db: Session, user_id: int) -> int:
    admin_profile_id = db.execute(
        text("SELECT id FROM admin_profiles WHERE user_id = :user_id"),
        {"user_id": user_id},
    ).scalar_one_or_none()
    if admin_profile_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No admin profile is linked to this account.")
    return int(admin_profile_id)


def _get_student_user_context(db: Session, student_id: int) -> dict:
    row = db.execute(
        text(
            """
            SELECT
              sp.id AS student_id,
              sp.student_number,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.email
            FROM student_profiles sp
            JOIN users u ON u.id = sp.user_id
            WHERE sp.id = :student_id
            """
        ),
        {"student_id": student_id},
    ).mappings().first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
    return dict(row)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "club"


def _generate_unique_club_slug(db: Session, name: str, club_id: int | None = None) -> str:
    base_slug = _slugify(name)
    slug = base_slug
    counter = 2

    while True:
        params: dict[str, object] = {"slug": slug}
        where_clause = "slug = :slug"
        if club_id is not None:
            where_clause += " AND id <> :club_id"
            params["club_id"] = club_id

        existing = db.execute(
            text(f"SELECT id FROM clubs WHERE {where_clause} LIMIT 1"),
            params,
        ).scalar_one_or_none()
        if existing is None:
            return slug

        slug = f"{base_slug}-{counter}"
        counter += 1


def _create_notification(
    db: Session,
    *,
    user_ids: list[int],
    category: str,
    severity: str,
    title: str,
    message: str,
    created_by_user_id: int | None,
    action_label: str | None = None,
    action_url: str | None = None,
    source_entity_type: str | None = None,
    source_entity_id: int | None = None,
) -> None:
    recipient_ids = sorted({int(user_id) for user_id in user_ids})
    if not recipient_ids:
        return

    delivered_at = datetime.now(UTC).replace(tzinfo=None)
    for recipient_user_id in recipient_ids:
        db.execute(
            text(
                """
                INSERT INTO notifications (
                  user_id,
                  category,
                  severity,
                  title,
                  message,
                  action_label,
                  action_url,
                  source_entity_type,
                  source_entity_id,
                  created_by_user_id,
                  delivered_at
                ) VALUES (
                  :user_id,
                  :category,
                  :severity,
                  :title,
                  :message,
                  :action_label,
                  :action_url,
                  :source_entity_type,
                  :source_entity_id,
                  :created_by_user_id,
                  :delivered_at
                )
                """
            ),
            {
                "user_id": recipient_user_id,
                "category": category,
                "severity": severity,
                "title": title,
                "message": message,
                "action_label": action_label,
                "action_url": action_url,
                "source_entity_type": source_entity_type,
                "source_entity_id": source_entity_id,
                "created_by_user_id": created_by_user_id,
                "delivered_at": delivered_at,
            },
        )


def get_admin_dashboard(db: Session) -> dict:
    stats = db.execute(
        text(
            """
            SELECT
              (SELECT COUNT(*) FROM student_profiles) AS total_students,
              (SELECT COUNT(*) FROM courses WHERE is_active = TRUE) AS active_courses,
              (
                SELECT COUNT(*)
                FROM enrollments e
                JOIN course_offerings co ON co.id = e.course_offering_id
                WHERE co.academic_term_id = (
                  SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1
                )
              ) AS current_registrations,
              (
                SELECT COUNT(*)
                FROM vw_latest_student_risk
                WHERE risk_level IN ('medium', 'high')
              ) AS at_risk_students
            """
        )
    ).mappings().one()

    popular_courses = db.execute(
        text(
            """
            SELECT
              c.code,
              c.title,
              COUNT(e.id) AS enrolled_count,
              co.capacity
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            LEFT JOIN enrollments e
              ON e.course_offering_id = co.id
             AND e.status = 'enrolled'
            WHERE co.academic_term_id = (
              SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1
            )
            GROUP BY c.code, c.title, co.capacity
            ORDER BY enrolled_count DESC, c.code ASC
            LIMIT 10
            """
        )
    ).mappings().all()

    risk_distribution = db.execute(
        text(
            """
            SELECT risk_level, COUNT(*) AS total
            FROM vw_latest_student_risk
            GROUP BY risk_level
            ORDER BY FIELD(risk_level, 'low', 'medium', 'high')
            """
        )
    ).mappings().all()

    recent_activity = db.execute(
        text(
            """
            SELECT
              action,
              summary,
              entity_type,
              created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 20
            """
        )
    ).mappings().all()

    return {
        "summary": {
            "total_students": int(stats["total_students"] or 0),
            "active_courses": int(stats["active_courses"] or 0),
            "current_registrations": int(stats["current_registrations"] or 0),
            "at_risk_students": int(stats["at_risk_students"] or 0),
        },
        "popular_courses": [dict(item) for item in popular_courses],
        "risk_distribution": [dict(item) for item in risk_distribution],
        "recent_activity": [dict(item) for item in recent_activity],
    }


def list_students(db: Session) -> dict:
    students = db.execute(
        text(
            """
            SELECT
              sp.id AS student_id,
              u.id AS user_id,
              sp.student_number,
              u.first_name,
              u.last_name,
              u.email,
              sp.status AS academic_status,
              u.status AS account_status,
              u.must_change_password,
              sp.current_semester,
              sp.cumulative_gpa,
              d.name AS department_name,
              p.name AS program_name
            FROM student_profiles sp
            JOIN users u ON u.id = sp.user_id
            JOIN departments d ON d.id = sp.department_id
            JOIN programs p ON p.id = sp.program_id
            ORDER BY u.last_name ASC, u.first_name ASC
            LIMIT 200
            """
        )
    ).mappings().all()
    return {"items": [dict(item) for item in students]}


def get_admin_reference_data(db: Session) -> dict:
    departments = db.execute(
        text(
            """
            SELECT
              id,
              code,
              name,
              status
            FROM departments
            WHERE status = 'active'
            ORDER BY name ASC
            """
        )
    ).mappings().all()

    programs = db.execute(
        text(
            """
            SELECT
              id,
              department_id,
              code,
              name,
              degree_level,
              duration_semesters,
              total_credits_required,
              status
            FROM programs
            WHERE status = 'active'
            ORDER BY name ASC
            """
        )
    ).mappings().all()

    teachers = db.execute(
        text(
            """
            SELECT
              tp.id AS teacher_profile_id,
              tp.employee_number,
              CONCAT(u.first_name, ' ', u.last_name) AS full_name,
              u.email,
              tp.title,
              d.name AS department_name
            FROM teacher_profiles tp
            JOIN users u ON u.id = tp.user_id
            JOIN departments d ON d.id = tp.department_id
            WHERE u.status = 'active'
              AND tp.employment_status = 'active'
            ORDER BY u.last_name ASC, u.first_name ASC
            """
        )
    ).mappings().all()

    rooms = db.execute(
        text(
            """
            SELECT
              r.id,
              r.code,
              COALESCE(r.name, r.code) AS name,
              r.capacity,
              r.room_type,
              b.name AS building_name
            FROM rooms r
            JOIN buildings b ON b.id = r.building_id
            ORDER BY b.name ASC, r.code ASC
            """
        )
    ).mappings().all()

    terms = db.execute(
        text(
            """
            SELECT
              id,
              code,
              name,
              status,
              is_current,
              start_date,
              end_date
            FROM academic_terms
            ORDER BY start_date DESC, id DESC
            """
        )
    ).mappings().all()

    students = db.execute(
        text(
            """
            SELECT
              sp.id AS student_id,
              sp.student_number,
              u.id AS user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS full_name,
              u.email,
              d.name AS department_name,
              p.name AS program_name
            FROM student_profiles sp
            JOIN users u ON u.id = sp.user_id
            JOIN departments d ON d.id = sp.department_id
            JOIN programs p ON p.id = sp.program_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.last_name ASC, u.first_name ASC
            LIMIT 300
            """
        )
    ).mappings().all()

    club_categories = db.execute(
        text(
            """
            SELECT
              id,
              code,
              name,
              description
            FROM club_categories
            ORDER BY name ASC
            """
        )
    ).mappings().all()

    roles = db.execute(
        text(
            """
            SELECT
              code,
              name
            FROM roles
            WHERE code IN (
              :student_role,
              :instructor_role,
              :academic_staff_role,
              :finance_staff_role,
              :communication_staff_role,
              :system_admin_role
            )
            ORDER BY FIELD(
              code,
              :student_role,
              :instructor_role,
              :academic_staff_role,
              :finance_staff_role,
              :communication_staff_role,
              :system_admin_role
            )
            """
        ),
        {
            "student_role": ROLE_STUDENT,
            "instructor_role": ROLE_INSTRUCTOR,
            "academic_staff_role": ROLE_ACADEMIC_STAFF,
            "finance_staff_role": ROLE_FINANCE_STAFF,
            "communication_staff_role": ROLE_COMMUNICATION_STAFF,
            "system_admin_role": ROLE_SYSTEM_ADMIN,
        },
    ).mappings().all()

    return {
        "departments": [dict(item) for item in departments],
        "programs": [dict(item) for item in programs],
        "teachers": [dict(item) for item in teachers],
        "rooms": [dict(item) for item in rooms],
        "terms": [dict(item) for item in terms],
        "students": [dict(item) for item in students],
        "club_categories": [dict(item) for item in club_categories],
        "roles": [dict(item) for item in roles],
    }


def get_admin_staff_overview(db: Session) -> dict:
    teachers = db.execute(
        text(
            """
            SELECT
              tp.id AS teacher_profile_id,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              tp.employee_number,
              tp.title,
              tp.office_location,
              tp.employment_status,
              d.name AS department_name,
              MAX(CASE WHEN ur.is_primary = TRUE THEN r.code END) AS primary_role,
              COUNT(DISTINCT co.id) AS assigned_offerings
            FROM teacher_profiles tp
            JOIN users u ON u.id = tp.user_id
            JOIN departments d ON d.id = tp.department_id
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            LEFT JOIN course_offerings co ON co.teacher_id = tp.id
            GROUP BY
              tp.id,
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              tp.employee_number,
              tp.title,
              tp.office_location,
              tp.employment_status,
              d.name
            ORDER BY u.last_name ASC, u.first_name ASC
            LIMIT 200
            """
        )
    ).mappings().all()

    staff_members = db.execute(
        text(
            """
            SELECT
              ap.id AS admin_profile_id,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              ap.employee_number,
              ap.title,
              ap.office_location,
              ap.employment_status,
              MAX(CASE WHEN ur.is_primary = TRUE THEN r.code END) AS primary_role,
              GROUP_CONCAT(DISTINCT r.code ORDER BY ur.is_primary DESC, r.code SEPARATOR ',') AS roles_csv
            FROM admin_profiles ap
            JOIN users u ON u.id = ap.user_id
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE EXISTS (
              SELECT 1
              FROM user_roles ur_scope
              JOIN roles r_scope ON r_scope.id = ur_scope.role_id
              WHERE ur_scope.user_id = u.id
                AND r_scope.code IN (
                  :academic_staff_role,
                  :finance_staff_role,
                  :communication_staff_role,
                  :system_admin_role
                )
            )
            GROUP BY
              ap.id,
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              ap.employee_number,
              ap.title,
              ap.office_location,
              ap.employment_status
            ORDER BY u.last_name ASC, u.first_name ASC
            LIMIT 200
            """
        ),
        {
            "academic_staff_role": ROLE_ACADEMIC_STAFF,
            "finance_staff_role": ROLE_FINANCE_STAFF,
            "communication_staff_role": ROLE_COMMUNICATION_STAFF,
            "system_admin_role": ROLE_SYSTEM_ADMIN,
        },
    ).mappings().all()

    return {
        "summary": {
            "teachers": len(teachers),
            "staff_members": len(staff_members),
        },
        "teachers": [dict(item) for item in teachers],
        "staff_members": [dict(item) for item in staff_members],
    }


def _get_teacher_assignment_summary(db: Session, teacher_profile_id: int) -> dict:
    teacher = db.execute(
        text(
            """
            SELECT
              tp.id AS teacher_profile_id,
              tp.employee_number,
              tp.title,
              tp.office_location,
              tp.employment_status,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              d.name AS department_name,
              COUNT(DISTINCT co.id) AS assigned_offerings
            FROM teacher_profiles tp
            JOIN users u ON u.id = tp.user_id
            JOIN departments d ON d.id = tp.department_id
            LEFT JOIN course_offerings co ON co.teacher_id = tp.id
            WHERE tp.id = :teacher_profile_id
            GROUP BY
              tp.id,
              tp.employee_number,
              tp.title,
              tp.office_location,
              tp.employment_status,
              u.id,
              u.first_name,
              u.last_name,
              u.email,
              u.status,
              d.name
            """
        ),
        {"teacher_profile_id": teacher_profile_id},
    ).mappings().first()

    if teacher is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found.")

    teacher_dict = dict(teacher)
    teacher_dict["assigned_offerings"] = int(teacher_dict["assigned_offerings"] or 0)
    teacher_dict["full_name"] = f"{teacher_dict['first_name']} {teacher_dict['last_name']}".strip()
    return teacher_dict


def _build_in_clause(values: list[int], prefix: str) -> tuple[str, dict[str, int]]:
    params = {f"{prefix}_{index}": value for index, value in enumerate(values)}
    clause = ", ".join(f":{name}" for name in params)
    return clause, params


def get_admin_teacher_offering_assignments(db: Session, teacher_profile_id: int) -> dict:
    teacher = _get_teacher_assignment_summary(db, teacher_profile_id)

    offerings = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.code,
              c.title,
              at.name AS term_name,
              co.section_code,
              co.status,
              co.capacity,
              COUNT(DISTINCT CASE WHEN e.status = 'enrolled' THEN e.id END) AS enrolled_count,
              co.teacher_id AS assigned_teacher_profile_id,
              CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) AS assigned_teacher_name,
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
            LEFT JOIN teacher_profiles assigned_teacher ON assigned_teacher.id = co.teacher_id
            LEFT JOIN users assigned_user ON assigned_user.id = assigned_teacher.user_id
            GROUP BY
              co.id,
              c.code,
              c.title,
              at.name,
              co.section_code,
              co.status,
              co.capacity,
              co.teacher_id,
              assigned_user.first_name,
              assigned_user.last_name,
              at.start_date
            ORDER BY at.start_date DESC, c.code ASC, co.section_code ASC
            LIMIT 250
            """
        )
    ).mappings().all()

    items: list[dict] = []
    for offering in offerings:
        item = dict(offering)
        assigned_teacher_id = item["assigned_teacher_profile_id"]
        item["assigned_to_selected_teacher"] = assigned_teacher_id == teacher_profile_id
        item["reassigning"] = assigned_teacher_id is not None and assigned_teacher_id != teacher_profile_id
        item["enrolled_count"] = int(item["enrolled_count"] or 0)
        items.append(item)

    return {
        "teacher": teacher,
        "summary": {
            "total_offerings": len(items),
            "assigned_offerings": sum(1 for item in items if item["assigned_to_selected_teacher"]),
            "reassignable_offerings": sum(1 for item in items if item["reassigning"]),
        },
        "offerings": items,
    }


def update_admin_teacher_offering_assignments(
    db: Session,
    actor_user_id: int,
    teacher_profile_id: int,
    offering_ids: list[int],
) -> dict:
    teacher = _get_teacher_assignment_summary(db, teacher_profile_id)
    normalized_ids = sorted({int(offering_id) for offering_id in offering_ids})

    reassigned_count = 0
    if normalized_ids:
        in_clause, params = _build_in_clause(normalized_ids, "offering_id")
        existing_offerings = db.execute(
            text(
                f"""
                SELECT id, teacher_id
                FROM course_offerings
                WHERE id IN ({in_clause})
                """
            ),
            params,
        ).mappings().all()

        if len(existing_offerings) != len(normalized_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more selected course offerings could not be found.",
            )

        reassigned_count = sum(
            1
            for item in existing_offerings
            if item["teacher_id"] is not None and int(item["teacher_id"]) != teacher_profile_id
        )

        db.execute(
            text(
                f"""
                UPDATE course_offerings
                SET teacher_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE teacher_id = :teacher_profile_id
                  AND id NOT IN ({in_clause})
                """
            ),
            {"teacher_profile_id": teacher_profile_id, **params},
        )
        db.execute(
            text(
                f"""
                UPDATE course_offerings
                SET teacher_id = :teacher_profile_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id IN ({in_clause})
                """
            ),
            {"teacher_profile_id": teacher_profile_id, **params},
        )
    else:
        db.execute(
            text(
                """
                UPDATE course_offerings
                SET teacher_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE teacher_id = :teacher_profile_id
                """
            ),
            {"teacher_profile_id": teacher_profile_id},
        )

    assigned_count = len(normalized_ids)
    db.commit()

    workspace = get_admin_teacher_offering_assignments(db, teacher_profile_id)
    workspace["message"] = f"Assignments updated for {teacher['full_name']}."
    return workspace


def get_admin_finance_overview(db: Session) -> dict:
    stats = db.execute(
        text(
            """
            SELECT
              COALESCE(SUM(balance_amount), 0) AS outstanding_balance,
              COUNT(*) AS total_invoices,
              SUM(CASE WHEN status IN ('overdue', 'partially_paid', 'issued') THEN 1 ELSE 0 END) AS open_invoices,
              (
                SELECT COUNT(*)
                FROM financial_holds
                WHERE status = 'active'
              ) AS active_holds,
              (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'confirmed'
              ) AS confirmed_payments
            FROM student_invoices
            WHERE status <> 'void'
            """
        )
    ).mappings().one()

    invoices = db.execute(
        text(
            """
            SELECT
              si.id,
              si.student_id,
              si.academic_term_id,
              si.invoice_number,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              at.name AS term_name,
              si.issue_date,
              si.total_amount,
              si.balance_amount,
              si.due_date,
              si.status,
              si.notes,
              (
                SELECT ii.description
                FROM invoice_items ii
                WHERE ii.invoice_id = si.id
                ORDER BY ii.id ASC
                LIMIT 1
              ) AS description
            FROM student_invoices si
            JOIN student_profiles sp ON sp.id = si.student_id
            JOIN users u ON u.id = sp.user_id
            LEFT JOIN academic_terms at ON at.id = si.academic_term_id
            WHERE si.status <> 'void'
            ORDER BY si.issue_date DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    holds = db.execute(
        text(
            """
            SELECT
              fh.id,
              fh.student_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              fh.hold_type,
              fh.reason,
              fh.status,
              fh.placed_at,
              fh.released_at
            FROM financial_holds fh
            JOIN student_profiles sp ON sp.id = fh.student_id
            JOIN users u ON u.id = sp.user_id
            ORDER BY fh.placed_at DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    payments = db.execute(
        text(
            """
            SELECT
              p.id,
              p.student_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              p.reference_number,
              p.payment_method,
              p.amount,
              p.currency,
              p.paid_at,
              p.status,
              p.notes,
              (
                SELECT pa.invoice_id
                FROM payment_allocations pa
                WHERE pa.payment_id = p.id
                ORDER BY pa.id ASC
                LIMIT 1
              ) AS invoice_id,
              (
                SELECT si.invoice_number
                FROM payment_allocations pa
                JOIN student_invoices si ON si.id = pa.invoice_id
                WHERE pa.payment_id = p.id
                ORDER BY pa.id ASC
                LIMIT 1
              ) AS invoice_number
            FROM payments p
            JOIN student_profiles sp ON sp.id = p.student_id
            JOIN users u ON u.id = sp.user_id
            ORDER BY p.paid_at DESC, p.id DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    return {
        "summary": {
            "outstanding_balance": float(stats["outstanding_balance"] or 0),
            "total_invoices": int(stats["total_invoices"] or 0),
            "open_invoices": int(stats["open_invoices"] or 0),
            "active_holds": int(stats["active_holds"] or 0),
            "confirmed_payments": float(stats["confirmed_payments"] or 0),
        },
        "invoices": [dict(item) for item in invoices],
        "holds": [dict(item) for item in holds],
        "payments": [dict(item) for item in payments],
    }


def get_admin_clubs_overview(db: Session) -> dict:
    clubs = db.execute(
        text(
            """
            SELECT
              vcs.*,
              c.category_id,
              c.description,
              c.advisor_teacher_id,
              c.capacity,
              c.meeting_day_of_week,
              c.meeting_start_time,
              c.meeting_end_time,
              c.meeting_location,
              c.contact_email,
              CONCAT(advisor_user.first_name, ' ', advisor_user.last_name) AS advisor_name
            FROM vw_club_summary vcs
            JOIN clubs c ON c.id = vcs.club_id
            LEFT JOIN teacher_profiles advisor ON advisor.id = c.advisor_teacher_id
            LEFT JOIN users advisor_user ON advisor_user.id = advisor.user_id
            ORDER BY vcs.club_name ASC
            """
        )
    ).mappings().all()

    requests = db.execute(
        text(
            """
            SELECT
              cjr.id,
              cjr.club_id,
              cjr.student_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              sp.student_number,
              c.name AS club_name,
              cjr.requested_role,
              cjr.status,
              cjr.submitted_at,
              cjr.reviewed_at,
              cjr.review_notes
            FROM club_join_requests cjr
            JOIN student_profiles sp ON sp.id = cjr.student_id
            JOIN users u ON u.id = sp.user_id
            JOIN clubs c ON c.id = cjr.club_id
            ORDER BY cjr.submitted_at DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    return {
        "clubs": [dict(item) for item in clubs],
        "join_requests": [dict(item) for item in requests],
    }


def get_admin_news_overview(db: Session) -> dict:
    posts = db.execute(
        text(
            """
            SELECT
              id,
              post_type,
              title,
              summary,
              body,
              priority,
              status,
              featured,
              visible_from,
              visible_until,
              published_at,
              COALESCE(published_at, created_at) AS activity_at
            FROM news_posts
            ORDER BY COALESCE(published_at, created_at) DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    events = db.execute(
        text(
            """
            SELECT
              id,
              club_id,
              title,
              description,
              organizer_name,
              event_type,
              location_name,
              delivery_mode,
              status,
              starts_at,
              ends_at,
              registration_required,
              capacity,
              expected_attendees
            FROM campus_events
            ORDER BY starts_at DESC
            LIMIT 100
            """
        )
    ).mappings().all()

    return {
        "posts": [dict(item) for item in posts],
        "events": [dict(item) for item in events],
    }


def get_admin_settings(db: Session) -> dict:
    items = db.execute(
        text(
            """
            SELECT
              id,
              setting_key,
              setting_label,
              value_type,
              value_text,
              description,
              updated_at
            FROM system_settings
            ORDER BY setting_key ASC
            """
        )
    ).mappings().all()
    return {"items": [dict(item) for item in items]}


def get_admin_courses(db: Session) -> dict:
    items = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.id AS course_id,
              c.department_id,
              c.code,
              c.title,
              c.description,
              c.credit_hours,
              c.level_number,
              c.course_type,
              c.grading_scheme,
              c.is_active,
              at.id AS academic_term_id,
              at.name AS term_name,
              co.section_code,
              co.teacher_id AS teacher_profile_id,
              co.room_id,
              co.delivery_mode,
              co.capacity,
              co.waitlist_capacity,
              co.status,
              co.registration_opens_at,
              co.registration_closes_at,
              co.schedule_notes,
              CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
              COUNT(DISTINCT CASE WHEN e.status = 'enrolled' THEN e.id END) AS enrolled_count,
              (
                SELECT cm.day_of_week
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_day_of_week,
              (
                SELECT cm.start_time
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_start_time,
              (
                SELECT cm.end_time
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_end_time,
              (
                SELECT cm.meeting_type
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_type,
              (
                SELECT GROUP_CONCAT(
                  DISTINCT CONCAT(
                    UPPER(LEFT(cm.day_of_week, 3)),
                    ' ',
                    TIME_FORMAT(cm.start_time, '%h:%i %p'),
                    '-',
                    TIME_FORMAT(cm.end_time, '%h:%i %p')
                  )
                  ORDER BY cm.day_of_week, cm.start_time
                  SEPARATOR ' | '
                )
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
              ) AS meeting_summary
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            JOIN academic_terms at ON at.id = co.academic_term_id
            LEFT JOIN teacher_profiles tp ON tp.id = co.teacher_id
            LEFT JOIN users u ON u.id = tp.user_id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            GROUP BY
              co.id,
              c.id,
              c.department_id,
              c.code,
              c.title,
              c.description,
              c.credit_hours,
              c.level_number,
              c.course_type,
              c.grading_scheme,
              c.is_active,
              at.id,
              at.name,
              co.section_code,
              co.teacher_id,
              co.room_id,
              co.delivery_mode,
              co.capacity,
              co.waitlist_capacity,
              co.status,
              co.registration_opens_at,
              co.registration_closes_at,
              co.schedule_notes,
              u.first_name,
              u.last_name
            ORDER BY at.start_date DESC, c.code ASC, co.section_code ASC
            LIMIT 250
            """
        )
    ).mappings().all()
    return {"items": [dict(item) for item in items]}


def get_admin_terms(db: Session) -> dict:
    items = db.execute(
        text(
            """
            SELECT
              at.id,
              at.code,
              at.name,
              at.academic_year_start,
              at.academic_year_end,
              at.term_number,
              at.status,
              at.is_current,
              at.start_date,
              at.end_date,
              at.registration_start_at,
              at.registration_end_at,
              COUNT(DISTINCT co.id) AS course_count,
              COUNT(DISTINCT CASE WHEN e.status IN ('pending', 'enrolled', 'waitlisted', 'completed') THEN e.student_id END) AS student_count
            FROM academic_terms at
            LEFT JOIN course_offerings co ON co.academic_term_id = at.id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            GROUP BY
              at.id,
              at.code,
              at.name,
              at.academic_year_start,
              at.academic_year_end,
              at.term_number,
              at.status,
              at.is_current,
              at.start_date,
              at.end_date,
              at.registration_start_at,
              at.registration_end_at
            ORDER BY at.start_date DESC
            LIMIT 50
            """
        )
    ).mappings().all()
    return {"items": [dict(item) for item in items]}


def _get_term_by_id(db: Session, term_id: int) -> dict:
    term = db.execute(
        text(
            """
            SELECT
              id,
              code,
              name,
              academic_year_start,
              academic_year_end,
              term_number,
              status,
              is_current,
              start_date,
              end_date,
              registration_start_at,
              registration_end_at
            FROM academic_terms
            WHERE id = :term_id
            """
        ),
        {"term_id": term_id},
    ).mappings().first()

    if term is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic term not found.")

    return dict(term)


def _ensure_department_exists(db: Session, department_id: int) -> None:
    exists = db.execute(
        text("SELECT id FROM departments WHERE id = :department_id"),
        {"department_id": department_id},
    ).scalar_one_or_none()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected department could not be found.")


def _ensure_teacher_exists(db: Session, teacher_profile_id: int | None) -> None:
    if teacher_profile_id is None:
        return

    exists = db.execute(
        text("SELECT id FROM teacher_profiles WHERE id = :teacher_profile_id"),
        {"teacher_profile_id": teacher_profile_id},
    ).scalar_one_or_none()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected teacher could not be found.")


def _ensure_room_exists(db: Session, room_id: int | None) -> None:
    if room_id is None:
        return

    exists = db.execute(
        text("SELECT id FROM rooms WHERE id = :room_id"),
        {"room_id": room_id},
    ).scalar_one_or_none()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected room could not be found.")


def _validate_term_payload(payload: AcademicTermUpsertRequest) -> None:
    if payload.academic_year_end < payload.academic_year_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academic year end cannot be earlier than academic year start.",
        )

    if payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Term end date must be after the start date.",
        )

    if payload.registration_end_at < payload.registration_start_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration closing time must be after the opening time.",
        )


def _validate_course_offering_payload(db: Session, payload: CourseOfferingUpsertRequest) -> None:
    _ensure_department_exists(db, payload.department_id)
    _get_term_by_id(db, payload.academic_term_id)
    _ensure_teacher_exists(db, payload.teacher_profile_id)
    _ensure_room_exists(db, payload.room_id)

    if payload.registration_opens_at and payload.registration_closes_at:
        if payload.registration_closes_at < payload.registration_opens_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration closing time must be after the opening time.",
            )

    meeting_parts = [payload.meeting_day_of_week, payload.meeting_start_time, payload.meeting_end_time]
    if any(part is not None for part in meeting_parts) and not all(part is not None for part in meeting_parts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting day, start time, and end time are all required when scheduling a meeting.",
        )

    if payload.meeting_start_time and payload.meeting_end_time and payload.meeting_end_time <= payload.meeting_start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting end time must be later than the start time.",
        )


def create_admin_term(db: Session, payload: AcademicTermUpsertRequest) -> dict:
    _validate_term_payload(payload)

    existing = db.execute(
        text("SELECT id FROM academic_terms WHERE code = :code"),
        {"code": payload.code.strip()},
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A term with this code already exists.")

    if payload.is_current:
        db.execute(text("UPDATE academic_terms SET is_current = FALSE WHERE is_current = TRUE"))

    db.execute(
        text(
            """
            INSERT INTO academic_terms (
              code,
              name,
              academic_year_start,
              academic_year_end,
              term_number,
              start_date,
              end_date,
              registration_start_at,
              registration_end_at,
              status,
              is_current
            ) VALUES (
              :code,
              :name,
              :academic_year_start,
              :academic_year_end,
              :term_number,
              :start_date,
              :end_date,
              :registration_start_at,
              :registration_end_at,
              :status,
              :is_current
            )
            """
        ),
        {
            "code": payload.code.strip(),
            "name": payload.name.strip(),
            "academic_year_start": payload.academic_year_start,
            "academic_year_end": payload.academic_year_end,
            "term_number": payload.term_number,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "registration_start_at": payload.registration_start_at,
            "registration_end_at": payload.registration_end_at,
            "status": payload.status,
            "is_current": payload.is_current,
        },
    )
    term_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    db.commit()

    return {
        "message": f"{payload.name.strip()} was created successfully.",
        "term": _get_term_by_id(db, term_id),
    }


def update_admin_term(db: Session, term_id: int, payload: AcademicTermUpsertRequest) -> dict:
    _validate_term_payload(payload)
    _get_term_by_id(db, term_id)

    existing = db.execute(
        text("SELECT id FROM academic_terms WHERE code = :code AND id <> :term_id"),
        {"code": payload.code.strip(), "term_id": term_id},
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A term with this code already exists.")

    if payload.is_current:
        db.execute(text("UPDATE academic_terms SET is_current = FALSE WHERE is_current = TRUE AND id <> :term_id"), {"term_id": term_id})

    db.execute(
        text(
            """
            UPDATE academic_terms
            SET code = :code,
                name = :name,
                academic_year_start = :academic_year_start,
                academic_year_end = :academic_year_end,
                term_number = :term_number,
                start_date = :start_date,
                end_date = :end_date,
                registration_start_at = :registration_start_at,
                registration_end_at = :registration_end_at,
                status = :status,
                is_current = :is_current,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :term_id
            """
        ),
        {
            "term_id": term_id,
            "code": payload.code.strip(),
            "name": payload.name.strip(),
            "academic_year_start": payload.academic_year_start,
            "academic_year_end": payload.academic_year_end,
            "term_number": payload.term_number,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "registration_start_at": payload.registration_start_at,
            "registration_end_at": payload.registration_end_at,
            "status": payload.status,
            "is_current": payload.is_current,
        },
    )
    db.commit()

    return {
        "message": f"{payload.name.strip()} was updated successfully.",
        "term": _get_term_by_id(db, term_id),
    }


def _sync_primary_course_meeting(db: Session, offering_id: int, payload: CourseOfferingUpsertRequest) -> None:
    db.execute(
        text(
            """
            UPDATE course_offerings
            SET meeting_day_of_week = :day_of_week,
                meeting_start_time = :start_time,
                meeting_end_time = :end_time,
                meeting_type = :meeting_type,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :offering_id
            """
        ),
        {
            "offering_id": offering_id,
            "day_of_week": payload.meeting_day_of_week,
            "start_time": payload.meeting_start_time,
            "end_time": payload.meeting_end_time,
            "meeting_type": payload.meeting_type,
        },
    )


def _get_course_offering_item(db: Session, offering_id: int) -> dict:
    row = db.execute(
        text(
            """
            SELECT
              co.id AS offering_id,
              c.id AS course_id,
              c.department_id,
              c.code,
              c.title,
              c.description,
              c.credit_hours,
              c.level_number,
              c.course_type,
              c.grading_scheme,
              c.is_active,
              at.id AS academic_term_id,
              at.name AS term_name,
              co.section_code,
              co.teacher_id AS teacher_profile_id,
              co.room_id,
              co.delivery_mode,
              co.capacity,
              co.waitlist_capacity,
              co.status,
              co.registration_opens_at,
              co.registration_closes_at,
              co.schedule_notes,
              CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
              COUNT(DISTINCT CASE WHEN e.status = 'enrolled' THEN e.id END) AS enrolled_count,
              (
                SELECT cm.day_of_week
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_day_of_week,
              (
                SELECT cm.start_time
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_start_time,
              (
                SELECT cm.end_time
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_end_time,
              (
                SELECT cm.meeting_type
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
                ORDER BY cm.id ASC
                LIMIT 1
              ) AS meeting_type,
              (
                SELECT GROUP_CONCAT(
                  DISTINCT CONCAT(
                    UPPER(LEFT(cm.day_of_week, 3)),
                    ' ',
                    TIME_FORMAT(cm.start_time, '%h:%i %p'),
                    '-',
                    TIME_FORMAT(cm.end_time, '%h:%i %p')
                  )
                  ORDER BY cm.day_of_week, cm.start_time
                  SEPARATOR ' | '
                )
                FROM course_meetings cm
                WHERE cm.course_offering_id = co.id
              ) AS meeting_summary
            FROM course_offerings co
            JOIN courses c ON c.id = co.course_id
            JOIN academic_terms at ON at.id = co.academic_term_id
            LEFT JOIN teacher_profiles tp ON tp.id = co.teacher_id
            LEFT JOIN users u ON u.id = tp.user_id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            WHERE co.id = :offering_id
            GROUP BY
              co.id,
              c.id,
              c.department_id,
              c.code,
              c.title,
              c.description,
              c.credit_hours,
              c.level_number,
              c.course_type,
              c.grading_scheme,
              c.is_active,
              at.id,
              at.name,
              co.section_code,
              co.teacher_id,
              co.room_id,
              co.delivery_mode,
              co.capacity,
              co.waitlist_capacity,
              co.status,
              co.registration_opens_at,
              co.registration_closes_at,
              co.schedule_notes,
              u.first_name,
              u.last_name
            """
        ),
        {"offering_id": offering_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course offering not found.")

    item = dict(row)
    item["enrolled_count"] = int(item["enrolled_count"] or 0)
    return item


def create_admin_course_offering(db: Session, actor_user_id: int, payload: CourseOfferingUpsertRequest) -> dict:
    _validate_course_offering_payload(db, payload)

    course = db.execute(
        text("SELECT id FROM courses WHERE code = :code"),
        {"code": payload.code.strip()},
    ).mappings().first()

    if course is None:
        db.execute(
            text(
                """
                INSERT INTO courses (
                  department_id,
                  code,
                  title,
                  description,
                  credit_hours,
                  level_number,
                  course_type,
                  grading_scheme,
                  is_active
                ) VALUES (
                  :department_id,
                  :code,
                  :title,
                  :description,
                  :credit_hours,
                  :level_number,
                  :course_type,
                  :grading_scheme,
                  :is_active
                )
                """
            ),
            {
                "department_id": payload.department_id,
                "code": payload.code.strip(),
                "title": payload.title.strip(),
                "description": payload.description,
                "credit_hours": payload.credit_hours,
                "level_number": payload.level_number,
                "course_type": payload.course_type,
                "grading_scheme": payload.grading_scheme,
                "is_active": payload.is_active,
            },
        )
        course_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    else:
        course_id = int(course["id"])
        db.execute(
            text(
                """
                UPDATE courses
                SET department_id = :department_id,
                    title = :title,
                    description = :description,
                    credit_hours = :credit_hours,
                    level_number = :level_number,
                    course_type = :course_type,
                    grading_scheme = :grading_scheme,
                    is_active = :is_active,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :course_id
                """
            ),
            {
                "course_id": course_id,
                "department_id": payload.department_id,
                "title": payload.title.strip(),
                "description": payload.description,
                "credit_hours": payload.credit_hours,
                "level_number": payload.level_number,
                "course_type": payload.course_type,
                "grading_scheme": payload.grading_scheme,
                "is_active": payload.is_active,
            },
        )

    conflict = db.execute(
        text(
            """
            SELECT id
            FROM course_offerings
            WHERE course_id = :course_id
              AND academic_term_id = :academic_term_id
              AND section_code = :section_code
            """
        ),
        {
            "course_id": course_id,
            "academic_term_id": payload.academic_term_id,
            "section_code": payload.section_code.strip(),
        },
    ).scalar_one_or_none()
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An offering with this course, term, and section already exists.",
        )

    db.execute(
        text(
            """
            INSERT INTO course_offerings (
              course_id,
              academic_term_id,
              teacher_id,
              room_id,
              section_code,
              delivery_mode,
              capacity,
              waitlist_capacity,
              status,
              registration_opens_at,
              registration_closes_at,
              schedule_notes,
              created_by_user_id
            ) VALUES (
              :course_id,
              :academic_term_id,
              :teacher_id,
              :room_id,
              :section_code,
              :delivery_mode,
              :capacity,
              :waitlist_capacity,
              :status,
              :registration_opens_at,
              :registration_closes_at,
              :schedule_notes,
              :created_by_user_id
            )
            """
        ),
        {
            "course_id": course_id,
            "academic_term_id": payload.academic_term_id,
            "teacher_id": payload.teacher_profile_id,
            "room_id": payload.room_id,
            "section_code": payload.section_code.strip(),
            "delivery_mode": payload.delivery_mode,
            "capacity": payload.capacity,
            "waitlist_capacity": payload.waitlist_capacity,
            "status": payload.status,
            "registration_opens_at": payload.registration_opens_at,
            "registration_closes_at": payload.registration_closes_at,
            "schedule_notes": payload.schedule_notes,
            "created_by_user_id": actor_user_id,
        },
    )
    offering_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    _sync_primary_course_meeting(db, offering_id, payload)
    db.commit()

    return {
        "message": f"{payload.code.strip()} - Section {payload.section_code.strip()} was created successfully.",
        "offering": _get_course_offering_item(db, offering_id),
    }


def update_admin_course_offering(db: Session, offering_id: int, payload: CourseOfferingUpsertRequest) -> dict:
    _validate_course_offering_payload(db, payload)

    existing = db.execute(
        text(
            """
            SELECT co.id AS offering_id, co.course_id
            FROM course_offerings co
            WHERE co.id = :offering_id
            """
        ),
        {"offering_id": offering_id},
    ).mappings().first()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course offering not found.")

    conflict = db.execute(
        text(
            """
            SELECT id
            FROM course_offerings
            WHERE course_id = :course_id
              AND academic_term_id = :academic_term_id
              AND section_code = :section_code
              AND id <> :offering_id
            """
        ),
        {
            "course_id": int(existing["course_id"]),
            "academic_term_id": payload.academic_term_id,
            "section_code": payload.section_code.strip(),
            "offering_id": offering_id,
        },
    ).scalar_one_or_none()
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another offering in this term already uses that section code for the same course.",
        )

    db.execute(
        text(
            """
            UPDATE courses
            SET department_id = :department_id,
                code = :code,
                title = :title,
                description = :description,
                credit_hours = :credit_hours,
                level_number = :level_number,
                course_type = :course_type,
                grading_scheme = :grading_scheme,
                is_active = :is_active,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :course_id
            """
        ),
        {
            "course_id": int(existing["course_id"]),
            "department_id": payload.department_id,
            "code": payload.code.strip(),
            "title": payload.title.strip(),
            "description": payload.description,
            "credit_hours": payload.credit_hours,
            "level_number": payload.level_number,
            "course_type": payload.course_type,
            "grading_scheme": payload.grading_scheme,
            "is_active": payload.is_active,
        },
    )
    db.execute(
        text(
            """
            UPDATE course_offerings
            SET academic_term_id = :academic_term_id,
                teacher_id = :teacher_id,
                room_id = :room_id,
                section_code = :section_code,
                delivery_mode = :delivery_mode,
                capacity = :capacity,
                waitlist_capacity = :waitlist_capacity,
                status = :status,
                registration_opens_at = :registration_opens_at,
                registration_closes_at = :registration_closes_at,
                schedule_notes = :schedule_notes,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :offering_id
            """
        ),
        {
            "offering_id": offering_id,
            "academic_term_id": payload.academic_term_id,
            "teacher_id": payload.teacher_profile_id,
            "room_id": payload.room_id,
            "section_code": payload.section_code.strip(),
            "delivery_mode": payload.delivery_mode,
            "capacity": payload.capacity,
            "waitlist_capacity": payload.waitlist_capacity,
            "status": payload.status,
            "registration_opens_at": payload.registration_opens_at,
            "registration_closes_at": payload.registration_closes_at,
            "schedule_notes": payload.schedule_notes,
        },
    )
    _sync_primary_course_meeting(db, offering_id, payload)
    db.commit()

    return {
        "message": f"{payload.code.strip()} - Section {payload.section_code.strip()} was updated successfully.",
        "offering": _get_course_offering_item(db, offering_id),
    }


def update_admin_registration_status(db: Session, enrollment_id: int, payload: EnrollmentStatusUpdateRequest) -> dict:
    enrollment = db.execute(
        text(
            """
            SELECT
              id,
              approved_at,
              dropped_at,
              completed_at
            FROM enrollments
            WHERE id = :enrollment_id
            """
        ),
        {"enrollment_id": enrollment_id},
    ).mappings().first()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration record not found.")

    now = datetime.now(UTC).replace(tzinfo=None)
    approved_at = enrollment["approved_at"]
    dropped_at = None
    completed_at = None

    if payload.status in {"enrolled", "completed", "failed"}:
        approved_at = approved_at or now

    if payload.status in {"dropped", "withdrawn"}:
        dropped_at = now

    if payload.status in {"completed", "failed"}:
        completed_at = now

    db.execute(
        text(
            """
            UPDATE enrollments
            SET status = :status,
                approved_at = :approved_at,
                dropped_at = :dropped_at,
                completed_at = :completed_at,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :enrollment_id
            """
        ),
        {
            "enrollment_id": enrollment_id,
            "status": payload.status,
            "approved_at": approved_at,
            "dropped_at": dropped_at,
            "completed_at": completed_at,
        },
    )
    db.commit()

    updated = db.execute(
        text(
            """
            SELECT
              e.id AS enrollment_id,
              e.student_id,
              e.course_offering_id AS offering_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              sp.student_number,
              c.title AS course_title,
              c.code AS course_code,
              co.section_code,
              at.name AS term_name,
              e.registered_at,
              e.approved_at,
              e.dropped_at,
              e.completed_at,
              e.status
            FROM enrollments e
            JOIN student_profiles sp ON sp.id = e.student_id
            JOIN users u ON u.id = sp.user_id
            JOIN course_offerings co ON co.id = e.course_offering_id
            JOIN courses c ON c.id = co.course_id
            JOIN academic_terms at ON at.id = co.academic_term_id
            WHERE e.id = :enrollment_id
            """
        ),
        {"enrollment_id": enrollment_id},
    ).mappings().one()

    return {
        "message": f"Registration status updated to {payload.status}.",
        "registration": dict(updated),
    }


def get_admin_registration_overview(db: Session) -> dict:
    stats = db.execute(
        text(
            """
            SELECT
              COUNT(*) AS total_registrations,
              COUNT(DISTINCT e.student_id) AS unique_students
            FROM enrollments e
            JOIN course_offerings co ON co.id = e.course_offering_id
            WHERE co.academic_term_id = (
              SELECT id
              FROM academic_terms
              WHERE is_current = TRUE
              LIMIT 1
            )
            """
        )
    ).mappings().one()

    items = db.execute(
        text(
            """
            SELECT
              e.id AS enrollment_id,
              e.student_id,
              e.course_offering_id AS offering_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              sp.student_number,
              c.title AS course_title,
              c.code AS course_code,
              co.section_code,
              at.name AS term_name,
              e.registered_at,
              e.approved_at,
              e.dropped_at,
              e.completed_at,
              e.status
            FROM enrollments e
            JOIN student_profiles sp ON sp.id = e.student_id
            JOIN users u ON u.id = sp.user_id
            JOIN course_offerings co ON co.id = e.course_offering_id
            JOIN courses c ON c.id = co.course_id
            JOIN academic_terms at ON at.id = co.academic_term_id
            ORDER BY e.registered_at DESC, e.id DESC
            LIMIT 200
            """
        )
    ).mappings().all()

    total_registrations = int(stats["total_registrations"] or 0)
    unique_students = int(stats["unique_students"] or 0)
    average_courses_per_student = round(total_registrations / unique_students, 2) if unique_students else 0

    return {
        "summary": {
            "total_registrations": total_registrations,
            "unique_students": unique_students,
            "average_courses_per_student": average_courses_per_student,
        },
        "items": [dict(item) for item in items],
    }


def get_admin_analytics(db: Session) -> dict:
    metrics = db.execute(
        text(
            """
            SELECT
              (SELECT COUNT(*) FROM student_profiles) AS total_students,
              (SELECT COALESCE(AVG(cumulative_gpa), 0) FROM student_profiles) AS average_gpa,
              (
                SELECT COALESCE(100 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM student_profiles), 0), 0)
                FROM vw_latest_student_risk
                WHERE risk_level IN ('medium', 'high')
              ) AS at_risk_rate,
              (
                SELECT COALESCE(
                  100 * COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) / NULLIF(SUM(co.capacity), 0),
                  0
                )
                FROM course_offerings co
                LEFT JOIN enrollments e ON e.course_offering_id = co.id
                WHERE co.academic_term_id = (
                  SELECT id
                  FROM academic_terms
                  WHERE is_current = TRUE
                  LIMIT 1
                )
              ) AS fill_rate
            """
        )
    ).mappings().one()

    current_and_previous = db.execute(
        text(
            """
            SELECT
              t.id,
              t.name,
              COUNT(e.id) AS registration_count
            FROM academic_terms t
            LEFT JOIN course_offerings co ON co.academic_term_id = t.id
            LEFT JOIN enrollments e ON e.course_offering_id = co.id
            GROUP BY t.id, t.name, t.start_date
            ORDER BY t.start_date DESC
            LIMIT 2
            """
        )
    ).mappings().all()

    current_count = int(current_and_previous[0]["registration_count"] or 0) if current_and_previous else 0
    previous_count = int(current_and_previous[1]["registration_count"] or 0) if len(current_and_previous) > 1 else 0
    if previous_count > 0:
        enrollment_growth = round(((current_count - previous_count) / previous_count) * 100, 1)
    elif current_count > 0:
        enrollment_growth = 100.0
    else:
        enrollment_growth = 0.0

    department_breakdown = db.execute(
        text(
            """
            SELECT
              d.name AS department_name,
              COUNT(sp.id) AS student_count,
              COALESCE(AVG(sp.cumulative_gpa), 0) AS average_gpa,
              COALESCE(
                100 * SUM(CASE WHEN r.risk_level IN ('medium', 'high') THEN 1 ELSE 0 END) / NULLIF(COUNT(sp.id), 0),
                0
              ) AS at_risk_percentage
            FROM departments d
            LEFT JOIN student_profiles sp ON sp.department_id = d.id
            LEFT JOIN vw_latest_student_risk r ON r.student_id = sp.id
            GROUP BY d.id, d.name
            ORDER BY student_count DESC, d.name ASC
            """
        )
    ).mappings().all()

    return {
        "metrics": {
            "enrollment_growth": enrollment_growth,
            "average_gpa": round(float(metrics["average_gpa"] or 0), 2),
            "fill_rate": round(float(metrics["fill_rate"] or 0), 1),
            "at_risk_rate": round(float(metrics["at_risk_rate"] or 0), 1),
        },
        "department_breakdown": [dict(item) for item in department_breakdown],
    }


def _next_identifier_sequence(db: Session, table_name: str, column_name: str, prefix: str) -> int:
    row = db.execute(
        text(
            f"""
            SELECT {column_name} AS identifier
            FROM {table_name}
            WHERE {column_name} LIKE :prefix_like
            ORDER BY {column_name} DESC
            LIMIT 1
            """
        ),
        {"prefix_like": f"{prefix}%"},
    ).mappings().first()

    if row is None or not row["identifier"]:
        return 1

    identifier = str(row["identifier"])
    suffix = identifier.replace(prefix, "", 1)
    return int(suffix) + 1 if suffix.isdigit() else 1


def _generate_student_number(db: Session) -> str:
    prefix = f"STU-{datetime.now(UTC).year}-"
    sequence = _next_identifier_sequence(db, "student_profiles", "student_number", prefix)
    return f"{prefix}{sequence:04d}"


def _generate_employee_number(db: Session, role: str) -> str:
    role_prefix = {
        ROLE_INSTRUCTOR: "INS",
        ROLE_ACADEMIC_STAFF: "ACS",
        ROLE_FINANCE_STAFF: "FIN",
        ROLE_COMMUNICATION_STAFF: "COM",
        ROLE_SYSTEM_ADMIN: "SYS",
    }.get(role, "STF")
    prefix = f"{role_prefix}-{datetime.now(UTC).year}-"
    sequence = _next_identifier_sequence(
        db,
        "teacher_profiles" if role == ROLE_INSTRUCTOR else "admin_profiles",
        "employee_number",
        prefix,
    )
    return f"{prefix}{sequence:04d}"


def _generate_temporary_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_user_account(db: Session, actor_user_id: int, payload: AdminCreateUserRequest) -> AdminProvisionUserResponse:
    if get_identity_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    is_student = payload.role == ROLE_STUDENT
    is_instructor = payload.role == ROLE_INSTRUCTOR
    is_staff = payload.role in STAFF_ROLES
    student_number = payload.student_number.strip() if payload.student_number else None
    employee_number = payload.employee_number.strip() if payload.employee_number else None
    temporary_password = payload.password or _generate_temporary_password()

    if is_student:
        if not payload.department_id or not payload.program_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student accounts require department_id and program_id.",
            )
        if not student_number:
            student_number = _generate_student_number(db)
    else:
        if is_instructor and not payload.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instructor accounts require department_id.",
            )
        if not employee_number:
            employee_number = _generate_employee_number(db, payload.role)

    db.execute(
        text(
            """
            INSERT INTO users (
              email,
              password_hash,
              first_name,
              last_name,
              phone,
              role,
              status,
              must_change_password,
              account_origin,
              created_by_user_id,
              invited_at,
              student_number,
              department_id,
              program_id,
              admission_date,
              current_semester,
              academic_status,
              employee_number,
              title,
              hire_date,
              office_location,
              employment_status
            ) VALUES (
              :email,
              :password_hash,
              :first_name,
              :last_name,
              :phone,
              :role,
              :status,
              :must_change_password,
              'admin_provisioned',
              :created_by_user_id,
              :invited_at,
              :student_number,
              :department_id,
              :program_id,
              :admission_date,
              :current_semester,
              'active',
              :employee_number,
              :title,
              :hire_date,
              :office_location,
              'active'
            )
            """
        ),
        {
            "email": payload.email.lower().strip(),
            "password_hash": hash_password(temporary_password),
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
            "phone": payload.phone,
            "role": payload.role,
            "status": payload.status,
            "must_change_password": payload.must_change_password,
            "created_by_user_id": actor_user_id,
            "invited_at": datetime.now(UTC).replace(tzinfo=None),
            "student_number": student_number if is_student else None,
            "department_id": payload.department_id if (is_student or is_instructor) else None,
            "program_id": payload.program_id if is_student else None,
            "admission_date": (payload.admission_date or date.today()) if is_student else None,
            "current_semester": payload.current_semester or 1,
            "employee_number": employee_number if not is_student else None,
            "title": payload.title,
            "hire_date": payload.hire_date if is_instructor else None,
            "office_location": payload.office_location,
        },
    )
    user_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    if not (is_student or is_instructor or is_staff):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported role for account provisioning.")
    db.commit()

    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create the new account.")

    return AdminProvisionUserResponse(
        user=serialize_user(identity),
        generated_identifiers=ProvisionedIdentifiers(
            student_number=student_number if is_student else None,
            employee_number=employee_number if not is_student else None,
        ),
        temporary_password=temporary_password,
    )
