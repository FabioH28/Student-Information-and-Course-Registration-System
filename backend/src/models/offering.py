from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.config.database import Base

class Offering(Base):
    __tablename__ = "offerings"

    id            = Column(Integer, primary_key=True, index=True)
    course_id     = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=False)
    semester_id   = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    program_id    = Column(Integer, ForeignKey("programs.id"), nullable=True)
    faculty_id    = Column(Integer, ForeignKey("faculties.id"), nullable=True)
    created_by_staff_id = Column(Integer, ForeignKey("staff_profiles.id"), nullable=True)
    academic_year = Column(String(80), nullable=True)
    group_name    = Column(String(80), nullable=True)
    academic_period = Column(String(80), nullable=True)
    room          = Column(String(50))
    schedule      = Column(String(200))
    capacity      = Column(Integer, nullable=False)
    enrolled      = Column(Integer, nullable=False, default=0)
    enrollment_open = Column(Boolean, nullable=False, default=True)
    selection_deadline = Column(Date, nullable=True)
    status        = Column(String(30), nullable=False, default="active")
    created_at    = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    course        = relationship("Course", back_populates="offerings")
    instructor    = relationship("Instructor", back_populates="offerings")
    semester      = relationship("Semester", back_populates="offerings")
    program       = relationship("Program")
    registrations = relationship("Registration", back_populates="offering")
    sessions      = relationship("AttendanceSession", back_populates="offering")
    materials     = relationship("CourseMaterial", back_populates="offering")
    weekly_tasks  = relationship("WeeklyTask", back_populates="offering")
    timetable_entries = relationship("TimetableEntry", back_populates="offering", cascade="all, delete-orphan")
