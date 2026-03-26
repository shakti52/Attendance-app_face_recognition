from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAIL_FROM_NAME: str = "FaceAttend System"

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    FACE_SIMILARITY_THRESHOLD: float = 0.4
    UPLOAD_DIR: str = "uploads/faces"

    class Config:
        env_file = ".env"


settings = Settings()
