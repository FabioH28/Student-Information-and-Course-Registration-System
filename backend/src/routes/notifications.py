from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.config.database import get_db
from src.models.user import User
from src.models.notification import Notification
from src.models.announcement import Announcement
from src.schemas.notification import NotificationOut, AnnouncementOut, AnnouncementCreate
from src.utils.security import get_current_user, require_roles

router = APIRouter(tags=["Notifications & Announcements"])

@router.get("/notifications", response_model=List[NotificationOut])
def my_notifications(unread_only: bool = False, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notification_id}/read", status_code=200)
def mark_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"ok": True}

@router.put("/notifications/read-all", status_code=200)
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"ok": True}

@router.get("/announcements", response_model=List[AnnouncementOut])
def list_announcements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Announcement).filter(
        (Announcement.target_role == None) |
        (Announcement.target_role == "all") |
        (Announcement.target_role == current_user.role)
    ).order_by(Announcement.published_at.desc()).all()

@router.post("/announcements", response_model=AnnouncementOut, status_code=201)
def create_announcement(body: AnnouncementCreate, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    ann = Announcement(created_by=current_user.id, title=body.title, content=body.content, target_role=body.target_role)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann
