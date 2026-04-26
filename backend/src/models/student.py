from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from src.config.database import Base

class Student(Base):
    __tablename__ = "students"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_code     = Column(String(30), unique=True, nullable=False)
    first_name       = Column(String(100), nullable=False)
    last_name        = Column(String(100), nullable=False)
    phone            = Column(String(30))
    date_of_birth    = Column(Date)
    program_id       = Column(Integer, ForeignKey("programs.id"), nullable=False)
    current_semester = Column(Integer, nullable=False, default=1)
    gpa              = Column(Numeric(4, 2), nullable=False, default=0.00)
    status           = Column(String(30), nullable=False, default="active")

    user               = relationship("User", back_populates="student")
    program            = relationship("Program", back_populates="students")
    registrations      = relationship("Registration", back_populates="student")
    invoices           = relationship("Invoice", back_populates="student")
    holds              = relationship("Hold", back_populates="student", foreign_keys="Hold.student_id")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
