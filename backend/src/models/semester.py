from sqlalchemy import Column, Integer, String, Date, Boolean
from sqlalchemy.orm import relationship
from src.config.database import Base

class Semester(Base):
    __tablename__ = "semesters"

    id                    = Column(Integer, primary_key=True, index=True)
    name                  = Column(String(100), nullable=False)
    start_date            = Column(Date, nullable=False)
    end_date              = Column(Date, nullable=False)
    is_active             = Column(Boolean, nullable=False, default=False)
    registration_deadline = Column(Date, nullable=False)
    drop_deadline         = Column(Date, nullable=False)

    offerings = relationship("Offering", back_populates="semester")
    invoices  = relationship("Invoice", back_populates="semester")
