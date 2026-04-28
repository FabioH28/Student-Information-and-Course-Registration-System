from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from src.config.database import Base

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    token      = Column(String(512), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at    = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
