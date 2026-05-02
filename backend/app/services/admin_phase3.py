from datetime import UTC, datetime
import re

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.rbac import ROLE_INSTRUCTOR, ROLE_STUDENT, STAFF_ROLES, ROLE_SYSTEM_ADMIN
from app.core.security import hash_password
from app.schemas.admin import (
    AdminPasswordResetResponse,
    CampusEventUpsertRequest,
    ClubJoinRequestReviewRequest,
    ClubUpsertRequest,
    FinancialHoldCreateRequest,
    FinancialHoldUpdateRequest,
    InvoiceCreateRequest,
    InvoiceUpdateRequest,
    NewsPostUpsertRequest,
    PaymentCreateRequest,
    PaymentUpdateRequest,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.services.admin import _ensure_teacher_exists, _generate_temporary_password, _next_identifier_sequence
from app.services.auth import get_identity_by_user_id, serialize_user


def _create_audit_log(
    db: Session,
    actor_user_id: int | None,
    entity_type: str,
    entity_id: str | int,
    action: str,
    summary: str,
) -> None:
    return


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


def _generate_invoice_number(db: Session) -> str:
    prefix = f"INV-{datetime.now(UTC).year}-"
    sequence = _next_identifier_sequence(db, "student_invoices", "invoice_number", prefix)
    return f"{prefix}{sequence:04d}"


def _generate_payment_reference(db: Session) -> str:
    prefix = f"PAY-{datetime.now(UTC).year}-"
    sequence = _next_identifier_sequence(db, "payments", "reference_number", prefix)
    return f"{prefix}{sequence:04d}"


def _get_finance_invoice_item(db: Session, invoice_id: int) -> dict:
    invoice = db.execute(
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
            WHERE si.id = :invoice_id
            """
        ),
        {"invoice_id": invoice_id},
    ).mappings().first()
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return dict(invoice)


def _get_finance_payment_item(db: Session, payment_id: int) -> dict:
    payment = db.execute(
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
            WHERE p.id = :payment_id
            """
        ),
        {"payment_id": payment_id},
    ).mappings().first()
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")
    return dict(payment)


def _get_finance_hold_item(db: Session, hold_id: int) -> dict:
    hold = db.execute(
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
            WHERE fh.id = :hold_id
            """
        ),
        {"hold_id": hold_id},
    ).mappings().first()
    if hold is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial hold not found.")
    return dict(hold)


def _ensure_finance_term_exists(db: Session, term_id: int | None) -> None:
    if term_id is None:
        return

    term_exists = db.execute(
        text("SELECT id FROM academic_terms WHERE id = :term_id"),
        {"term_id": term_id},
    ).scalar_one_or_none()
    if term_exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic term not found.")


def _ensure_manual_invoice_balance(total_amount: float, balance_amount: float) -> None:
    if balance_amount > total_amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Balance cannot be greater than invoice total.")


def _recalculate_invoice_from_confirmed_payments(db: Session, invoice_id: int) -> None:
    invoice = db.execute(
        text(
            """
            SELECT id, total_amount, status
            FROM student_invoices
            WHERE id = :invoice_id
            """
        ),
        {"invoice_id": invoice_id},
    ).mappings().first()
    if invoice is None or invoice["status"] == "void":
        return

    applied_amount = float(
        db.execute(
            text(
                """
                SELECT COALESCE(SUM(pa.amount_applied), 0)
                FROM payment_allocations pa
                JOIN payments p ON p.id = pa.payment_id
                WHERE pa.invoice_id = :invoice_id
                  AND p.status = 'confirmed'
                """
            ),
            {"invoice_id": invoice_id},
        ).scalar_one()
        or 0
    )
    total_amount = round(float(invoice["total_amount"] or 0), 2)
    balance_amount = max(round(total_amount - applied_amount, 2), 0)
    if balance_amount == 0:
        invoice_status = "paid"
    elif applied_amount > 0:
        invoice_status = "partially_paid"
    else:
        invoice_status = "overdue" if invoice["status"] == "overdue" else "issued"

    db.execute(
        text(
            """
            UPDATE student_invoices
            SET balance_amount = :balance_amount,
                status = :status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :invoice_id
            """
        ),
        {
            "invoice_id": invoice_id,
            "balance_amount": balance_amount,
            "status": invoice_status,
        },
    )


def _replace_payment_invoice_allocation(
    db: Session,
    *,
    payment_id: int,
    student_id: int,
    invoice_id: int | None,
    amount: float,
    payment_status: str,
) -> int | None:
    if invoice_id is None:
        db.execute(
            text(
                """
                UPDATE payments
                SET invoice_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :payment_id
                """
            ),
            {"payment_id": payment_id},
        )
        return None

    invoice_context = db.execute(
        text(
            """
            SELECT
              si.id,
              si.student_id,
              si.invoice_number,
              si.total_amount,
              si.status,
              COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN pa.amount_applied ELSE 0 END), 0) AS already_applied
            FROM student_invoices si
            LEFT JOIN payment_allocations pa ON pa.invoice_id = si.id
              AND pa.payment_id <> :payment_id
            LEFT JOIN payments p ON p.id = pa.payment_id
            WHERE si.id = :invoice_id
            GROUP BY si.id, si.student_id, si.invoice_number, si.total_amount, si.status
            """
        ),
        {"invoice_id": invoice_id, "payment_id": payment_id},
    ).mappings().first()
    if invoice_context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    if int(invoice_context["student_id"]) != student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected invoice does not belong to this student.")
    if invoice_context["status"] == "void":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payments cannot be linked to a void invoice.")

    total_amount = round(float(invoice_context["total_amount"] or 0), 2)
    available_balance = max(round(total_amount - float(invoice_context["already_applied"] or 0), 2), 0)
    if payment_status != "confirmed":
        available_balance = total_amount

    amount_applied = min(round(float(amount), 2), available_balance)
    if amount_applied <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This invoice has already been settled.")

    db.execute(
        text(
            """
            UPDATE payments
            SET invoice_id = :invoice_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :payment_id
            """
        ),
        {
            "payment_id": payment_id,
            "invoice_id": invoice_id,
        },
    )
    return invoice_id


def _get_admin_club_item(db: Session, club_id: int) -> dict:
    club = db.execute(
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
            WHERE vcs.club_id = :club_id
            """
        ),
        {"club_id": club_id},
    ).mappings().first()
    if club is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found.")
    return dict(club)


