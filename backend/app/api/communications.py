from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import (
    PERMISSION_ANNOUNCEMENTS_MANAGE,
    PERMISSION_COMMUNICATION_DASHBOARD,
    PERMISSION_EVENTS_MANAGE,
    PERMISSION_INSTRUCTOR_ANNOUNCEMENTS,
)
from app.db.session import get_db
from app.schemas.admin import CampusEventUpsertRequest, ClubJoinRequestReviewRequest, ClubUpsertRequest, NewsPostUpsertRequest
from app.services.admin import get_admin_clubs_overview, get_admin_news_overview, get_admin_reference_data
from app.services.admin_phase3 import (
    create_admin_club,
    create_admin_campus_event,
    create_admin_news_post,
    review_admin_club_join_request,
    update_admin_club,
    update_admin_campus_event,
    update_admin_news_post,
)


router = APIRouter(prefix="/communications", tags=["communications"])


@router.get("/dashboard", summary="Get the communications dashboard")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_COMMUNICATION_DASHBOARD)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_news_overview(db)


@router.get("/overview", summary="Get communications overview data")
def overview(
    current_user: RequestUser = Depends(
        require_permissions(
            PERMISSION_COMMUNICATION_DASHBOARD,
            PERMISSION_ANNOUNCEMENTS_MANAGE,
            PERMISSION_INSTRUCTOR_ANNOUNCEMENTS,
        )
    ),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_news_overview(db)


@router.get("/clubs/overview", summary="Get club context for communications and event linking")
def clubs_overview(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_clubs_overview(db)


@router.get("/reference-data", summary="Get communications reference data")
def reference_data(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_reference_data(db)


@router.post("/clubs", summary="Create a club")
def create_club(
    payload: ClubUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_club(db, current_user.id, payload)


@router.put("/clubs/{club_id}", summary="Update a club")
def update_club(
    club_id: int,
    payload: ClubUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_club(db, current_user.id, club_id, payload)


@router.put("/clubs/requests/{request_id}", summary="Review a club join request")
def review_club_request(
    request_id: int,
    payload: ClubJoinRequestReviewRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return review_admin_club_join_request(db, current_user.id, request_id, payload)


@router.post("/posts", summary="Create a news post")
def create_news_post(
    payload: NewsPostUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ANNOUNCEMENTS_MANAGE, PERMISSION_INSTRUCTOR_ANNOUNCEMENTS)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_news_post(db, current_user.id, payload)


@router.put("/posts/{post_id}", summary="Update a news post")
def update_news_post(
    post_id: int,
    payload: NewsPostUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_ANNOUNCEMENTS_MANAGE, PERMISSION_INSTRUCTOR_ANNOUNCEMENTS)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_news_post(db, current_user.id, post_id, payload)


@router.post("/events", summary="Create a campus event")
def create_campus_event(
    payload: CampusEventUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_campus_event(db, current_user.id, payload)


@router.put("/events/{event_id}", summary="Update a campus event")
def update_campus_event(
    event_id: int,
    payload: CampusEventUpsertRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_EVENTS_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return update_admin_campus_event(db, current_user.id, event_id, payload)
