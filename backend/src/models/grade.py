from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class Grade(Base):
    __tablename__ = "grades"

    id               = Column(Integer, primary_key=True, index=True)
    registration_id  = Column(Integer, ForeignKey("registrations.id", ondelete="CASCADE"), unique=True, nullable=False)
    midterm_score    = Column(Numeric(5, 2))
    assignment_score = Column(Numeric(5, 2))
    final_score      = Column(Numeric(5, 2))
    total_score      = Column(Numeric(5, 2))
    letter_grade     = Column(String(3))
    is_published     = Column(Boolean, nullable=False, default=False)
    updated_at       = Column(DateTime, server_default=func.now(), nullable=False)

    registration = relationship("Registration", back_populates="grade")
