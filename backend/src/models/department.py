from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from src.config.database import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    code = Column(String(30), unique=True, nullable=False)

    departments = relationship("Department", back_populates="faculty")

class Department(Base):
    __tablename__ = "departments"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(150), nullable=False)
    code       = Column(String(20), unique=True, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=True)

    faculty     = relationship("Faculty", back_populates="departments")
    programs    = relationship("Program", back_populates="department")
    instructors = relationship("Instructor", back_populates="department")
    courses     = relationship("Course", back_populates="department")
