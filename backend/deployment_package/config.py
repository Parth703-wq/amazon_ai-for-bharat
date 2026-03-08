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
    AWS_S3_BUCKET_NAME: str = "your-bucket-name"  # alias used in document upload
    AWS_BEDROCK_MODEL_ID: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    DYNAMODB_CHAT_TABLE: str = "jansahayak_chat_sessions"

    # Lambda AI Gateway
    LAMBDA_FUNCTION_NAME: str = "jansahayak-ai-gateway"
    LAMBDA_ROLE_ARN: str = ""   # Set after creating role in AWS Console

    # Feature flags
    USE_BEDROCK: bool = True          # True → Bedrock primary, False → Gemini primary
    USE_RAG: bool = False             # True → Bedrock Knowledge Base RAG, False → direct Bedrock call

    # Primary AI provider: 'bedrock' or 'gemini'
    AI_PROVIDER: str = "bedrock"  # set to 'bedrock' when USE_BEDROCK=true

    # Amazon SNS (SMS deadline alerts)
    SNS_TEST_PHONE: str = "+919000000000"  # Phone for test-alert endpoint

    # Gmail SMTP (email notifications — replaces Amazon SES)
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""

    # Amazon Bedrock Knowledge Base (RAG)
    # Create this in AWS Console → Bedrock → Knowledge Bases
    BEDROCK_KNOWLEDGE_BASE_ID: str = "YOUR_KNOWLEDGE_BASE_ID_HERE"

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

    # Environment
    ENVIRONMENT: str = "development"

    # Twilio WhatsApp
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"

    # ngrok
    NGROK_AUTHTOKEN: str = ""


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
