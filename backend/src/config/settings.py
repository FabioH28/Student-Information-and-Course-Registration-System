from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_SERVER: str = "localhost\\MSSQLSERVER07"
    DB_NAME: str = "CampusIS"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    APP_ENV: str = "development"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mssql+pyodbc://@{self.DB_SERVER}/{self.DB_NAME}"
            f"?driver=ODBC+Driver+17+for+SQL+Server"
            f"&trusted_connection=yes"
        )

    class Config:
        env_file = ".env"

settings = Settings()
