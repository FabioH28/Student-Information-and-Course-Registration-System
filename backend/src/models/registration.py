from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class Registration(Base):
    __tablename__ = "registrations"

    id            = Column(Integer, primary_key=True, index=True)
    student_id    = Column(Integer, ForeignKey("students.id"), nullable=False)
    offering_id   = Column(Integer, ForeignKey("offerings.id"), nullable=False)
    registered_at = Column(DateTime, server_default=func.now(), nullable=False)
    status        = Column(String(30), nullable=False, default="active")

    student  = relationship("Student", back_populates="registrations")
    offering = relationship("Offering", back_populates="registrations")
    grade    = relationship("Grade", back_populates="registration", uselist=False)
