from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.config.database import get_db
from src.models.user import User
from src.models.instructor import Instructor
from src.models.offering import Offering
from src.models.attendance import AttendanceSession, AttendanceRecord
from src.schemas.attendance import AttendanceSessionOut, AttendanceSessionCreate, BulkAttendanceSubmit
from src.utils.security import require_roles

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/offering/{offering_id}/sessions", response_model=List[AttendanceSessionOut])
def list_sessions(offering_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    return db.query(AttendanceSession).filter(AttendanceSession.offering_id == offering_id).all()

@router.post("/offering/{offering_id}/sessions", response_model=AttendanceSessionOut, status_code=201)
def create_session(offering_id: int, body: AttendanceSessionCreate, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    offering = db.query(Offering).filter(Offering.id == offering_id, Offering.instructor_id == instructor.id).first()
    if not offering:
        raise HTTPException(status_code=403, detail="Not your offering")
    session = AttendanceSession(offering_id=offering_id, session_date=body.session_date, topic=body.topic)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/sessions/{session_id}/records", status_code=200)
def submit_attendance(session_id: int, body: BulkAttendanceSubmit, current_user: User = Depends(require_roles("instructor")), db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.offering.instructor_id != instructor.id:
        raise HTTPException(status_code=403, detail="Not your offering")
    for rec in body.records:
        existing = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == rec.student_id).first()
        if existing:
            existing.status = rec.status
        else:
            db.add(AttendanceRecord(session_id=session_id, student_id=rec.student_id, status=rec.status))
    db.commit()
    return {"saved": len(body.records)}

@router.get("/sessions/{session_id}/records")
def get_session_records(session_id: int, current_user: User = Depends(require_roles("instructor", "academic_staff", "system_admin")), db: Session = Depends(get_db)):
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    return [{"student_id": r.student_id, "status": r.status} for r in records]
