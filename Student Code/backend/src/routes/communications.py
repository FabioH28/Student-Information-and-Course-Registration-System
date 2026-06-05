from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.announcement import Announcement
from src.models.campus_event import CampusEvent, EventRegistration
from src.models.club import Club, ClubMembership
from src.models.notification import Notification
from src.models.student import Student
from src.models.user import User
from src.utils.security import canonical_role, get_current_user, require_roles


class CampusEventIn(BaseModel):
    club_id: int | None = None
    title: str
    description: str | None = None
    organizer_name: str
    event_type: str = "event"
    location_name: str | None = None
    delivery_mode: str = "onsite"
    starts_at: datetime
    ends_at: datetime | None = None
    status: str = "scheduled"
    registration_required: bool = False
    capacity: int | None = None


class ReviewRequestIn(BaseModel):
    decision: str  # approved | rejected | waitlisted


class AnnouncementIn(BaseModel):
    title: str
    content: str
    target_role: str | None = None

router = APIRouter(prefix="/communications", tags=["Communications"])


@router.get("/feed")
def news_feed(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = canonical_role(current_user.role)
    announcements = (
        db.query(Announcement)
        .filter((Announcement.target_role.is_(None)) | (Announcement.target_role == "") | (Announcement.target_role == role))
        .order_by(Announcement.published_at.desc())
        .limit(25)
        .all()
    )
    ann_items = [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "target_role": a.target_role,
        "published_at": a.published_at,
    } for a in announcements]

    now = datetime.now()
    events = (
        db.query(CampusEvent)
        .filter(CampusEvent.starts_at >= now, CampusEvent.status.in_(["scheduled", "open", "internal"]))
        .order_by(CampusEvent.starts_at.asc())
        .limit(25)
        .all()
    )
    my_regs = {r.event_id: r.status for r in db.query(EventRegistration).filter(EventRegistration.user_id == current_user.id).all()}
    event_items = [{
        "id": e.id,
        "title": e.title,
        "organizer_name": e.organizer_name,
        "event_type": e.event_type,
        "location_name": e.location_name,
        "delivery_mode": e.delivery_mode,
        "registration_required": e.registration_required,
        "capacity": e.capacity,
        "starts_at": e.starts_at,
        "ends_at": e.ends_at,
        "status": e.status,
        "registration_status": my_regs.get(e.id),
    } for e in events]

    return {"announcements": ann_items, "events": event_items}


