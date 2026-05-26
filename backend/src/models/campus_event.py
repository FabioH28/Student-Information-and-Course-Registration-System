from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class CampusEvent(Base):
    __tablename__ = "campus_events"

    id                    = Column(UnsignedInteger, primary_key=True, index=True)
    club_id               = Column(UnsignedInteger, ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True)
    title                 = Column(String(180), nullable=False)
    description           = Column(Text, nullable=True)
    organizer_name        = Column(String(150), nullable=False)
    event_type            = Column(String(80), nullable=False, default="event")
    location_name         = Column(String(150), nullable=True)
    delivery_mode         = Column(String(20), nullable=False, default="onsite")
    starts_at             = Column(DateTime, nullable=False)
    ends_at               = Column(DateTime, nullable=True)
    status                = Column(String(20), nullable=False, default="scheduled")  # scheduled | open | internal | cancelled | completed
    registration_required = Column(Boolean, nullable=False, default=False)
    capacity              = Column(Integer, nullable=True)
    created_at            = Column(DateTime, server_default=func.now(), nullable=False)


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id            = Column(UnsignedInteger, primary_key=True, index=True)
    event_id      = Column(UnsignedInteger, ForeignKey("campus_events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = Column(UnsignedInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status        = Column(String(20), nullable=False, default="registered")  # registered | waitlisted | cancelled
    registered_at = Column(DateTime, server_default=func.now(), nullable=False)
