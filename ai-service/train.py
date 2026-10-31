"""Huấn luyện mô hình gợi ý.

    python train.py              # đọc DB -> đánh giá offline -> train -> lưu model/recommender.joblib
    python train.py --no-eval    # bỏ bước đánh giá (nhanh hơn)
    python train.py --from-csv   # train từ các CSV trong data/ (không cần kết nối DB)
"""
import argparse
import json
import time

import joblib
import numpy as np

import config
from data_loader import load_data, load_data_from_csv
from db import get_engine
from recommender import Recommender


def load_faq():
    try:
        with open(config.FAQ_PATH, encoding="utf-8") as f:
            faq = json.load(f)
        print(f"  - faq: {len(faq)} mục ({config.FAQ_PATH})")
        return faq
    except Exception as err:
        print(f"[cảnh báo] Không đọc được FAQ: {err}")
        return []


def evaluate_offline(data, faq, k=5, test_ratio=0.2, seed=42):
    """Giữ lại 20% đơn nhiều món làm tập kiểm tra, train trên phần còn lại rồi đo hit@k."""
    mh = data["mua_hang"].dropna(subset=["maHoaDon", "maSP"]).copy()
    mh["maSP"] = mh["maSP"].astype(str).str.strip()
    sizes = mh.groupby("maHoaDon")["maSP"].nunique()
    multi = sizes[sizes >= 2].index.tolist()
    if len(multi) < 20:
        msg = f"Mới có {len(multi)} đơn nhiều món (<20) nên chưa đủ để đánh giá có ý nghĩa."
        print("  " + msg)
        return {"ghiChu": msg}

    rng = np.random.default_rng(seed)
    n_test = max(1, int(len(multi) * test_ratio))
    test_orders = rng.choice(multi, size=n_test, replace=False).tolist()
    test = mh[mh["maHoaDon"].isin(test_orders)]
    train = data["mua_hang"][~data["mua_hang"]["maHoaDon"].isin(test_orders)]
    baskets = [g["maSP"].drop_duplicates().tolist() for _, g in test.groupby("maHoaDon")]

    tmp = Recommender().fit({**data, "mua_hang": train}, faq)
    result = tmp.evaluate_baskets(baskets, k)
    print("  Kết quả:", result)
    return result


def run_training(evaluate=True, from_csv=False, save=True):
    t0 = time.time()
    print("Đang tải dữ liệu...")
    data = load_data_from_csv() if from_csv else load_data(get_engine())
    faq = load_faq()

    metrics = {}
    if evaluate:
        print("Đánh giá offline (train/test theo đơn hàng)...")
        metrics = evaluate_offline(data, faq)

    print("Huấn luyện mô hình cuối trên toàn bộ dữ liệu...")
    model = Recommender().fit(data, faq)
    model.metrics = metrics

    if save:
        config.MODEL_DIR.mkdir(exist_ok=True)
        joblib.dump(model, config.MODEL_PATH)
        print(f"Đã lưu mô hình: {config.MODEL_PATH}")
    print("Thống kê:", model.stats, f"({time.time() - t0:.1f}s)")
    return model


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Huấn luyện mô hình gợi ý ThienStore")
    ap.add_argument("--no-eval", action="store_true", help="bỏ qua bước đánh giá offline")
    ap.add_argument("--from-csv", action="store_true", help="đọc CSV trong data/ thay vì DB")
    args = ap.parse_args()
    run_training(evaluate=not args.no_eval, from_csv=args.from_csv)
