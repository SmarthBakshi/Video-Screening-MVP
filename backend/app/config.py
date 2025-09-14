import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)

class Settings(BaseModel):
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "localfs")
    DB_BACKEND: str = os.getenv("DB_BACKEND", "inmemory")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(Path(__file__).resolve().parent.parent / "uploads"))
    TOKEN_TTL_MIN: int = int(os.getenv("TOKEN_TTL_MIN", "10080")) # 7 days
    MAX_VIDEO_SECONDS: int = int(os.getenv("MAX_VIDEO_SECONDS", "120"))
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "50"))
    CORS_ALLOW_ORIGIN: str = os.getenv("CORS_ALLOW_ORIGIN", "http://localhost:5173")
    DB_BACKEND: str = os.getenv("DB_BACKEND", "inmemory")
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    MONGO_DB: str = os.getenv("MONGO_DB", "aurio")


settings = Settings()