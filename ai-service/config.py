"""Cấu hình chung của ai-service (đọc từ file .env)."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "recommender.joblib"

# File FAQ dùng chung với chatbot của backend Node
FAQ_PATH = Path(
    os.getenv(
        "FAQ_PATH",
        BASE_DIR.parent / "backend" / "ecommerce-backend" / "data" / "chatbot-train.json",
    )
)

DB_SERVER = os.getenv("DB_SERVER", "localhost,1433")
DB_NAME = os.getenv("DB_NAME", "QuanLyBanHangDienThoai")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

TRAIN_TOKEN = os.getenv("AI_TRAIN_TOKEN", "")
