from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.database import Base

class Program(Base):
    __tablename__ = "programs"

    id                 = Column(Integer, primary_key=True, index=True)
    name               = Column(String(150), nullable=False)
    code               = Column(String(20), unique=True, nullable=False)
    department_id      = Column(Integer, ForeignKey("departments.id"), nullable=False)
    total_credits      = Column(Integer, nullable=False)
    duration_semesters = Column(Integer, nullable=False)

    department = relationship("Department", back_populates="programs")
    students   = relationship("Student", back_populates="program")
