from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "jansahayak"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # AI
    GEMINI_API_KEY: str = ""

    # AWS Credentials
    AWS_ACCESS_KEY_ID: str = "YOUR_AWS_ACCESS_KEY"
    AWS_SECRET_ACCESS_KEY: str = "YOUR_AWS_SECRET_KEY"
    AWS_REGION: str = "us-east-1"

    # AWS Services
    AWS_S3_BUCKET: str = "your-bucket-name"
    AWS_BEDROCK_MODEL_ID: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    DYNAMODB_CHAT_TABLE: str = "jansahayak_chat_sessions"

    # Primary AI provider: 'bedrock' or 'gemini'
    AI_PROVIDER: str = "gemini"  # change to 'bedrock' when AWS creds are added

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # App
    APP_NAME: str = "JanSahayak AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
