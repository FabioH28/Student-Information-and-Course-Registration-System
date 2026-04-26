from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.config.database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id           = Column(Integer, primary_key=True, index=True)
    created_by   = Column(Integer, ForeignKey("users.id"), nullable=False)
    title        = Column(String(255), nullable=False)
    content      = Column(String, nullable=False)
    target_role  = Column(String(50))
    published_at = Column(DateTime, server_default=func.getutcdate(), nullable=False)

    author = relationship("User")
