from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String(255), unique=True, nullable=False, index=True)
    full_name      = Column(String(255), nullable=True)
    password_hash  = Column(String(512), nullable=False)
    role           = Column(String(50), nullable=False)
    status         = Column(String(30), nullable=False, default="active")
    is_first_login = Column(Boolean, default=True, nullable=False)
    is_active      = Column(Boolean, default=True, nullable=False)
    created_at     = Column(DateTime, server_default=func.now(), nullable=False)

    student       = relationship("Student", back_populates="user", uselist=False)
    instructor    = relationship("Instructor", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
    audit_logs    = relationship("AuditLog", back_populates="user")
