from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")

class Grade(Base):
    __tablename__ = "grades"

    id               = Column(Integer, primary_key=True, index=True)
    registration_id  = Column(Integer, ForeignKey("registrations.id", ondelete="CASCADE"), unique=True, nullable=False)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id"), nullable=True)
    course_id        = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=True)
    teacher_id       = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=True)
    student_id       = Column(UnsignedInteger, ForeignKey("students.id"), nullable=True)
    midterm_score    = Column(Numeric(5, 2))
    assignment_score = Column(Numeric(5, 2))
    final_score      = Column(Numeric(5, 2))
    project_score    = Column(Numeric(5, 2))
    quiz_score       = Column(Numeric(5, 2))
    final_exam_score = Column(Numeric(5, 2))
    attendance_score = Column(Numeric(5, 2))
    participation_score = Column(Numeric(5, 2))
    lab_work_score   = Column(Numeric(5, 2))
    total_score      = Column(Numeric(5, 2))
    letter_grade     = Column(String(3))
    final_grade      = Column(Integer)
    pass_status      = Column(String(20))
    exam_blocked_due_to_absence = Column(Boolean, nullable=False, default=False)
    absence_percentage = Column(Numeric(5, 2))
    failure_reason   = Column(String(255))
    retake_allowed_next_academic_year = Column(Boolean, nullable=False, default=False)
    feedback         = Column(String)
    is_published     = Column(Boolean, nullable=False, default=False)
    created_at       = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at       = Column(DateTime, server_default=func.now(), nullable=False)

    registration = relationship("Registration", back_populates="grade")


class CourseGradeConfiguration(Base):
    __tablename__ = "course_grade_configurations"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    course_offering_id = Column(UnsignedInteger, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False, unique=True)
    course_id = Column(UnsignedInteger, ForeignKey("courses.id"), nullable=False)
    teacher_id = Column(UnsignedInteger, ForeignKey("instructors.id"), nullable=False)
    semester_id = Column(UnsignedInteger, ForeignKey("semesters.id"), nullable=True)
    academic_year = Column(String(50), nullable=True)
    midterm_points = Column(Numeric(5, 2), nullable=False, default=0)
    final_exam_points = Column(Numeric(5, 2), nullable=False, default=0)
    project_points = Column(Numeric(5, 2), nullable=False, default=0)
    assignment_points = Column(Numeric(5, 2), nullable=False, default=0)
    quiz_points = Column(Numeric(5, 2), nullable=False, default=0)
    attendance_points = Column(Numeric(5, 2), nullable=False, default=0)
    participation_points = Column(Numeric(5, 2), nullable=False, default=0)
    lab_work_points = Column(Numeric(5, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    offering = relationship("Offering")
    teacher = relationship("Instructor")
