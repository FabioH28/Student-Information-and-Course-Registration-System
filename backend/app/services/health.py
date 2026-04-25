from datetime import datetime, timezone

from app.core.config import get_settings
from app.schemas.health import HealthResponse


def get_health_status() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="cis-api",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc),
    )
