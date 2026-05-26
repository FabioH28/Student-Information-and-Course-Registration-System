from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class Message(Base):
    """Direct message between two users, or an admin/staff broadcast (recipient_id NULL)."""

    __tablename__ = "messages"

    id           = Column(UnsignedInteger, primary_key=True, index=True)
    sender_id    = Column(UnsignedInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UnsignedInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    subject      = Column(String(200), nullable=False, default="(no subject)")
    body         = Column(Text, nullable=False)
    parent_id    = Column(UnsignedInteger, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    is_broadcast = Column(Boolean, nullable=False, default=False)
    sent_at      = Column(DateTime, server_default=func.now(), nullable=False)
    read_at      = Column(DateTime, nullable=True)
