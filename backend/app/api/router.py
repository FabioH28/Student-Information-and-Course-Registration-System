from fastapi import APIRouter

from app.api.academic import router as academic_router
from app.api.auth import router as auth_router
from app.api.communications import router as communications_router
from app.api.finance import router as finance_router
from app.api.health import router as health_router
from app.api.instructor import router as instructor_router
from app.api.messages import router as messages_router
from app.api.profile import router as profile_router
from app.api.student import router as student_router
from app.api.system_admin import router as system_admin_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(student_router)
api_router.include_router(instructor_router)
api_router.include_router(academic_router)
api_router.include_router(finance_router)
api_router.include_router(communications_router)
api_router.include_router(messages_router)
api_router.include_router(system_admin_router)
