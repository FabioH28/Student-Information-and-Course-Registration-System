from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.config.database import Base

UnsignedInteger = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")


class StudentGroup(Base):
    __tablename__ = "groups"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    name = Column(String(80), nullable=False, unique=True)
    program_id = Column(UnsignedInteger, ForeignKey("programs.id"), nullable=True)
    department_id = Column(UnsignedInteger, ForeignKey("departments.id"), nullable=True)
    academic_year = Column(String(80), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    program = relationship("Program")
    department = relationship("Department")
    timetable_entries = relationship("TimetableEntry", back_populates="group")


class Building(Base):
    __tablename__ = "buildings"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    code = Column(String(20), nullable=False, unique=True)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    classrooms = relationship("Classroom", back_populates="building", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="building", foreign_keys="TimetableEntry.building_id")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(UnsignedInteger, primary_key=True, index=True)
    building_id = Column(UnsignedInteger, ForeignKey("buildings.id"), nullable=False)
    name = Column(String(80), nullable=False)
    room_type = Column(String(30), nullable=False, default="classroom")
    capacity = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    building = relationship("Building", back_populates="classrooms")
    timetable_entries = relationship("TimetableEntry", back_populates="classroom", foreign_keys="TimetableEntry.classroom_id")
    lab_timetable_entries = relationship("TimetableEntry", back_populates="lab", foreign_keys="TimetableEntry.lab_id")