@router.post("/events/{event_id}/register")
def register_for_event(event_id: int, _body: dict | None = Body(default=None),
                       current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now()
    event = (
        db.query(CampusEvent)
        .filter(CampusEvent.id == event_id, CampusEvent.starts_at >= now,
                CampusEvent.status.in_(["scheduled", "open", "internal"]))
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Campus event not found or not open for registration.")

    existing = (
        db.query(EventRegistration)
        .filter(EventRegistration.event_id == event_id, EventRegistration.user_id == current_user.id)
        .first()
    )
    if existing and existing.status in ("registered", "waitlisted"):
        raise HTTPException(status_code=409, detail="You already have a registration for this event.")

    active_count = (
        db.query(EventRegistration)
        .filter(EventRegistration.event_id == event_id, EventRegistration.status.in_(["registered", "waitlisted"]))
        .count()
    )
    reg_status = "registered"
    if event.capacity and active_count >= int(event.capacity):
        reg_status = "waitlisted"

    if existing:
        existing.status = reg_status
        existing.registered_at = now
    else:
        db.add(EventRegistration(event_id=event_id, user_id=current_user.id, status=reg_status, registered_at=now))

    db.add(Notification(
        user_id=current_user.id,
        title="Campus event registration updated",
        message=(f"You are registered for {event.title}." if reg_status == "registered"
                 else f"{event.title} is full, so you were added to the waitlist."),
        type="success" if reg_status == "registered" else "info",
    ))
    db.commit()
    return {"status": reg_status, "message": f"You are {reg_status} for {event.title}."}


# ── Staff / communications management (academic_staff, system_admin) ──────────

def _announcement_payload(a: Announcement) -> dict:
    return {"id": a.id, "title": a.title, "content": a.content, "target_role": a.target_role, "published_at": a.published_at}


@router.get("/announcements")
def list_announcements(current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    rows = db.query(Announcement).order_by(Announcement.published_at.desc()).all()
    return [_announcement_payload(a) for a in rows]


@router.post("/announcements", status_code=201)
def create_announcement(body: AnnouncementIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    item = Announcement(created_by=current_user.id, title=body.title, content=body.content, target_role=body.target_role)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Announcement published.", "announcement": _announcement_payload(item)}



def _event_payload(e: CampusEvent) -> dict:
    return {
        "id": e.id, "club_id": e.club_id, "title": e.title, "description": e.description,
        "organizer_name": e.organizer_name, "event_type": e.event_type, "location_name": e.location_name,
        "delivery_mode": e.delivery_mode, "starts_at": e.starts_at, "ends_at": e.ends_at,
        "status": e.status, "registration_required": e.registration_required, "capacity": e.capacity,
    }


@router.get("/dashboard")
def comms_dashboard(current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    now = datetime.now()
    events = db.query(CampusEvent).order_by(CampusEvent.starts_at.desc()).all()
    clubs = db.query(Club).all()
    announcements = db.query(Announcement).order_by(Announcement.published_at.desc()).limit(5).all()
    pending = db.query(ClubMembership).filter(ClubMembership.status.in_(["pending", "waitlisted"])).count()
    upcoming = [e for e in events if e.starts_at and e.starts_at >= now]
    return {
        "stats": {
            "announcements": db.query(Announcement).count(),
            "events": len(events),
            "upcoming_events": len(upcoming),
            "clubs": len(clubs),
            "pending_requests": pending,
        },
        "recent_announcements": [{"id": a.id, "title": a.title, "published_at": a.published_at} for a in announcements],
        "upcoming_events": [_event_payload(e) for e in upcoming[:5]],
    }


@router.post("/events", status_code=201)
def create_event(body: CampusEventIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    if body.ends_at and body.ends_at < body.starts_at:
        raise HTTPException(status_code=400, detail="End time must be after start time.")
    event = CampusEvent(**body.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"message": "Campus event created.", "event": _event_payload(event)}


@router.put("/events/{event_id}")
def update_event(event_id: int, body: CampusEventIn, current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    for key, value in body.model_dump().items():
        setattr(event, key, value)
    db.commit()
    return {"message": "Campus event updated.", "event": _event_payload(event)}


@router.get("/clubs/overview")
def clubs_overview(current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    clubs = db.query(Club).all()
    memberships = db.query(ClubMembership).all()
    active_count: dict[int, int] = {}
    pending_count: dict[int, int] = {}
    for m in memberships:
        if m.status == "active":
            active_count[m.club_id] = active_count.get(m.club_id, 0) + 1
        elif m.status in ("pending", "waitlisted"):
            pending_count[m.club_id] = pending_count.get(m.club_id, 0) + 1

    club_rows = [{
        "club_id": c.id, "club_code": c.code, "club_name": c.name, "club_status": c.status,
        "join_mode": c.join_mode, "active_members": int(active_count.get(c.id, 0)),
        "pending_requests": int(pending_count.get(c.id, 0)),
    } for c in clubs]

    club_by_id = {c.id: c for c in clubs}
    pending_members = db.query(ClubMembership).filter(ClubMembership.status.in_(["pending", "waitlisted"])).all()
    students = {s.id: s for s in db.query(Student).filter(Student.id.in_([m.student_id for m in pending_members] or [0])).all()}
    requests = []
    for m in pending_members:
        s = students.get(m.student_id)
        requests.append({
            "id": m.id, "club_id": m.club_id,
            "club_name": club_by_id[m.club_id].name if m.club_id in club_by_id else "Club",
            "student_name": f"{s.first_name} {s.last_name}" if s else "Student",
            "student_code": s.student_code if s else "",
            "requested_role": m.member_role, "status": m.status,
            "submitted_at": m.submitted_at or m.created_at,
        })
    return {"clubs": club_rows, "join_requests": requests}


@router.put("/clubs/requests/{membership_id}")
def review_request(membership_id: int, body: ReviewRequestIn,
                   current_user: User = Depends(require_roles("academic_staff", "system_admin")), db: Session = Depends(get_db)):
    m = db.query(ClubMembership).filter(ClubMembership.id == membership_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Join request not found.")
    if body.decision not in ("approved", "rejected", "waitlisted"):
        raise HTTPException(status_code=400, detail="Invalid decision.")

    now = datetime.now()
    if body.decision == "approved":
        m.status = "active"
        m.joined_at = now
    elif body.decision == "waitlisted":
        m.status = "waitlisted"
    else:
        m.status = "rejected"
    m.reviewed_at = now

    # notify the student (find their user_id via student profile)
    student = db.query(Student).filter(Student.id == m.student_id).first()
    club = db.query(Club).filter(Club.id == m.club_id).first()
    if student and club:
        verb = {"active": "approved", "waitlisted": "waitlisted", "rejected": "declined"}[m.status]
        db.add(Notification(
            user_id=student.user_id,
            title="Club membership update",
            message=f"Your request to join {club.name} was {verb}.",
            type="success" if m.status == "active" else "info",
        ))
    db.commit()
    return {"message": f"Join request marked as {m.status}."}
