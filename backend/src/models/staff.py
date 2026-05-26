from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    user_id = Column(UnsignedInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    faculty_id = Column(UnsignedInteger, ForeignKey("faculties.id"), nullable=True)
    scope = Column(String(20), nullable=False, default="faculty")
    position = Column(String(120), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class StaffFacultyScope(Base):
    __tablename__ = "staff_faculty_scopes"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    user_id = Column(UnsignedInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UnsignedInteger, ForeignKey("faculties.id"), nullable=False)
