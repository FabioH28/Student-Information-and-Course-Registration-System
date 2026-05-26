from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.message import Message
from src.models.user import User
from src.utils.security import canonical_role, get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

STAFF_ROLES = {"academic_staff", "finance_staff", "system_admin", "instructor"}
BROADCAST_ROLES = {"academic_staff", "system_admin"}


class SendMessageIn(BaseModel):
    recipient_id: int | None = None
    subject: str
    body: str
    parent_id: int | None = None
    broadcast: bool = False


def _display_name(user: User | None) -> str:
    if not user:
        return "Unknown"
    return user.full_name or user.email


def inbox_payload(m: Message, sender: User | None) -> dict:
    return {
        "id": m.id,
        "sender_id": m.sender_id,
        "sender_name": _display_name(sender),
        "sender_role": canonical_role(sender.role) if sender else "",
        "subject": m.subject,
        "body": m.body,
        "parent_id": m.parent_id,
        "is_broadcast": 1 if m.is_broadcast else 0,
        "sent_at": m.sent_at,
        "read_at": m.read_at,
    }


@router.get("/inbox")
def inbox(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Message)
        .filter(or_(Message.recipient_id == current_user.id, Message.is_broadcast == True))
        .filter(Message.sender_id != current_user.id)
        .order_by(Message.sent_at.desc())
        .limit(100)
        .all()
    )
    senders = {u.id: u for u in db.query(User).filter(User.id.in_([m.sender_id for m in rows] or [0])).all()}
    items = [inbox_payload(m, senders.get(m.sender_id)) for m in rows]
    unread = sum(1 for m in rows if m.read_at is None and not m.is_broadcast)
    return {"total": len(items), "unread": unread, "items": items}


@router.get("/sent")
def sent(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Message)
        .filter(Message.sender_id == current_user.id)
        .order_by(Message.sent_at.desc())
        .limit(100)
        .all()
    )
    recips = {u.id: u for u in db.query(User).filter(User.id.in_([m.recipient_id for m in rows if m.recipient_id] or [0])).all()}
    items = []
    for m in rows:
        items.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "recipient_name": "All Users" if m.is_broadcast else _display_name(recips.get(m.recipient_id)),
            "subject": m.subject,
            "body": m.body,
            "parent_id": m.parent_id,
            "is_broadcast": 1 if m.is_broadcast else 0,
            "sent_at": m.sent_at,
            "read_at": m.read_at,
        })
    unread = sum(1 for m in rows if m.read_at is None and not m.is_broadcast)
    return {"total": len(items), "unread": unread, "items": items}


@router.get("/contacts")
def contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = canonical_role(current_user.role)
    q = db.query(User).filter(User.is_active == True, User.id != current_user.id)
    if role == "student":
        # students may not message other students
        rows = [u for u in q.all() if canonical_role(u.role) != "student"]
    else:
        rows = q.all()
    rows.sort(key=lambda u: (canonical_role(u.role), _display_name(u)))
    return {"contacts": [{"user_id": u.id, "full_name": _display_name(u), "role": canonical_role(u.role)} for u in rows]}


@router.post("")
def send_message(body: SendMessageIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sender_role = canonical_role(current_user.role)

    if body.broadcast:
        if sender_role not in BROADCAST_ROLES:
            raise HTTPException(status_code=403, detail="Only staff and admins can send broadcasts.")
        msg = Message(sender_id=current_user.id, recipient_id=None, subject=body.subject, body=body.body,
                      parent_id=body.parent_id, is_broadcast=True)
        db.add(msg)
        db.commit()
        return {"message": "Broadcast sent to all users."}

    if body.recipient_id is None:
        raise HTTPException(status_code=400, detail="recipient_id is required for direct messages.")

    recipient = db.query(User).filter(User.id == body.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")
    if not recipient.is_active:
        raise HTTPException(status_code=400, detail="This recipient is not available for messaging.")
    if sender_role == "student" and canonical_role(recipient.role) == "student":
        raise HTTPException(status_code=403, detail="Students may not message other students.")

    msg = Message(sender_id=current_user.id, recipient_id=body.recipient_id, subject=body.subject,
                  body=body.body, parent_id=body.parent_id, is_broadcast=False)
    db.add(msg)
    db.commit()
    return {"message": f"Message sent to {_display_name(recipient)}."}


@router.put("/{message_id}/read")
def mark_read(message_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id, Message.recipient_id == current_user.id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.read_at is None:
        msg.read_at = datetime.now()
        db.commit()
    return {"ok": True}
