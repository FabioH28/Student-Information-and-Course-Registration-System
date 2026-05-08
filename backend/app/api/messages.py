from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, get_current_user
from app.db.session import get_db
from app.services.messages import (
    get_message_inbox,
    get_message_sent,
    get_messageable_contacts,
    mark_message_read,
    send_message,
)

router = APIRouter(prefix="/messages", tags=["messages"])


class SendMessageRequest(BaseModel):
    recipient_id: int | None = None
    subject: str
    body: str
    parent_id: int | None = None
    broadcast: bool = False


@router.get("/inbox", summary="Get received messages")
def inbox(
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return get_message_inbox(db, current_user.id)


@router.get("/sent", summary="Get sent messages")
def sent(
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return get_message_sent(db, current_user.id)


@router.get("/contacts", summary="Get list of users this account can message")
def contacts(
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return get_messageable_contacts(db, current_user.id, current_user.primary_role or "")


@router.post("", summary="Send a direct message or admin broadcast")
def compose(
    payload: SendMessageRequest,
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return send_message(
        db,
        sender_id=current_user.id,
        sender_role=current_user.primary_role or "",
        recipient_id=payload.recipient_id,
        subject=payload.subject,
        body=payload.body,
        parent_id=payload.parent_id,
        broadcast=payload.broadcast,
    )


@router.put("/{message_id}/read", summary="Mark a message as read")
def read_message(
    message_id: int,
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return mark_message_read(db, message_id, current_user.id)
