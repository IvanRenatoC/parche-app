from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_ENV: str = "dev"
    GCP_PROJECT_ID: str = "ml-lab-ivan"
    FIREBASE_PROJECT_ID: str = "ml-lab-ivan"
    GCP_REGION: str = "us-west1"
    GCP_GENERAL_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"
    EMAIL_PROVIDER: str = "stub"
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "no-reply@parche.app"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
