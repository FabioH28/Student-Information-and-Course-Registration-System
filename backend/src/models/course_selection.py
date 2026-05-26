from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    course_id = Column(UnsignedInteger, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    prerequisite_course_id = Column(UnsignedInteger, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class StudentCourseSelection(Base):
    __tablename__ = "student_course_selections"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    student_id = Column(UnsignedInteger, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), nullable=False, default="selected")
    reason = Column(String(255), nullable=True)
    selected_at = Column(DateTime, server_default=func.now(), nullable=False)
    approved_at = Column(DateTime, nullable=True)
    approved_by_staff_id = Column(UnsignedInteger, ForeignKey("staff_profiles.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student")
    offering = relationship("Offering")
    approved_by_staff = relationship("StaffProfile")
