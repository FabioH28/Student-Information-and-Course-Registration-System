from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.config.database import Base

class Department(Base):
    __tablename__ = "departments"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)

    programs    = relationship("Program", back_populates="department")
    instructors = relationship("Instructor", back_populates="department")
    courses     = relationship("Course", back_populates="department")
