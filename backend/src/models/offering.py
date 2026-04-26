from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.database import Base

class Offering(Base):
    __tablename__ = "offerings"

    id            = Column(Integer, primary_key=True, index=True)
    course_id     = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=False)
    semester_id   = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    room          = Column(String(50))
    schedule      = Column(String(200))
    capacity      = Column(Integer, nullable=False)
    enrolled      = Column(Integer, nullable=False, default=0)
    status        = Column(String(30), nullable=False, default="active")

    course        = relationship("Course", back_populates="offerings")
    instructor    = relationship("Instructor", back_populates="offerings")
    semester      = relationship("Semester", back_populates="offerings")
    registrations = relationship("Registration", back_populates="offering")
    sessions      = relationship("AttendanceSession", back_populates="offering")
