from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.rbac import ROLE_INSTRUCTOR, ROLE_STUDENT, ROLE_SYSTEM_ADMIN


def get_message_inbox(db: Session, user_id: int) -> dict:
    rows = db.execute(
        text("""
            SELECT
              m.id,
              m.sender_id,
              CONCAT(u.first_name, ' ', u.last_name) AS sender_name,
              u.role                                  AS sender_role,
              m.recipient_id,
              m.subject,
              m.body,
              m.parent_id,
              m.is_broadcast,
              m.sent_at,
              m.read_at
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.recipient_id = :user_id OR m.is_broadcast = 1)
              AND m.sender_id != :user_id
            ORDER BY m.sent_at DESC
            LIMIT 100
        """),
        {"user_id": user_id},
    ).mappings().all()

    unread = sum(1 for r in rows if r["read_at"] is None and not r["is_broadcast"])
    return {"total": len(rows), "unread": unread, "items": [dict(r) for r in rows]}


def get_message_sent(db: Session, user_id: int) -> dict:
    rows = db.execute(
        text("""
            SELECT
              m.id,
              m.sender_id,
              m.recipient_id,
              COALESCE(CONCAT(ru.first_name, ' ', ru.last_name), 'All Users') AS recipient_name,
              m.subject,
              m.body,
              m.parent_id,
              m.is_broadcast,
              m.sent_at
            FROM messages m
            LEFT JOIN users ru ON ru.id = m.recipient_id
            WHERE m.sender_id = :user_id
            ORDER BY m.sent_at DESC
            LIMIT 100
        """),
        {"user_id": user_id},
    ).mappings().all()

    return {"items": [dict(r) for r in rows]}


def send_message(
    db: Session,
    sender_id: int,
    sender_role: str,
    recipient_id: int | None,
    subject: str,
    body: str,
    parent_id: int | None = None,
    broadcast: bool = False,
) -> dict:
    if broadcast:
        if sender_role != ROLE_SYSTEM_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only System Admins can send broadcasts.")
        db.execute(
            text("""
                INSERT INTO messages (sender_id, recipient_id, subject, body, parent_id, is_broadcast, sent_at)
                VALUES (:sender_id, NULL, :subject, :body, :parent_id, 1, :sent_at)
            """),
            {"sender_id": sender_id, "subject": subject, "body": body, "parent_id": parent_id, "sent_at": datetime.now(UTC).replace(tzinfo=None)},
        )
        db.commit()
        return {"message": "Broadcast sent to all users."}

    if recipient_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="recipient_id is required for direct messages.")

    recipient = db.execute(
        text("SELECT id, first_name, last_name, role, status FROM users WHERE id = :id AND status != 'disabled'"),
        {"id": recipient_id},
    ).mappings().first()

    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found.")

    recipient_role = str(recipient["role"])

    if sender_role == ROLE_STUDENT and recipient_role == ROLE_STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students may not message other students.")

    db.execute(
        text("""
            INSERT INTO messages (sender_id, recipient_id, subject, body, parent_id, is_broadcast, sent_at)
            VALUES (:sender_id, :recipient_id, :subject, :body, :parent_id, 0, :sent_at)
        """),
        {
            "sender_id": sender_id,
            "recipient_id": recipient_id,
            "subject": subject,
            "body": body,
            "parent_id": parent_id,
            "sent_at": datetime.now(UTC).replace(tzinfo=None),
        },
    )
    db.commit()
    return {"message": f"Message sent to {recipient['first_name']} {recipient['last_name']}."}


def mark_message_read(db: Session, message_id: int, user_id: int) -> dict:
    db.execute(
        text("""
            UPDATE messages
            SET read_at = :read_at
            WHERE id = :message_id AND recipient_id = :user_id AND read_at IS NULL
        """),
        {"message_id": message_id, "user_id": user_id, "read_at": datetime.now(UTC).replace(tzinfo=None)},
    )
    db.commit()
    return {"ok": True}


def get_messageable_contacts(db: Session, user_id: int, user_role: str) -> dict:
    if user_role == ROLE_STUDENT:
        rows = db.execute(
            text("""
                SELECT DISTINCT u.id AS user_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                       u.role
                FROM users u
                WHERE u.status = 'active'
                  AND u.id != :user_id
                  AND (
                    u.role IN ('System Admin', 'Academic Staff', 'Finance Staff', 'Communication Staff')
                    OR (
                      u.role = 'Instructor'
                      AND u.id IN (
                        SELECT tp.user_id
                        FROM teacher_profiles tp
                        JOIN course_offerings co ON co.teacher_id = tp.id
                        JOIN course_registrations cr ON cr.offering_id = co.id
                        JOIN student_profiles sp ON sp.id = cr.student_id
                        WHERE sp.user_id = :user_id AND cr.status = 'registered'
                      )
                    )
                  )
                ORDER BY u.role, full_name
            """),
            {"user_id": user_id},
        ).mappings().all()

    elif user_role == ROLE_INSTRUCTOR:
        rows = db.execute(
            text("""
                SELECT DISTINCT u.id AS user_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                       u.role
                FROM users u
                WHERE u.status = 'active'
                  AND u.id != :user_id
                  AND (
                    u.role IN ('System Admin', 'Academic Staff', 'Finance Staff', 'Communication Staff')
                    OR (
                      u.role = 'Student'
                      AND u.id IN (
                        SELECT sp.user_id
                        FROM student_profiles sp
                        JOIN course_registrations cr ON cr.student_id = sp.id
                        JOIN course_offerings co ON co.id = cr.offering_id
                        JOIN teacher_profiles tp ON tp.id = co.teacher_id
                        WHERE tp.user_id = :user_id AND cr.status = 'registered'
                      )
                    )
                  )
                ORDER BY u.role, full_name
            """),
            {"user_id": user_id},
        ).mappings().all()

    else:
        rows = db.execute(
            text("""
                SELECT u.id AS user_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                       u.role
                FROM users u
                WHERE u.status = 'active' AND u.id != :user_id
                ORDER BY u.role, full_name
                LIMIT 300
            """),
            {"user_id": user_id},
        ).mappings().all()

    return {"contacts": [dict(r) for r in rows]}
