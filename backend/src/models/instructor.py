from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.database import Base

class Instructor(Base):
    __tablename__ = "instructors"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name    = Column(String(100), nullable=False)
    last_name     = Column(String(100), nullable=False)
    title         = Column(String(50))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    user       = relationship("User", back_populates="instructor")
    department = relationship("Department", back_populates="instructors")
    offerings  = relationship("Offering", back_populates="instructor")
