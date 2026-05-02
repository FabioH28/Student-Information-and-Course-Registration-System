from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.profile import UserProfileUpdateRequest
from app.services.auth import get_identity_by_user_id


def _nullable_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    return cleaned or None


def get_user_profile(db: Session, user_id: int) -> dict:
    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    row = db.execute(
        text(
            """
            SELECT
              u.id AS user_id,
              u.email,
              u.first_name,
              u.last_name,
              u.phone,
              d_student.name AS student_department_name,
              d_instructor.name AS instructor_department_name,
              p.name AS program_name,
              sp.student_number,
              tp.employee_number AS instructor_employee_number,
              ap.employee_number AS staff_employee_number,
              COALESCE(tp.title, ap.title) AS title,
              COALESCE(tp.office_location, ap.office_location) AS office_location
            FROM users u
            LEFT JOIN student_profiles sp ON sp.user_id = u.id
            LEFT JOIN departments d_student ON d_student.id = sp.department_id
            LEFT JOIN programs p ON p.id = sp.program_id
            LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
            LEFT JOIN departments d_instructor ON d_instructor.id = tp.department_id
            LEFT JOIN admin_profiles ap ON ap.user_id = u.id
            WHERE u.id = :user_id
              AND u.deleted_at IS NULL
            LIMIT 1
            """
        ),
        {"user_id": user_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")

    full_name = f"{row['first_name']} {row['last_name']}".strip()
    return {
        "user_id": int(row["user_id"]),
        "email": row["email"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": full_name,
        "phone": row["phone"],
        "roles": identity.roles,
        "primary_role": identity.primary_role,
        "department_name": row["student_department_name"] or row["instructor_department_name"],
        "program_name": row["program_name"],
        "student_number": row["student_number"],
        "employee_number": row["instructor_employee_number"] or row["staff_employee_number"],
        "title": row["title"],
        "office_location": row["office_location"],
    }


def update_user_profile(db: Session, user_id: int, payload: UserProfileUpdateRequest) -> dict:
    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    db.execute(
        text(
            """
            UPDATE users
            SET first_name = :first_name,
                last_name = :last_name,
                phone = :phone,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            """
        ),
        {
            "user_id": user_id,
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
            "phone": _nullable_text(payload.phone),
        },
    )

    db.execute(
        text(
            """
            UPDATE users
            SET title = :title,
                office_location = :office_location,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            """
        ),
        {
            "user_id": user_id,
            "title": _nullable_text(payload.title),
            "office_location": _nullable_text(payload.office_location),
        },
    )
    db.commit()

    return get_user_profile(db, user_id)