def _get_club_join_request_item(db: Session, request_id: int) -> dict:
    request = db.execute(
        text(
            """
            SELECT
              cjr.id,
              cjr.club_id,
              cjr.student_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name,
              sp.student_number,
              sp.user_id,
              c.name AS club_name,
              cjr.member_role AS requested_role,
              cjr.status,
              COALESCE(cjr.submitted_at, cjr.created_at) AS submitted_at,
              cjr.reviewed_at,
              cjr.review_notes
            FROM club_memberships cjr
            JOIN student_profiles sp ON sp.id = cjr.student_id
            JOIN users u ON u.id = sp.user_id
            JOIN clubs c ON c.id = cjr.club_id
            WHERE cjr.id = :request_id
            """
        ),
        {"request_id": request_id},
    ).mappings().first()
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club join request not found.")
    return dict(request)


def _get_news_post_item(db: Session, post_id: int) -> dict:
    post = db.execute(
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
            WHERE id = :post_id
            """
        ),
        {"post_id": post_id},
    ).mappings().first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found.")
    return dict(post)


def _get_campus_event_item(db: Session, event_id: int) -> dict:
    event = db.execute(
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
            WHERE id = :event_id
            """
        ),
        {"event_id": event_id},
    ).mappings().first()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus event not found.")
    return dict(event)


def create_admin_invoice(db: Session, actor_user_id: int, payload: InvoiceCreateRequest) -> dict:
    if payload.due_date < payload.issue_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date cannot be earlier than the issue date.")

    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    student = _get_student_user_context(db, payload.student_id)
    _ensure_finance_term_exists(db, payload.academic_term_id)

    invoice_number = _generate_invoice_number(db)
    amount = round(float(payload.amount), 2)

    db.execute(
        text(
            """
            INSERT INTO student_invoices (
              student_id,
              academic_term_id,
              invoice_number,
              issue_date,
              due_date,
              description,
              subtotal_amount,
              total_amount,
              balance_amount,
              status,
              notes,
              created_by_admin_id
            ) VALUES (
              :student_id,
              :academic_term_id,
              :invoice_number,
              :issue_date,
              :due_date,
              :description,
              :subtotal_amount,
              :total_amount,
              :balance_amount,
              'issued',
              :notes,
              :created_by_admin_id
            )
            """
        ),
        {
            "student_id": payload.student_id,
            "academic_term_id": payload.academic_term_id,
            "invoice_number": invoice_number,
            "issue_date": payload.issue_date,
            "due_date": payload.due_date,
            "description": payload.description.strip(),
            "subtotal_amount": amount,
            "total_amount": amount,
            "balance_amount": amount,
            "notes": payload.notes,
            "created_by_admin_id": admin_profile_id,
        },
    )
    invoice_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())

    _create_notification(
        db,
        user_ids=[int(student["user_id"])],
        category="finance",
        severity="warning",
        title="New invoice issued",
        message=f"{invoice_number} has been issued for {amount:.2f} USD and is due on {payload.due_date.isoformat()}.",
        created_by_user_id=actor_user_id,
        action_label="View finance",
        action_url="/student/finance",
        source_entity_type="student_invoice",
        source_entity_id=invoice_id,
    )
    _create_audit_log(
        db,
        actor_user_id,
        "student_invoice",
        invoice_id,
        "create",
        f"Issued invoice {invoice_number} for {student['first_name']} {student['last_name']}",
    )
    db.commit()

    return {
        "message": f"Invoice {invoice_number} was issued successfully.",
        "invoice": _get_finance_invoice_item(db, invoice_id),
    }


