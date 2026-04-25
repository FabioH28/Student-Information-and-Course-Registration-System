from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, get_current_user
from app.db.session import get_db
from app.schemas.profile import UserProfileResponse, UserProfileUpdateRequest
from app.services.profile import get_user_profile, update_user_profile


router = APIRouter(prefix="/users/me", tags=["profile"])


@router.get("/profile", response_model=UserProfileResponse, summary="Get the current authenticated user's profile")
def profile(
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    return UserProfileResponse(**get_user_profile(db, current_user.id))


@router.put("/profile", response_model=UserProfileResponse, summary="Update the current authenticated user's profile")
def update_profile(
    payload: UserProfileUpdateRequest,
    current_user: RequestUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    return UserProfileResponse(**update_user_profile(db, current_user.id, payload))
