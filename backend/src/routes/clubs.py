from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.campus_event import CampusEvent, EventRegistration
from src.models.club import Club, ClubCategory, ClubMembership
from src.models.student import Student
from src.models.user import User
from src.utils.security import canonical_role, get_current_user

router = APIRouter(prefix="/clubs", tags=["Clubs"])

ACTIVE = "active"


def _require_student(current_user: User, db: Session) -> Student:
    if canonical_role(current_user.role) != "student":
        raise HTTPException(status_code=403, detail="Students only.")
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return student


@router.get("")
def my_clubs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = _require_student(current_user, db)
    clubs = db.query(Club).all()
    categories = {c.id: c.name for c in db.query(ClubCategory).all()}
    memberships = db.query(ClubMembership).filter(ClubMembership.student_id == student.id).all()

    # counts per club
    all_memberships = db.query(ClubMembership).all()
    active_count: dict[int, int] = {}
    pending_count: dict[int, int] = {}
    for m in all_memberships:
        if m.status == "active":
            active_count[m.club_id] = active_count.get(m.club_id, 0) + 1
        elif m.status in ("pending", "waitlisted"):
            pending_count[m.club_id] = pending_count.get(m.club_id, 0) + 1

    directory = [{
        "club_id": c.id,
        "club_code": c.code,
        "club_name": c.name,
        "category_name": categories.get(c.category_id, "General"),
        "club_status": c.status,
        "join_mode": c.join_mode,
        "active_members": int(active_count.get(c.id, 0)),
        "pending_requests": int(pending_count.get(c.id, 0)),
        "description": c.description,
        "meeting_day_of_week": c.meeting_day_of_week,
        "meeting_start_time": str(c.meeting_start_time) if c.meeting_start_time else None,
        "meeting_location": c.meeting_location,
    } for c in clubs]

    club_by_id = {c.id: c for c in clubs}
    my_active = [{
        "id": m.id,
        "club_id": m.club_id,
        "club_name": club_by_id[m.club_id].name if m.club_id in club_by_id else "Club",
        "category_name": categories.get(club_by_id[m.club_id].category_id, "General") if m.club_id in club_by_id else "General",
        "member_role": m.member_role,
        "status": m.status,
        "joined_at": m.joined_at,
    } for m in memberships if m.status == ACTIVE]

    my_requests = [{
        "id": m.id,
        "club_id": m.club_id,
        "club_name": club_by_id[m.club_id].name if m.club_id in club_by_id else "Club",
        "requested_role": m.member_role,
        "status": m.status,
        "submitted_at": m.submitted_at or m.created_at,
    } for m in memberships if m.status in ("pending", "waitlisted", "rejected")]

    now = datetime.now()
    club_events = (
        db.query(CampusEvent)
        .filter(CampusEvent.club_id.isnot(None), CampusEvent.starts_at >= now,
                CampusEvent.status.in_(["scheduled", "open"]))
        .order_by(CampusEvent.starts_at.asc())
        .all()
    )
    my_event_regs = {r.event_id: r.status for r in db.query(EventRegistration).filter(EventRegistration.user_id == current_user.id).all()}
    events = [{
        "id": e.id,
        "title": e.title,
        "organizer_name": e.organizer_name,
        "event_type": e.event_type,
        "location_name": e.location_name,
        "registration_required": e.registration_required,
        "starts_at": e.starts_at,
        "status": e.status,
        "club_name": club_by_id[e.club_id].name if e.club_id in club_by_id else None,
        "registration_status": my_event_regs.get(e.id),
    } for e in club_events]

    return {"memberships": my_active, "directory": directory, "events": events, "join_requests": my_requests}


@router.post("/{club_id}/join")
def join_club(club_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = _require_student(current_user, db)
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found.")
    if club.status not in ("active", "recruiting"):
        raise HTTPException(status_code=400, detail="This club is not currently accepting requests.")

    existing = (
        db.query(ClubMembership)
        .filter(ClubMembership.club_id == club_id, ClubMembership.student_id == student.id,
                ClubMembership.status.in_(["active", "pending", "waitlisted"]))
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active or pending membership for this club.")

    now = datetime.now()
    if club.join_mode == "open":
        db.add(ClubMembership(club_id=club_id, student_id=student.id, member_role="member",
                              status="active", joined_at=now))
        db.commit()
        return {"status": "joined", "message": f"You are now a member of {club.name}."}

    new_status = "waitlisted" if club.join_mode == "waitlist" else "pending"
    db.add(ClubMembership(club_id=club_id, student_id=student.id, member_role="member",
                          status=new_status, submitted_at=now))
    db.commit()
    return {"status": "requested", "message": f"Your request for {club.name} has been submitted."}