def update_admin_invoice(db: Session, actor_user_id: int, invoice_id: int, payload: InvoiceUpdateRequest) -> dict:
    if payload.due_date < payload.issue_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date cannot be earlier than the issue date.")

    existing = db.execute(
        text("SELECT id, invoice_number FROM student_invoices WHERE id = :invoice_id"),
        {"invoice_id": invoice_id},
    ).mappings().first()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    _get_student_user_context(db, payload.student_id)
    _ensure_finance_term_exists(db, payload.academic_term_id)

    total_amount = round(float(payload.amount), 2)
    balance_amount = round(float(payload.balance_amount), 2)
    invoice_status = payload.status
    if invoice_status in {"paid", "void"}:
        balance_amount = 0
    _ensure_manual_invoice_balance(total_amount, balance_amount)

    db.execute(
        text(
            """
            UPDATE student_invoices
            SET student_id = :student_id,
                academic_term_id = :academic_term_id,
                issue_date = :issue_date,
                due_date = :due_date,
                description = :description,
                subtotal_amount = :subtotal_amount,
                total_amount = :total_amount,
                balance_amount = :balance_amount,
                status = :status,
                notes = :notes,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :invoice_id
            """
        ),
        {
            "invoice_id": invoice_id,
            "student_id": payload.student_id,
            "academic_term_id": payload.academic_term_id,
            "issue_date": payload.issue_date,
            "due_date": payload.due_date,
            "description": payload.description.strip(),
            "subtotal_amount": total_amount,
            "total_amount": total_amount,
            "balance_amount": balance_amount,
            "status": invoice_status,
            "notes": payload.notes,
        },
    )

    _create_audit_log(
        db,
        actor_user_id,
        "student_invoice",
        invoice_id,
        "update",
        f"Updated manual invoice record {existing['invoice_number']}",
    )
    db.commit()

    return {
        "message": f"Invoice {existing['invoice_number']} was updated successfully.",
        "invoice": _get_finance_invoice_item(db, invoice_id),
    }


def create_admin_payment(db: Session, actor_user_id: int, payload: PaymentCreateRequest) -> dict:
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    student = _get_student_user_context(db, payload.student_id)

    reference_number = payload.reference_number.strip() if payload.reference_number else _generate_payment_reference(db)
    existing_reference = db.execute(
        text("SELECT id FROM payments WHERE reference_number = :reference_number LIMIT 1"),
        {"reference_number": reference_number},
    ).scalar_one_or_none()
    if existing_reference is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This payment reference number already exists.")

    invoice_context = None
    if payload.invoice_id is not None:
        invoice_context = db.execute(
            text(
                """
                SELECT id, student_id, invoice_number, balance_amount, status
                FROM student_invoices
                WHERE id = :invoice_id
                """
            ),
            {"invoice_id": payload.invoice_id},
        ).mappings().first()
        if invoice_context is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
        if int(invoice_context["student_id"]) != payload.student_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected invoice does not belong to this student.")
        if invoice_context["status"] == "void":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment records cannot be linked to a void invoice.")

    amount = round(float(payload.amount), 2)
    db.execute(
        text(
            """
            INSERT INTO payments (
              student_id,
              invoice_id,
              reference_number,
              payment_method,
              amount,
              paid_at,
              status,
              received_by_admin_id,
              notes
            ) VALUES (
              :student_id,
              :invoice_id,
              :reference_number,
              :payment_method,
              :amount,
              :paid_at,
              'confirmed',
              :received_by_admin_id,
              :notes
            )
            """
        ),
        {
            "student_id": payload.student_id,
            "invoice_id": payload.invoice_id,
            "reference_number": reference_number,
            "payment_method": payload.payment_method,
            "amount": amount,
            "paid_at": payload.paid_at,
            "received_by_admin_id": admin_profile_id,
            "notes": payload.notes,
        },
    )
    payment_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())

    if invoice_context is not None:
        current_balance = float(invoice_context["balance_amount"] or 0)
        if current_balance <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This invoice has already been settled.")

        amount_applied = min(amount, current_balance)

        new_balance = max(round(current_balance - amount_applied, 2), 0)
        new_status = "paid" if new_balance == 0 else "partially_paid"
        db.execute(
            text(
                """
                UPDATE student_invoices
                SET balance_amount = :balance_amount,
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :invoice_id
                """
            ),
            {
                "invoice_id": int(invoice_context["id"]),
                "balance_amount": new_balance,
                "status": new_status,
            },
        )

    _create_notification(
        db,
        user_ids=[int(student["user_id"])],
        category="finance",
        severity="success",
        title="Payment record added",
        message=f"Finance staff recorded a payment of {amount:.2f} USD on your account.",
        created_by_user_id=actor_user_id,
        action_label="Review finance",
        action_url="/student/finance",
        source_entity_type="payment",
        source_entity_id=payment_id,
    )
    _create_audit_log(
        db,
        actor_user_id,
        "payment",
        payment_id,
        "payment_recorded",
        f"Recorded payment {reference_number} for {student['first_name']} {student['last_name']}",
    )
    db.commit()

    return {
        "message": f"Payment {reference_number} was recorded successfully.",
        "payment": _get_finance_payment_item(db, payment_id),
    }


