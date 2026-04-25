from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import (
    PERMISSION_ACADEMIC_ATTENDANCE,
    PERMISSION_ACADEMIC_COURSES,
    PERMISSION_ACADEMIC_DASHBOARD,
    PERMISSION_ACADEMIC_GRADES,
    PERMISSION_ACADEMIC_RECORDS,
    PERMISSION_ACADEMIC_REGISTRATIONS,
    PERMISSION_ACADEMIC_TERMS,
)
from app.db.session import get_db
from app.schemas.admin import (
    AcademicTermUpsertRequest,
    CourseOfferingUpsertRequest,
    EnrollmentStatusUpdateRequest,
)
from app.schemas.teacher import (
    AttendanceRecordBulkRequest,
    AttendanceSessionCreateRequest,
    FinalGradesPublishRequest,
    GradeComponentCreateRequest,
    GradeRecordBulkRequest,
)
from app.services.admin import (
    create_admin_course_offering,
    create_admin_term,
    get_admin_courses,
    get_admin_dashboard,
    get_admin_reference_data,
    get_admin_registration_overview,
    get_admin_terms,
    list_students,
    update_admin_course_offering,
    update_admin_registration_status,
    update_admin_term,
)
from app.services.teacher import (
    create_attendance_session,
    create_grade_component,
    get_teacher_attendance_hub,
    get_teacher_gradebook,
    get_teacher_students,
    publish_final_grades,
    record_attendance_for_session,
    record_grade_scores,
)


router = APIRouter(prefix="/academic", tags=["academic"])


@router.get("/dashboard", summary="Get the academic staff dashboard")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_DASHBOARD)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_dashboard(db)


@router.get("/reference-data", summary="Get academic reference data")
def reference_data(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_DASHBOARD)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_reference_data(db)


@router.get("/students", summary="Get academic records and roster data")
def students(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_RECORDS)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_students(db, current_user.id, actor_roles=current_user.roles)


@router.get("/records", summary="List students for academic record review")
def records(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_RECORDS)),
    db: Session = Depends(get_db),
) -> dict:
    return list_students(db)


@router.get("/courses", summary="List academic course offerings")
def courses(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_COURSES)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_courses(db)


@router.post("/courses", summary="Create an academic course offering")
def create_course(
    payload: CourseOfferingUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_COURSES)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_course_offering(db, current_user.id, payload)


@router.put("/courses/{offering_id}", summary="Update an academic course offering")
def update_course(
    offering_id: int,
    payload: CourseOfferingUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_COURSES)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_course_offering(db, offering_id, payload)


@router.get("/terms", summary="List academic terms")
def terms(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_TERMS)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_terms(db)


@router.post("/terms", summary="Create an academic term")
def create_term(
    payload: AcademicTermUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_TERMS)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_term(db, payload)


@router.put("/terms/{term_id}", summary="Update an academic term")
def update_term(
    term_id: int,
    payload: AcademicTermUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_TERMS)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_term(db, term_id, payload)


@router.get("/registrations/overview", summary="Get academic registration overview data")
def registrations_overview(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_REGISTRATIONS)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_registration_overview(db)


@router.put("/registrations/{enrollment_id}/status", summary="Update a registration status")
def update_registration(
    enrollment_id: int,
    payload: EnrollmentStatusUpdateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_REGISTRATIONS)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_registration_status(db, enrollment_id, payload)


@router.get("/attendance", summary="Get the academic attendance workspace")
def attendance(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_ATTENDANCE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_attendance_hub(db, current_user.id, actor_roles=current_user.roles)


@router.post("/attendance/sessions", summary="Create an attendance session in the academic workspace")
def create_attendance(
    payload: AttendanceSessionCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_ATTENDANCE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_attendance_session(db, current_user.id, payload, actor_roles=current_user.roles)


@router.post("/attendance/sessions/{session_id}/records", summary="Record attendance marks in the academic workspace")
def save_attendance_records(
    session_id: int,
    payload: AttendanceRecordBulkRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_ATTENDANCE)),
    db: Session = Depends(get_db),
) -> dict:
    return record_attendance_for_session(db, current_user.id, session_id, payload, actor_roles=current_user.roles)


@router.get("/grades", summary="Get the academic grade management workspace")
def grades(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_GRADES)),
    db: Session = Depends(get_db),
) -> dict:
    return get_teacher_gradebook(db, current_user.id, actor_roles=current_user.roles)


@router.post("/grades/components", summary="Create a grade component from the academic workspace")
def create_component(
    payload: GradeComponentCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_GRADES)),
    db: Session = Depends(get_db),
) -> dict:
    return create_grade_component(db, current_user.id, payload, actor_roles=current_user.roles)


@router.post("/grades/components/{component_id}/scores", summary="Record or update scores from the academic workspace")
def save_component_scores(
    component_id: int,
    payload: GradeRecordBulkRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_GRADES)),
    db: Session = Depends(get_db),
) -> dict:
    return record_grade_scores(db, current_user.id, component_id, payload, actor_roles=current_user.roles)


@router.post("/grades/final-grades/publish", summary="Publish final grades from the academic workspace")
def publish_grades(
    payload: FinalGradesPublishRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ACADEMIC_GRADES)),
    db: Session = Depends(get_db),
) -> dict:
    return publish_final_grades(db, current_user.id, payload, actor_roles=current_user.roles)
