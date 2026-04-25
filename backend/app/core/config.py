import os
from functools import lru_cache
from typing import Final

from dotenv import load_dotenv


load_dotenv()

DEFAULT_ALLOWED_ORIGINS: Final[tuple[str, ...]] = (
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://[::1]:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://[::1]:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    "http://[::1]:8082",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://[::1]:4173",
)
DEFAULT_ALLOWED_ORIGIN_REGEX: Final[str] = r"^https?://(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$"


class Settings:
    def __init__(self) -> None:
        self.app_env = os.getenv("APP_ENV", "development")
        self.app_name = os.getenv("APP_NAME", "CIS API")
        self.app_version = os.getenv("APP_VERSION", "0.1.0")
        self.database_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@127.0.0.1:3307/cis")
        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
        self.password_reset_token_expire_minutes = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))
        self.login_lockout_threshold = int(os.getenv("LOGIN_LOCKOUT_THRESHOLD", "5"))
        self.login_lockout_minutes = int(os.getenv("LOGIN_LOCKOUT_MINUTES", "15"))
        self.enable_dev_reset_token_preview = os.getenv("ENABLE_DEV_RESET_TOKEN_PREVIEW", "true").strip().lower() in {"1", "true", "yes", "on"}
        raw_allowed_origins = os.getenv("ALLOWED_ORIGINS")
        if raw_allowed_origins:
            self.allowed_origins = [origin.strip() for origin in raw_allowed_origins.split(",") if origin.strip()]
        else:
            self.allowed_origins = list(DEFAULT_ALLOWED_ORIGINS)
        self.allowed_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", DEFAULT_ALLOWED_ORIGIN_REGEX)
        self.chatbot_provider = os.getenv("CHATBOT_PROVIDER", "ollama").strip().lower()
        self.chatbot_model = os.getenv("CHATBOT_MODEL", "llama3.2:3b").strip() or "llama3.2:3b"
        self.chatbot_ollama_base_url = os.getenv("CHATBOT_OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.chatbot_request_timeout_seconds = int(os.getenv("CHATBOT_REQUEST_TIMEOUT_SECONDS", "45"))
        self.chatbot_max_history_messages = int(os.getenv("CHATBOT_MAX_HISTORY_MESSAGES", "8"))
        self.chatbot_temperature = float(os.getenv("CHATBOT_TEMPERATURE", "0.2"))
        self.chatbot_fallback_to_rules = os.getenv("CHATBOT_FALLBACK_TO_RULES", "true").strip().lower() in {"1", "true", "yes", "on"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
