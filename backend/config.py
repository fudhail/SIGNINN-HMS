import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'signinn.db'}")
SECRET_KEY = os.getenv("SECRET_KEY", "signinn-super-secret-production-key-2026")
DEFAULT_TENANT_ID = os.getenv("DEFAULT_TENANT_ID", "tenant-1")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]