def update_admin_payment(db: Session, actor_user_id: int, payment_id: int, payload: PaymentUpdateRequest) -> dict:
    existing = db.execute(
        text(
            """
            SELECT id, reference_number
            FROM payments
            WHERE id = :payment_id
            """
        ),
        {"payment_id": payment_id},
    ).mappings().first()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    _get_student_user_context(db, payload.student_id)
    amount = round(float(payload.amount), 2)
    reference_number = payload.reference_number.strip() if payload.reference_number else existing["reference_number"]
    if not reference_number:
        reference_number = _generate_payment_reference(db)

    existing_reference = db.execute(
        text("SELECT id FROM payments WHERE reference_number = :reference_number AND id <> :payment_id LIMIT 1"),
        {"reference_number": reference_number, "payment_id": payment_id},
    ).scalar_one_or_none()
    if existing_reference is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This payment reference number already exists.")

    if payload.invoice_id is not None:
        invoice_context = db.execute(
            text(
                """
                SELECT id, student_id, status
                FROM student_invoices
                WHERE id = :invoice_id
                """
            ),
            {"invoice_id": payload.invoice_id},
        ).mappings().first()
        if invoice_context is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
        if int(invoice_context["student_id"]) != payload.student_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected invoice does not belong to this student.")
        if invoice_context["status"] == "void":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payments cannot be linked to a void invoice.")

    previous_invoice_ids = [
        int(row["invoice_id"])
        for row in db.execute(
            text("SELECT invoice_id FROM payments WHERE id = :payment_id AND invoice_id IS NOT NULL"),
            {"payment_id": payment_id},
        ).mappings().all()
    ]
    db.execute(
        text(
            """
            UPDATE payments
            SET invoice_id = NULL
            WHERE id = :payment_id
            """
        ),
        {"payment_id": payment_id},
    )

    db.execute(
        text(
            """
            UPDATE payments
            SET student_id = :student_id,
                invoice_id = :invoice_id,
                reference_number = :reference_number,
                payment_method = :payment_method,
                amount = :amount,
                paid_at = :paid_at,
                status = :status,
                notes = :notes,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :payment_id
            """
        ),
        {
            "payment_id": payment_id,
            "student_id": payload.student_id,
            "invoice_id": payload.invoice_id,
            "reference_number": reference_number,
            "payment_method": payload.payment_method,
            "amount": amount,
            "paid_at": payload.paid_at,
            "status": payload.status,
            "notes": payload.notes,
        },
    )

    new_invoice_id = _replace_payment_invoice_allocation(
        db,
        payment_id=payment_id,
        student_id=payload.student_id,
        invoice_id=payload.invoice_id,
        amount=amount,
        payment_status=payload.status,
    )
    for affected_invoice_id in sorted(set(previous_invoice_ids + ([new_invoice_id] if new_invoice_id else []))):
        _recalculate_invoice_from_confirmed_payments(db, affected_invoice_id)

    _create_audit_log(
        db,
        actor_user_id,
        "payment",
        payment_id,
        "update",
        f"Updated manual payment record {reference_number}",
    )
    db.commit()

    return {
        "message": f"Payment {reference_number} was updated successfully.",
        "payment": _get_finance_payment_item(db, payment_id),
    }


def create_admin_financial_hold(db: Session, actor_user_id: int, payload: FinancialHoldCreateRequest) -> dict:
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    student = _get_student_user_context(db, payload.student_id)

    db.execute(
        text(
            """
            INSERT INTO financial_holds (
              student_id,
              hold_type,
              reason,
              status,
              placed_by_admin_id
            ) VALUES (
              :student_id,
              :hold_type,
              :reason,
              'active',
              :placed_by_admin_id
            )
            """
        ),
        {
            "student_id": payload.student_id,
            "hold_type": payload.hold_type,
            "reason": payload.reason.strip(),
            "placed_by_admin_id": admin_profile_id,
        },
    )
    hold_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())

    _create_notification(
        db,
        user_ids=[int(student["user_id"])],
        category="finance",
        severity="danger",
        title="Financial hold placed",
        message=payload.reason.strip(),
        created_by_user_id=actor_user_id,
        action_label="Open finance",
        action_url="/student/finance",
        source_entity_type="financial_hold",
        source_entity_id=hold_id,
    )
    _create_audit_log(
        db,
        actor_user_id,
        "financial_hold",
        hold_id,
        "create",
        f"Placed a {payload.hold_type} hold for {student['first_name']} {student['last_name']}",
    )
    db.commit()

    return {
        "message": "Financial hold placed successfully.",
        "hold": _get_finance_hold_item(db, hold_id),
    }


