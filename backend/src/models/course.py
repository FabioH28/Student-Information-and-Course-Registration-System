from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.database import Base

class Course(Base):
    __tablename__ = "courses"

    id                     = Column(Integer, primary_key=True, index=True)
    code                   = Column(String(20), unique=True, nullable=False)
    name                   = Column(String(200), nullable=False)
    description            = Column(String)
    credits                = Column(Integer, nullable=False)
    department_id          = Column(Integer, ForeignKey("departments.id"), nullable=False)
    prerequisite_course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    department   = relationship("Department", back_populates="courses")
    prerequisite = relationship("Course", remote_side="Course.id")
    offerings    = relationship("Offering", back_populates="course")
