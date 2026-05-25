from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_VISION_MODEL: str = "llama-3.2-11b-vision-preview"
    GROQ_MAX_TOKENS: int = 1024

    DATABASE_URL: str = "sqlite:///./archivist.db"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    UPLOAD_DIR: str = "./uploads/receipts"

    SUPABASE_URL: str = ""           # e.g. https://xxx.supabase.co
    SUPABASE_JWT_SECRET: str = ""    # legacy HS256 fallback (optional)

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    SITE_URL: str = "https://archivist-lemon.vercel.app"

    ENV: str = "production"  # set to "development" to enable /docs

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        return self.ENV.lower() == "development"


settings = Settings()