def update_admin_financial_hold(db: Session, actor_user_id: int, hold_id: int, payload: FinancialHoldUpdateRequest) -> dict:
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    existing = db.execute(
        text("SELECT id, status FROM financial_holds WHERE id = :hold_id"),
        {"hold_id": hold_id},
    ).mappings().first()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial hold not found.")

    _get_student_user_context(db, payload.student_id)
    if payload.status == "released":
        db.execute(
            text(
                """
                UPDATE financial_holds
                SET student_id = :student_id,
                    hold_type = :hold_type,
                    reason = :reason,
                    status = 'released',
                    released_at = COALESCE(released_at, CURRENT_TIMESTAMP),
                    released_by_admin_id = COALESCE(released_by_admin_id, :released_by_admin_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :hold_id
                """
            ),
            {
                "hold_id": hold_id,
                "student_id": payload.student_id,
                "hold_type": payload.hold_type,
                "reason": payload.reason.strip(),
                "released_by_admin_id": admin_profile_id,
            },
        )
    else:
        db.execute(
            text(
                """
                UPDATE financial_holds
                SET student_id = :student_id,
                    hold_type = :hold_type,
                    reason = :reason,
                    status = 'active',
                    released_at = NULL,
                    released_by_admin_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :hold_id
                """
            ),
            {
                "hold_id": hold_id,
                "student_id": payload.student_id,
                "hold_type": payload.hold_type,
                "reason": payload.reason.strip(),
            },
        )

    _create_audit_log(
        db,
        actor_user_id,
        "financial_hold",
        hold_id,
        "update",
        "Updated manual financial hold record",
    )
    db.commit()

    return {
        "message": "Financial hold updated successfully.",
        "hold": _get_finance_hold_item(db, hold_id),
    }


def release_admin_financial_hold(db: Session, actor_user_id: int, hold_id: int) -> dict:
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    hold_context = db.execute(
        text(
            """
            SELECT
              fh.id,
              fh.status,
              sp.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS student_name
            FROM financial_holds fh
            JOIN student_profiles sp ON sp.id = fh.student_id
            JOIN users u ON u.id = sp.user_id
            WHERE fh.id = :hold_id
            """
        ),
        {"hold_id": hold_id},
    ).mappings().first()

    if hold_context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial hold not found.")
    if hold_context["status"] == "released":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This financial hold has already been released.")

    db.execute(
        text(
            """
            UPDATE financial_holds
            SET status = 'released',
                released_at = CURRENT_TIMESTAMP,
                released_by_admin_id = :released_by_admin_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :hold_id
            """
        ),
        {
            "hold_id": hold_id,
            "released_by_admin_id": admin_profile_id,
        },
    )

    _create_notification(
        db,
        user_ids=[int(hold_context["user_id"])],
        category="finance",
        severity="success",
        title="Financial hold released",
        message="The hold on your account has been released.",
        created_by_user_id=actor_user_id,
        action_label="View finance",
        action_url="/student/finance",
        source_entity_type="financial_hold",
        source_entity_id=hold_id,
    )
    _create_audit_log(
        db,
        actor_user_id,
        "financial_hold",
        hold_id,
        "update",
        f"Released a financial hold for {hold_context['student_name']}",
    )
    db.commit()

    return {
        "message": "Financial hold released successfully.",
        "hold": _get_finance_hold_item(db, hold_id),
    }


def create_admin_club(db: Session, actor_user_id: int, payload: ClubUpsertRequest) -> dict:
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    category_exists = db.execute(
        text("SELECT id FROM club_categories WHERE id = :category_id"),
        {"category_id": payload.category_id},
    ).scalar_one_or_none()
    if category_exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club category not found.")

    _ensure_teacher_exists(db, payload.advisor_teacher_id)
    club_code = payload.code.strip().upper()
    existing_code = db.execute(
        text("SELECT id FROM clubs WHERE code = :code LIMIT 1"),
        {"code": club_code},
    ).scalar_one_or_none()
    if existing_code is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A club with this code already exists.")

    db.execute(
        text(
            """
            INSERT INTO clubs (
              category_id,
              code,
              name,
              slug,
              description,
              advisor_teacher_id,
              managed_by_admin_id,
              join_mode,
              status,
              capacity,
              meeting_day_of_week,
              meeting_start_time,
              meeting_end_time,
              meeting_location,
              contact_email
            ) VALUES (
              :category_id,
              :code,
              :name,
              :slug,
              :description,
              :advisor_teacher_id,
              :managed_by_admin_id,
              :join_mode,
              :status,
              :capacity,
              :meeting_day_of_week,
              :meeting_start_time,
              :meeting_end_time,
              :meeting_location,
              :contact_email
            )
            """
        ),
        {
            "category_id": payload.category_id,
            "code": club_code,
            "name": payload.name.strip(),
            "slug": _generate_unique_club_slug(db, payload.name),
            "description": payload.description,
            "advisor_teacher_id": payload.advisor_teacher_id,
            "managed_by_admin_id": admin_profile_id,
            "join_mode": payload.join_mode,
            "status": payload.status,
            "capacity": payload.capacity,
            "meeting_day_of_week": payload.meeting_day_of_week,
            "meeting_start_time": payload.meeting_start_time,
            "meeting_end_time": payload.meeting_end_time,
            "meeting_location": payload.meeting_location,
            "contact_email": payload.contact_email.lower() if payload.contact_email else None,
        },
    )
    club_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    _create_audit_log(db, actor_user_id, "club", club_id, "create", f"Created club {payload.name.strip()}")
    db.commit()

    return {
        "message": f"{payload.name.strip()} was created successfully.",
        "club": _get_admin_club_item(db, club_id),
    }


