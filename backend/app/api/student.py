from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import PERMISSION_STUDENT_SELF_SERVICE
from app.db.session import get_db
from app.schemas.student import (
    CourseEnrollmentRequest,
    StudentChatMessageRequest,
    StudentEventRegistrationRequest,
    StudentFinanceSupportRequest,
    StudentProfileUpdateRequest,
)
from app.services.student import (
    archive_student_inbox_item,
    drop_registered_course,
    get_student_clubs,
    get_student_chatbot,
    get_student_courses,
    get_student_dashboard,
    get_student_finance,
    get_student_grades,
    get_student_inbox,
    get_student_news,
    get_student_profile,
    get_student_registration,
    get_student_timetable,
    join_club,
    mark_all_student_inbox_items_read,
    mark_student_inbox_item_read,
    register_for_campus_event,
    register_for_course,
    request_student_finance_support,
    send_student_chat_message,
    update_student_profile,
)


router = APIRouter(prefix="/students/me", tags=["student"])


@router.get("/profile", summary="Get the signed-in student's profile")
def profile(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_profile(db, current_user.id)


@router.put("/profile", summary="Update the signed-in student's contact profile")
def profile_update(
    payload: StudentProfileUpdateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_student_profile(db, current_user.id, payload)


@router.get("/dashboard", summary="Get student dashboard data")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_dashboard(db, current_user.id)


@router.get("/inbox", summary="Get inbox notifications for the signed-in student")
def inbox(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_inbox(db, current_user.id)


@router.post("/inbox/read-all", summary="Mark all inbox notifications as read")
def inbox_read_all(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return mark_all_student_inbox_items_read(db, current_user.id)


@router.post("/inbox/{recipient_id}/read", summary="Mark a single inbox notification as read")
def inbox_read_one(
    recipient_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return mark_student_inbox_item_read(db, current_user.id, recipient_id)


@router.post("/inbox/{recipient_id}/archive", summary="Archive a single inbox notification")
def inbox_archive_one(
    recipient_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return archive_student_inbox_item(db, current_user.id, recipient_id)


@router.get("/news", summary="Get news and event items for the signed-in student")
def news(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_news(db, current_user.id)


@router.post("/events/{event_id}/register", summary="Register the signed-in student for a campus event")
def register_event(
    event_id: int,
    payload: StudentEventRegistrationRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return register_for_campus_event(db, current_user.id, event_id)


@router.get("/finance", summary="Get finance data for the signed-in student")
def finance(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_finance(db, current_user.id)


@router.post("/finance/support-request", summary="Send a finance support request for the signed-in student")
def finance_support_request(
    payload: StudentFinanceSupportRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return request_student_finance_support(db, current_user.id, payload)


@router.get("/clubs", summary="Get club data for the signed-in student")
def clubs(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_clubs(db, current_user.id)


@router.post("/clubs/{club_id}/join", summary="Join a club or submit a join request")
def clubs_join(
    club_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return join_club(db, current_user.id, club_id)


@router.get("/courses", summary="Get current-term course offerings for the signed-in student")
def courses(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_courses(db, current_user.id)


@router.get("/registration", summary="Get current registration and course recommendation data")
def registration(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_registration(db, current_user.id)


@router.post("/registration/enroll", summary="Register the signed-in student for a course offering")
def enroll(
    payload: CourseEnrollmentRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return register_for_course(db, current_user.id, payload.offering_id)


@router.post("/registration/{enrollment_id}/drop", summary="Drop a current-term registration for the signed-in student")
def drop_registration(
    enrollment_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return drop_registered_course(db, current_user.id, enrollment_id)


@router.get("/timetable", summary="Get the current timetable for the signed-in student")
def timetable(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_timetable(db, current_user.id)


@router.get("/grades", summary="Get grade records for the signed-in student")
def grades(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_grades(db, current_user.id)


@router.get("/chatbot", summary="Get the academic assistant session for the signed-in student")
def chatbot(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_student_chatbot(db, current_user.id)


@router.post("/chatbot/messages", summary="Send a message to the academic assistant")
def chatbot_message(
    payload: StudentChatMessageRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_STUDENT_SELF_SERVICE)),
    db: Session = Depends(get_db),
) -> dict:
    return send_student_chat_message(db, current_user.id, payload.message)
