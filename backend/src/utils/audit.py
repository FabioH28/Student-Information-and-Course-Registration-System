from sqlalchemy.orm import Session

from src.models.audit_log import AuditLog


def log_action(
    db: Session,
    user_id: int | None,
    action: str,
    entity: str | None = None,
    entity_id: int | None = None,
    details: str | None = None,
    ip_address: str | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
        )
    )