def update_admin_club(db: Session, actor_user_id: int, club_id: int, payload: ClubUpsertRequest) -> dict:
    existing_club = db.execute(
        text("SELECT id FROM clubs WHERE id = :club_id"),
        {"club_id": club_id},
    ).scalar_one_or_none()
    if existing_club is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found.")

    category_exists = db.execute(
        text("SELECT id FROM club_categories WHERE id = :category_id"),
        {"category_id": payload.category_id},
    ).scalar_one_or_none()
    if category_exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club category not found.")

    _ensure_teacher_exists(db, payload.advisor_teacher_id)
    club_code = payload.code.strip().upper()
    duplicate_code = db.execute(
        text("SELECT id FROM clubs WHERE code = :code AND id <> :club_id LIMIT 1"),
        {"code": club_code, "club_id": club_id},
    ).scalar_one_or_none()
    if duplicate_code is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A club with this code already exists.")

    db.execute(
        text(
            """
            UPDATE clubs
            SET category_id = :category_id,
                code = :code,
                name = :name,
                slug = :slug,
                description = :description,
                advisor_teacher_id = :advisor_teacher_id,
                managed_by_admin_id = :managed_by_admin_id,
                join_mode = :join_mode,
                status = :status,
                capacity = :capacity,
                meeting_day_of_week = :meeting_day_of_week,
                meeting_start_time = :meeting_start_time,
                meeting_end_time = :meeting_end_time,
                meeting_location = :meeting_location,
                contact_email = :contact_email,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :club_id
            """
        ),
        {
            "club_id": club_id,
            "category_id": payload.category_id,
            "code": club_code,
            "name": payload.name.strip(),
            "slug": _generate_unique_club_slug(db, payload.name, club_id),
            "description": payload.description,
            "advisor_teacher_id": payload.advisor_teacher_id,
            "managed_by_admin_id": admin_profile_id,
            "join_mode": payload.join_mode,
            "status": payload.status,
            "capacity": payload.capacity,
            "meeting_day_of_week": payload.meeting_day_of_week,
            "meeting_start_time": payload.meeting_start_time,
            "meeting_end_time": payload.meeting_end_time,
            "meeting_location": payload.meeting_location,
            "contact_email": payload.contact_email.lower() if payload.contact_email else None,
        },
    )
    _create_audit_log(db, actor_user_id, "club", club_id, "update", f"Updated club {payload.name.strip()}")
    db.commit()

    return {
        "message": f"{payload.name.strip()} was updated successfully.",
        "club": _get_admin_club_item(db, club_id),
    }


def review_admin_club_join_request(
    db: Session,
    actor_user_id: int,
    request_id: int,
    payload: ClubJoinRequestReviewRequest,
) -> dict:
    request = _get_club_join_request_item(db, request_id)
    admin_profile_id = _get_admin_profile_id(db, actor_user_id)
    membership_status = "active" if payload.status == "approved" else payload.status

    db.execute(
        text(
            """
            UPDATE club_memberships
            SET status = :status,
                reviewed_at = CURRENT_TIMESTAMP,
                reviewed_by_admin_id = :reviewed_by_admin_id,
                review_notes = :review_notes,
                approved_at = CASE WHEN :status = 'active' THEN CURRENT_TIMESTAMP ELSE approved_at END,
                joined_at = CASE WHEN :status = 'active' THEN COALESCE(joined_at, CURRENT_TIMESTAMP) ELSE joined_at END,
                approved_by_admin_id = CASE WHEN :status = 'active' THEN :reviewed_by_admin_id ELSE approved_by_admin_id END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :request_id
            """
        ),
        {
            "request_id": request_id,
            "status": membership_status,
            "reviewed_by_admin_id": admin_profile_id,
            "review_notes": payload.review_notes,
        },
    )

    severity_map = {
        "approved": "success",
        "waitlisted": "warning",
        "rejected": "danger",
    }
    _create_notification(
        db,
        user_ids=[int(request["user_id"])],
        category="club",
        severity=severity_map[payload.status],
        title=f"{request['club_name']} request {payload.status}",
        message=payload.review_notes or f"Your request for {request['club_name']} is now {payload.status}.",
        created_by_user_id=actor_user_id,
        action_label="Open clubs",
        action_url="/student/clubs",
        source_entity_type="club_join_request",
        source_entity_id=request_id,
    )
    _create_audit_log(
        db,
        actor_user_id,
        "club_join_request",
        request_id,
        "update",
        f"{payload.status.title()} club join request for {request['student_name']}",
    )
    db.commit()

    return {
        "message": f"Join request marked as {payload.status}.",
        "request": _get_club_join_request_item(db, request_id),
    }


def create_admin_news_post(db: Session, actor_user_id: int, payload: NewsPostUpsertRequest) -> dict:
    if payload.visible_from and payload.visible_until and payload.visible_until < payload.visible_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visible until must be later than visible from.")

    published_at = datetime.now(UTC).replace(tzinfo=None) if payload.status == "published" else None
    db.execute(
        text(
            """
            INSERT INTO news_posts (
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
              created_by_user_id,
              updated_by_user_id
            ) VALUES (
              :post_type,
              :title,
              :summary,
              :body,
              :priority,
              :status,
              :featured,
              :visible_from,
              :visible_until,
              :published_at,
              :created_by_user_id,
              :updated_by_user_id
            )
            """
        ),
        {
            "post_type": payload.post_type,
            "title": payload.title.strip(),
            "summary": payload.summary.strip(),
            "body": payload.body,
            "priority": payload.priority,
            "status": payload.status,
            "featured": payload.featured,
            "visible_from": payload.visible_from,
            "visible_until": payload.visible_until,
            "published_at": published_at,
            "created_by_user_id": actor_user_id,
            "updated_by_user_id": actor_user_id,
        },
    )
    post_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    _create_audit_log(db, actor_user_id, "news_post", post_id, "create", f"Created news post {payload.title.strip()}")
    db.commit()

    return {
        "message": "News post created successfully.",
        "post": _get_news_post_item(db, post_id),
    }


