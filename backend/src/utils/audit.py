from sqlalchemy.orm import Session
from src.models.audit_log import AuditLog

def log_action(db: Session, user_id: int, action: str, entity: str, entity_id: int, details: str, ip: str = None):
    log = AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, details=details, ip_address=ip)
    db.add(log)
    db.commit()
