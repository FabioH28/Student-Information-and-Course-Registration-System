from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.campus_resource import Building, Classroom, StudentGroup
from src.models.offering import Offering
from src.models.timetable import TimetableEntry
from src.models.user import User
from src.utils.security import require_roles

router = APIRouter(prefix="/api/admin", tags=["Campus Resources"])
admin_roles = require_roles("academic_staff", "system_admin")


class BuildingIn(BaseModel):
    code: str
    name: str


class ClassroomIn(BaseModel):
    building_id: int
    name: str
    room_type: str = "classroom"
    capacity: int | None = None


class GroupIn(BaseModel):
    name: str
    program_id: int | None = None
    department_id: int | None = None
    academic_year: str | None = None


class TimetableEntryIn(BaseModel):
    course_offering_id: int
    day_of_week: str
    start_time: str
    end_time: str
    timetable_date: date | None = None
    group_id: int | None = None
    building_id: int | None = None
    classroom_id: int | None = None
    lab_id: int | None = None
    teaching_hours: int | None = None
    room: str | None = None


def building_payload(item: Building) -> dict:
    return {"id": item.id, "code": item.code, "name": item.name}


def classroom_payload(item: Classroom) -> dict:
    return {
        "id": item.id,
        "building_id": item.building_id,
        "building_code": item.building.code if item.building else None,
        "name": item.name,
        "room_type": item.room_type,
        "capacity": item.capacity,
    }


def group_payload(item: StudentGroup) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "program_id": item.program_id,
        "department_id": item.department_id,
        "academic_year": item.academic_year,
    }


def timetable_payload(item: TimetableEntry) -> dict:
    return {
        "id": item.id,
        "course_offering_id": item.course_offering_id,
        "day_of_week": item.day_of_week,
        "timetable_date": item.timetable_date.isoformat() if item.timetable_date else None,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "group_id": item.group_id,
        "group_name": item.group.name if item.group else (item.offering.group_name if item.offering else None),
        "building_id": item.building_id,
        "building_code": item.building.code if item.building else None,
        "classroom_id": item.classroom_id,
        "classroom_name": item.classroom.name if item.classroom else None,
        "lab_id": item.lab_id,
        "lab_name": item.lab.name if item.lab else None,
        "teaching_hours": item.teaching_hours,
        "room": item.room,
    }


@router.get("/buildings")
def list_buildings(_: User = Depends(admin_roles), db: Session = Depends(get_db)):
    return {"success": True, "data": [building_payload(item) for item in db.query(Building).order_by(Building.code).all()]}


@router.post("/buildings")
def create_building(body: BuildingIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = Building(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "data": building_payload(item)}


@router.put("/buildings/{item_id}")
def update_building(item_id: int, body: BuildingIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(Building, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Building not found")
    item.code = body.code
    item.name = body.name
    db.commit()
    return {"success": True, "data": building_payload(item)}


@router.delete("/buildings/{item_id}", status_code=204)
def delete_building(item_id: int, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(Building, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Building not found")
    db.delete(item)
    db.commit()


@router.get("/classrooms")
def list_classrooms(_: User = Depends(admin_roles), db: Session = Depends(get_db)):
    return {"success": True, "data": [classroom_payload(item) for item in db.query(Classroom).order_by(Classroom.name).all()]}


@router.post("/classrooms")
def create_classroom(body: ClassroomIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = Classroom(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "data": classroom_payload(item)}


@router.put("/classrooms/{item_id}")
def update_classroom(item_id: int, body: ClassroomIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(Classroom, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Classroom not found")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    db.commit()
    return {"success": True, "data": classroom_payload(item)}


@router.delete("/classrooms/{item_id}", status_code=204)
def delete_classroom(item_id: int, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(Classroom, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Classroom not found")
    db.delete(item)
    db.commit()


@router.get("/groups")
def list_groups(_: User = Depends(admin_roles), db: Session = Depends(get_db)):
    return {"success": True, "data": [group_payload(item) for item in db.query(StudentGroup).order_by(StudentGroup.name).all()]}


@router.post("/groups")
def create_group(body: GroupIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = StudentGroup(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "data": group_payload(item)}


@router.put("/groups/{item_id}")
def update_group(item_id: int, body: GroupIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(StudentGroup, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    db.commit()
    return {"success": True, "data": group_payload(item)}


@router.delete("/groups/{item_id}", status_code=204)
def delete_group(item_id: int, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(StudentGroup, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(item)
    db.commit()


@router.get("/timetable-entries")
def list_timetable_entries(_: User = Depends(admin_roles), db: Session = Depends(get_db)):
    return {"success": True, "data": [timetable_payload(item) for item in db.query(TimetableEntry).order_by(TimetableEntry.day_of_week, TimetableEntry.start_time).all()]}


@router.post("/timetable-entries")
def create_timetable_entry(body: TimetableEntryIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    if not db.get(Offering, body.course_offering_id):
        raise HTTPException(status_code=404, detail="Course offering not found")
    item = TimetableEntry(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "data": timetable_payload(item)}


@router.put("/timetable-entries/{item_id}")
def update_timetable_entry(item_id: int, body: TimetableEntryIn, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(TimetableEntry, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    db.commit()
    return {"success": True, "data": timetable_payload(item)}


@router.delete("/timetable-entries/{item_id}", status_code=204)
def delete_timetable_entry(item_id: int, _: User = Depends(admin_roles), db: Session = Depends(get_db)):
    item = db.get(TimetableEntry, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    db.delete(item)
    db.commit()