def update_admin_news_post(db: Session, actor_user_id: int, post_id: int, payload: NewsPostUpsertRequest) -> dict:
    existing = db.execute(
        text("SELECT id, published_at FROM news_posts WHERE id = :post_id"),
        {"post_id": post_id},
    ).mappings().first()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found.")
    if payload.visible_from and payload.visible_until and payload.visible_until < payload.visible_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Visible until must be later than visible from.")

    published_at = existing["published_at"] if payload.status != "published" else existing["published_at"] or datetime.now(UTC).replace(tzinfo=None)
    db.execute(
        text(
            """
            UPDATE news_posts
            SET post_type = :post_type,
                title = :title,
                summary = :summary,
                body = :body,
                priority = :priority,
                status = :status,
                featured = :featured,
                visible_from = :visible_from,
                visible_until = :visible_until,
                published_at = :published_at,
                updated_by_user_id = :updated_by_user_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :post_id
            """
        ),
        {
            "post_id": post_id,
            "post_type": payload.post_type,
            "title": payload.title.strip(),
            "summary": payload.summary.strip(),
            "body": payload.body,
            "priority": payload.priority,
            "status": payload.status,
            "featured": payload.featured,
            "visible_from": payload.visible_from,
            "visible_until": payload.visible_until,
            "published_at": published_at,
            "updated_by_user_id": actor_user_id,
        },
    )
    _create_audit_log(db, actor_user_id, "news_post", post_id, "update", f"Updated news post {payload.title.strip()}")
    db.commit()

    return {
        "message": "News post updated successfully.",
        "post": _get_news_post_item(db, post_id),
    }


