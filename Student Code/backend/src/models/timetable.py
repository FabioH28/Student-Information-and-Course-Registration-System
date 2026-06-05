from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(UnsignedInteger, ForeignKey("groups.id"), nullable=True)
    building_id = Column(UnsignedInteger, ForeignKey("buildings.id"), nullable=True)
    classroom_id = Column(UnsignedInteger, ForeignKey("classrooms.id"), nullable=True)
    room_id = Column(UnsignedInteger, ForeignKey("classrooms.id"), nullable=True)
    room_type = Column(String(30), nullable=True)
    lab_id = Column(UnsignedInteger, ForeignKey("classrooms.id"), nullable=True)
    day_of_week = Column(String(20), nullable=False)
    timetable_date = Column(Date)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    teaching_hours = Column(Integer)
    created_by_staff_id = Column(UnsignedInteger, ForeignKey("staff_profiles.id"), nullable=True)
    is_published = Column(Boolean, nullable=False, default=True)
    room = Column(String(50))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering", back_populates="timetable_entries")
    group = relationship("StudentGroup", back_populates="timetable_entries")
    building = relationship("Building", back_populates="timetable_entries", foreign_keys=[building_id])
    classroom = relationship("Classroom", back_populates="timetable_entries", foreign_keys=[classroom_id])
    room_resource = relationship("Classroom", foreign_keys=[room_id])
    lab = relationship("Classroom", back_populates="lab_timetable_entries", foreign_keys=[lab_id])


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    timetable_entry_id = Column(UnsignedInteger, ForeignKey("timetable_entries.id", ondelete="SET NULL"), nullable=True)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    course_id = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(UnsignedInteger, ForeignKey("faculties.id"), nullable=True)
    program_id = Column(UnsignedInteger, ForeignKey("programs.id"), nullable=True)
    study_level_id = Column(UnsignedInteger, nullable=True)
    academic_year_id = Column(UnsignedInteger, nullable=True)
    semester_id = Column(UnsignedInteger, ForeignKey("semesters.id"), nullable=True)
    week_id = Column(Integer, nullable=False)
    session_date = Column(Date, nullable=False)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    building_id = Column(UnsignedInteger, ForeignKey("buildings.id"), nullable=True)
    room_id = Column(UnsignedInteger, ForeignKey("classrooms.id"), nullable=True)
    room_type = Column(String(30), nullable=True)
    lab_id = Column(UnsignedInteger, ForeignKey("classrooms.id"), nullable=True)
    room = Column(String(80), nullable=True)
    session_order = Column(Integer, nullable=False, default=1)
    topic_title = Column(String(255), nullable=True)
    topic_description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="planned")
    created_by_teacher = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering")
    teacher = relationship("Instructor")
    timetable_entry = relationship("TimetableEntry")
    room_resource = relationship("Classroom", foreign_keys=[room_id])
    lab = relationship("Classroom", foreign_keys=[lab_id])
