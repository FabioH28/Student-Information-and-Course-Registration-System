from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    description = Column(String(255), nullable=False)
    amount      = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False, default=0)
    due_date    = Column(Date, nullable=False)
    status      = Column(String(30), nullable=False, default="pending")
    issued_at   = Column(DateTime, server_default=func.now(), nullable=False)

    student  = relationship("Student", back_populates="invoices")
    semester = relationship("Semester", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")
    holds    = relationship("Hold", back_populates="invoice")

class Payment(Base):
    __tablename__ = "payments"

    id          = Column(Integer, primary_key=True, index=True)
    invoice_id  = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount      = Column(Numeric(10, 2), nullable=False)
    method      = Column(String(50), nullable=False)
    reference   = Column(String(100))
    paid_at     = Column(DateTime, server_default=func.now(), nullable=False)

    invoice          = relationship("Invoice", back_populates="payments")
    recorded_by_user = relationship("User")

class Hold(Base):
    __tablename__ = "holds"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    invoice_id  = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    reason      = Column(String(255), nullable=False)
    effect      = Column(String(255), nullable=False)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime, server_default=func.now(), nullable=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    student          = relationship("Student", back_populates="holds", foreign_keys=[student_id])
    invoice          = relationship("Invoice", back_populates="holds")
    created_by_user  = relationship("User", foreign_keys=[created_by])
    resolved_by_user = relationship("User", foreign_keys=[resolved_by])