def create_admin_campus_event(db: Session, actor_user_id: int, payload: CampusEventUpsertRequest) -> dict:
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event end time must be later than the start time.")
    if payload.club_id is not None:
        existing_club = db.execute(
            text("SELECT id FROM clubs WHERE id = :club_id"),
            {"club_id": payload.club_id},
        ).scalar_one_or_none()
        if existing_club is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked club not found.")

    db.execute(
        text(
            """
            INSERT INTO campus_events (
              club_id,
              title,
              description,
              organizer_name,
              event_type,
              location_name,
              delivery_mode,
              starts_at,
              ends_at,
              registration_required,
              capacity,
              expected_attendees,
              status,
              managed_by_user_id
            ) VALUES (
              :club_id,
              :title,
              :description,
              :organizer_name,
              :event_type,
              :location_name,
              :delivery_mode,
              :starts_at,
              :ends_at,
              :registration_required,
              :capacity,
              :expected_attendees,
              :status,
              :managed_by_user_id
            )
            """
        ),
        {
            "club_id": payload.club_id,
            "title": payload.title.strip(),
            "description": payload.description,
            "organizer_name": payload.organizer_name.strip(),
            "event_type": payload.event_type.strip(),
            "location_name": payload.location_name.strip(),
            "delivery_mode": payload.delivery_mode,
            "starts_at": payload.starts_at,
            "ends_at": payload.ends_at,
            "registration_required": payload.registration_required,
            "capacity": payload.capacity,
            "expected_attendees": payload.expected_attendees,
            "status": payload.status,
            "managed_by_user_id": actor_user_id,
        },
    )
    event_id = int(db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    _create_audit_log(db, actor_user_id, "campus_event", event_id, "create", f"Created campus event {payload.title.strip()}")
    db.commit()

    return {
        "message": "Campus event created successfully.",
        "event": _get_campus_event_item(db, event_id),
    }


def update_admin_campus_event(db: Session, actor_user_id: int, event_id: int, payload: CampusEventUpsertRequest) -> dict:
    existing_event = db.execute(
        text("SELECT id FROM campus_events WHERE id = :event_id"),
        {"event_id": event_id},
    ).scalar_one_or_none()
    if existing_event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus event not found.")
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event end time must be later than the start time.")
    if payload.club_id is not None:
        existing_club = db.execute(
            text("SELECT id FROM clubs WHERE id = :club_id"),
            {"club_id": payload.club_id},
        ).scalar_one_or_none()
        if existing_club is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked club not found.")

    db.execute(
        text(
            """
            UPDATE campus_events
            SET club_id = :club_id,
                title = :title,
                description = :description,
                organizer_name = :organizer_name,
                event_type = :event_type,
                location_name = :location_name,
                delivery_mode = :delivery_mode,
                starts_at = :starts_at,
                ends_at = :ends_at,
                registration_required = :registration_required,
                capacity = :capacity,
                expected_attendees = :expected_attendees,
                status = :status,
                managed_by_user_id = :managed_by_user_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :event_id
            """
        ),
        {
            "event_id": event_id,
            "club_id": payload.club_id,
            "title": payload.title.strip(),
            "description": payload.description,
            "organizer_name": payload.organizer_name.strip(),
            "event_type": payload.event_type.strip(),
            "location_name": payload.location_name.strip(),
            "delivery_mode": payload.delivery_mode,
            "starts_at": payload.starts_at,
            "ends_at": payload.ends_at,
            "registration_required": payload.registration_required,
            "capacity": payload.capacity,
            "expected_attendees": payload.expected_attendees,
            "status": payload.status,
            "managed_by_user_id": actor_user_id,
        },
    )
    _create_audit_log(db, actor_user_id, "campus_event", event_id, "update", f"Updated campus event {payload.title.strip()}")
    db.commit()

    return {
        "message": "Campus event updated successfully.",
        "event": _get_campus_event_item(db, event_id),
    }


def update_admin_user_status(db: Session, actor_user_id: int, user_id: int, payload: UserStatusUpdateRequest) -> dict:
    if actor_user_id == user_id and payload.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account from this workspace.")

    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    db.execute(
        text(
            """
            UPDATE users
            SET status = :status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            """
        ),
        {
            "user_id": user_id,
            "status": payload.status,
        },
    )
    _create_audit_log(
        db,
        actor_user_id,
        "users",
        user_id,
        "status_change",
        f"Changed account status for {identity.email} to {payload.status}",
    )
    _create_notification(
        db,
        user_ids=[user_id],
        category="system",
        severity="warning" if payload.status != "active" else "info",
        title="Account status updated",
        message=f"Your CIS account status is now {payload.status}.",
        created_by_user_id=actor_user_id,
        source_entity_type="user",
        source_entity_id=user_id,
    )
    db.commit()

    refreshed = get_identity_by_user_id(db, user_id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to refresh the updated account.")

    return {
        "message": f"Account status updated to {payload.status}.",
        "user": serialize_user(refreshed),
    }


def update_admin_user_role(db: Session, actor_user_id: int, user_id: int, payload: UserRoleUpdateRequest) -> dict:
    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if actor_user_id == user_id and payload.role != ROLE_SYSTEM_ADMIN:
        remaining_system_admins = db.execute(
            text(
                """
                SELECT COUNT(*)
                FROM users
                WHERE role = :role_code
                  AND deleted_at IS NULL
                """
            ),
            {"role_code": ROLE_SYSTEM_ADMIN},
        ).scalar_one()
        if int(remaining_system_admins or 0) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The last System Admin cannot remove their own system administration role.",
            )

    has_student_profile = db.execute(
        text("SELECT id FROM student_profiles WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).scalar_one_or_none()
    has_teacher_profile = db.execute(
        text("SELECT id FROM teacher_profiles WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).scalar_one_or_none()
    has_staff_profile = db.execute(
        text("SELECT id FROM admin_profiles WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).scalar_one_or_none()

    if payload.role == ROLE_STUDENT and has_student_profile is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account does not have a student profile.")
    if payload.role == ROLE_INSTRUCTOR and has_teacher_profile is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account does not have an instructor profile.")
    if payload.role in STAFF_ROLES and has_staff_profile is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account does not have a staff profile.")

    db.execute(
        text(
            """
            UPDATE users
            SET role = :role,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            """
        ),
        {
            "user_id": user_id,
            "role": payload.role,
        },
    )
    _create_audit_log(
        db,
        actor_user_id,
        "users",
        user_id,
        "update",
        f"Changed primary role for {identity.email} to {payload.role}",
    )
    _create_notification(
        db,
        user_ids=[user_id],
        category="system",
        severity="info",
        title="Role assignment updated",
        message=f"Your primary CIS role is now {payload.role}.",
        created_by_user_id=actor_user_id,
        source_entity_type="user",
        source_entity_id=user_id,
    )
    db.commit()

    refreshed = get_identity_by_user_id(db, user_id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to refresh the updated account.")

    return {
        "message": f"Primary role updated to {payload.role}.",
        "user": serialize_user(refreshed),
    }


def reset_admin_user_password(db: Session, actor_user_id: int, user_id: int) -> AdminPasswordResetResponse:
    identity = get_identity_by_user_id(db, user_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    temporary_password = _generate_temporary_password()
    db.execute(
        text(
            """
            UPDATE users
            SET password_hash = :password_hash,
                must_change_password = TRUE,
                password_changed_at = NULL,
                failed_login_count = 0,
                last_failed_login_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
            """
        ),
        {
            "user_id": user_id,
            "password_hash": hash_password(temporary_password),
        },
    )
    _create_audit_log(
        db,
        actor_user_id,
        "users",
        user_id,
        "update",
        f"Reset password for {identity.email}",
    )
    db.commit()

    refreshed = get_identity_by_user_id(db, user_id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to refresh the updated account.")

    return AdminPasswordResetResponse(
        user=serialize_user(refreshed),
        temporary_password=temporary_password,
    )
