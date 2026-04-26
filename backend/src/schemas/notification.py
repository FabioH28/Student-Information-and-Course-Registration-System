from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    target_role: Optional[str]
    published_at: datetime

    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = None
