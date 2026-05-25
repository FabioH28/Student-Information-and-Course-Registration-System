from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class ClubCategory(Base):
    __tablename__ = "club_categories"

    id   = Column(UnsignedInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)


class Club(Base):
    __tablename__ = "clubs"

    id                    = Column(UnsignedInteger, primary_key=True, index=True)
    code                  = Column(String(30), nullable=False, unique=True)
    name                  = Column(String(150), nullable=False)
    category_id           = Column(UnsignedInteger, ForeignKey("club_categories.id"), nullable=True)
    description           = Column(Text, nullable=True)
    status                = Column(String(20), nullable=False, default="active")   # active | recruiting | inactive
    join_mode             = Column(String(20), nullable=False, default="open")     # open | request | waitlist
    advisor_instructor_id = Column(UnsignedInteger, ForeignKey("instructors.id", ondelete="SET NULL"), nullable=True)
    meeting_day_of_week   = Column(String(15), nullable=True)
    meeting_start_time    = Column(Time, nullable=True)
    meeting_end_time      = Column(Time, nullable=True)
    meeting_location      = Column(String(150), nullable=True)
    created_at            = Column(DateTime, server_default=func.now(), nullable=False)


class ClubMembership(Base):
    __tablename__ = "club_memberships"

    id              = Column(UnsignedInteger, primary_key=True, index=True)
    club_id         = Column(UnsignedInteger, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id      = Column(UnsignedInteger, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    member_role     = Column(String(50), nullable=False, default="member")
    status          = Column(String(20), nullable=False, default="pending")  # active | pending | waitlisted | rejected
    request_message = Column(String(255), nullable=True)
    submitted_at    = Column(DateTime, nullable=True)
    reviewed_at     = Column(DateTime, nullable=True)
    joined_at       = Column(DateTime, nullable=True)
    created_at      = Column(DateTime, server_default=func.now(), nullable=False)
