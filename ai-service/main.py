"""API của ai-service (FastAPI).

Chạy:  uvicorn main:app --host 127.0.0.1 --port 8000 --reload
Docs:  http://127.0.0.1:8000/docs
"""
import hmac
import threading
from contextlib import asynccontextmanager
from typing import Optional

import joblib
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from train import run_training

state = {"model": None}
train_lock = threading.Lock()


def load_model():
    if config.MODEL_PATH.exists():
        state["model"] = joblib.load(config.MODEL_PATH)
        print("Đã nạp mô hình:", state["model"].info())
    else:
        print("Chưa có mô hình. Hãy chạy: python train.py")


@asynccontextmanager
async def lifespan(app):
    load_model()
    yield


app = FastAPI(title="ThienStore AI Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_model():
    if state["model"] is None:
        raise HTTPException(503, "Mô hình chưa được huấn luyện. Chạy `python train.py` hoặc POST /train.")
    return state["model"]


class ChatIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(3, ge=1, le=5)


@app.get("/health")
def health():
    m = state["model"]
    return {"ok": True, "modelLoaded": m is not None, "model": m.info() if m else None}


@app.post("/chat")
def chat(body: ChatIn):
    """Cùng dạng kết quả với chatbot Node: { reply, sanPham } (kèm loai, boLoc)."""
    if not body.message.strip():
        raise HTTPException(400, "Tin nhắn không hợp lệ")
    return get_model().chat(body.message, body.limit)


@app.post("/recommend/query")
def recommend_query(body: ChatIn):
    return get_model().recommend_by_query(body.message, body.limit)


@app.get("/recommend/product/{ma_sp}")
def recommend_similar(ma_sp: str, limit: int = 5):
    res = get_model().similar_products(ma_sp, max(1, min(limit, 20)))
    if res is None:
        raise HTTPException(404, "Không tìm thấy sản phẩm trong mô hình (có thể cần train lại).")
    return {"sanPham": res}


@app.get("/recommend/customer/{ma_kh}")
def recommend_customer(ma_kh: str, limit: int = 5):
    return get_model().recommend_for_customer(ma_kh, max(1, min(limit, 20)))


@app.post("/train")
def train(x_train_token: Optional[str] = Header(default=None)):
    """Huấn luyện lại từ DB (chạy khi có dữ liệu mới), không cần restart service.

    Bắt buộc đặt AI_TRAIN_TOKEN trong .env; chưa đặt thì endpoint bị khóa hoàn toàn
    (có thể train bằng dòng lệnh: python train.py).
    """
    if not config.TRAIN_TOKEN:
        raise HTTPException(403, "Endpoint /train đang tắt: chưa cấu hình AI_TRAIN_TOKEN. Dùng `python train.py`.")
    if not x_train_token or not hmac.compare_digest(x_train_token.encode(), config.TRAIN_TOKEN.encode()):
        raise HTTPException(401, "Sai X-Train-Token")
    if not train_lock.acquire(blocking=False):
        raise HTTPException(409, "Đang huấn luyện, vui lòng đợi.")
    try:
        state["model"] = run_training(evaluate=False)
    finally:
        train_lock.release()
    return {"ok": True, "model": state["model"].info()}
