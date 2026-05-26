from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class StudentCourseStatus(Base):
    __tablename__ = "student_course_status"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    student_id = Column(UnsignedInteger, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(80), nullable=False)
    status = Column(String(30), nullable=False, default="active")
    absence_percentage = Column(Numeric(5, 2))
    can_take_exam = Column(Boolean, nullable=False, default=True)
    can_retake_next_year = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
