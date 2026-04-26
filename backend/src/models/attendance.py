from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id           = Column(Integer, primary_key=True, index=True)
    offering_id  = Column(Integer, ForeignKey("offerings.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    topic        = Column(String(255))
    created_at   = Column(DateTime, server_default=func.getutcdate(), nullable=False)

    offering = relationship("Offering", back_populates="sessions")
    records  = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status     = Column(String(20), nullable=False)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
