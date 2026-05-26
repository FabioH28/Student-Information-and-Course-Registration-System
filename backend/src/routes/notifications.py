from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.announcement import Announcement
from src.models.notification import Notification
from src.models.user import User
from src.utils.security import get_current_user, require_roles


router = APIRouter(tags=["Notifications"])


class AnnouncementIn(BaseModel):
    title: str
    content: str
    target_role: str | None = None


def notification_payload(item: Notification) -> dict:
    return {
        "id": item.id,
        "user_id": item.user_id,
        "title": item.title,
        "message": item.message,
        "type": item.type,
        "is_read": item.is_read,
        "created_at": item.created_at,
    }


@router.get("/notifications", response_model=List[dict])
def notifications(unread_only: bool = False, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return [notification_payload(item) for item in q.order_by(Notification.created_at.desc()).all()]


@router.put("/notifications/{notification_id}/read")
def mark_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.commit()
    return {"ok": True}


@router.put("/notifications/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"ok": True}


@router.get("/announcements", response_model=List[dict])
def announcements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Announcement)
    return [item.__dict__ for item in q.order_by(Announcement.published_at.desc()).all()]


@router.post("/announcements", response_model=dict, status_code=201)
def create_announcement(body: AnnouncementIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    item = Announcement(created_by=current_user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.__dict__
