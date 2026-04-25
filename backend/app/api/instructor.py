from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import PERMISSION_INSTRUCTOR_TIMETABLE, PERMISSION_INSTRUCTOR_WORKSPACE
from app.db.session import get_db
from app.schemas.teacher import (
    AttendanceRecordBulkRequest,
    AttendanceSessionCreateRequest,
    FinalGradesPublishRequest,
    GradeComponentCreateRequest,
    GradeRecordBulkRequest,
)
from app.services.teacher import (
    create_attendance_session,
    create_grade_component,
    get_instructor_timetable,
    get_teacher_attendance_hub,
    get_teacher_courses,
    get_teacher_dashboard,
    get_teacher_gradebook,
    get_teacher_inbox,
    get_teacher_students,
    publish_final_grades,
    record_attendance_for_session,
    record_grade_scores,
)


router = APIRouter(prefix="/instructors/me", tags=["instructor"])


@router.get("/dashboard", summary="Get the signed-in instructor dashboard")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_dashboard(db, current_user.id)


@router.get("/courses", summary="Get assigned course offerings for the signed-in instructor")
def courses(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_courses(db, current_user.id)


@router.get("/students", summary="Get enrolled students for the signed-in instructor")
def students(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_students(db, current_user.id)


@router.get("/attendance", summary="Get attendance workspace data for the signed-in instructor")
def attendance(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_attendance_hub(db, current_user.id)


@router.post("/attendance/sessions", summary="Create an attendance session for an assigned offering")
def create_attendance(
    payload: AttendanceSessionCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_attendance_session(db, current_user.id, payload)


@router.post("/attendance/sessions/{session_id}/records", summary="Record attendance marks for a session")
def save_attendance_records(
    session_id: int,
    payload: AttendanceRecordBulkRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return record_attendance_for_session(db, current_user.id, session_id, payload)


@router.get("/grades", summary="Get gradebook data for the signed-in instructor")
def grades(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_gradebook(db, current_user.id)


@router.post("/grades/components", summary="Create a grade component for an assigned offering")
def create_component(
    payload: GradeComponentCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_grade_component(db, current_user.id, payload)


@router.post("/grades/components/{component_id}/scores", summary="Record or update scores for a grade component")
def save_component_scores(
    component_id: int,
    payload: GradeRecordBulkRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return record_grade_scores(db, current_user.id, component_id, payload)


@router.post("/grades/final-grades/publish", summary="Publish final grades for an assigned offering")
def publish_grades(
    payload: FinalGradesPublishRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return publish_final_grades(db, current_user.id, payload)


@router.get("/inbox", summary="Get inbox notifications for the signed-in instructor")
def inbox(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_WORKSPACE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_inbox(db, current_user.id)


@router.get("/timetable", summary="Get the timetable for the signed-in instructor")
def timetable(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_INSTRUCTOR_TIMETABLE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_instructor_timetable(db, current_user.id)
