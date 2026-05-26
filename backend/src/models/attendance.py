from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id           = Column(Integer, primary_key=True, index=True)
    offering_id  = Column(Integer, ForeignKey("offerings.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    week_number  = Column(Integer)
    topic        = Column(String(255))
    created_at   = Column(DateTime, server_default=func.now(), nullable=False)

    offering = relationship("Offering", back_populates="sessions")
    records  = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id"), nullable=True)
    timetable_entry_id = Column(UnsignedInteger, ForeignKey("timetable_entries.id"), nullable=True)
    class_session_id = Column(UnsignedInteger, ForeignKey("class_sessions.id"), nullable=True)
    course_id = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=True)
    teacher_id = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    week_number = Column(Integer)
    attendance_date = Column(Date)
    start_time = Column(String(10))
    end_time = Column(String(10))
    status     = Column(String(20), nullable=False)
    notes      = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
    timetable_entry = relationship("TimetableEntry")
    class_session = relationship("ClassSession")
