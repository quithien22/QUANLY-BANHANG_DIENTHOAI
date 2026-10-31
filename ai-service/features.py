"""Rút đặc trưng số (RAM, ROM, pin, camera, Hz, màn hình) từ bảng ThongSoKyThuat / BienTheSanPham
và dựng "văn bản mô tả" của từng sản phẩm để TF-IDF."""
import re
from collections import defaultdict

import numpy as np
import pandas as pd

from nlu import normalize

_NUM = r"(\d+(?:[.,]\d+)?)"


def _f(s):
    return float(s.replace(",", "."))


def _nums(text, units):
    return [_f(m.group(1)) for m in re.finditer(_NUM + r"\s*(?:" + units + r")\b", text)]


def _first(text):
    m = re.search(_NUM, text)
    return [_f(m.group(1))] if m else []


def _gb_values(text):
    return _nums(text, "gb") + [v * 1024 for v in _nums(text, "tb")]


def extract_specs(pairs, variants):
    """pairs: [(nhan_da_chuan_hoa, giaTri_da_chuan_hoa)], variants: [(loai, giaTri)]."""
    out = {k: np.nan for k in ("ram", "rom", "pin", "cam", "hz", "screen")}

    def put(key, vals, lo, hi):
        vals = [v for v in vals if lo <= v <= hi]
        if vals:
            m = max(vals)
            out[key] = m if np.isnan(out[key]) else max(out[key], m)

    for label, value in pairs:
        if re.search(r"\bram\b", label):
            put("ram", _nums(value, "gb") or _first(value), 1, 64)
        if re.search(r"\brom\b|bo nho trong|luu tru|dung luong luu", label):
            put("rom", _gb_values(value) or _first(value), 8, 4096)
        if "pin" in label:
            put("pin", _nums(value, "mah") or _first(value), 1000, 20000)
        if "camera" in label:
            put("cam", _nums(value, "mp|mpx"), 2, 300)
        put("hz", _nums(value, "hz"), 30, 480)
        if "man hinh" in label or "inch" in value:
            put("screen", _nums(value, "inch|in"), 3, 9)

    for loai, value in variants:
        if loai == "dungluong":
            put("rom", _gb_values(value) or _first(value), 8, 4096)
    return out


def build_features(sp, thong_so, bien_the):
    """Trả về (DataFrame đặc trưng thô cùng thứ tự với sp, danh sách văn bản mô tả)."""
    specs = defaultdict(list)
    for ma, nhan, gt in thong_so[["maSP", "nhan", "giaTri"]].itertuples(index=False):
        specs[str(ma).strip()].append((normalize(nhan), normalize(gt)))

    variants = defaultdict(list)
    for ma, loai, gt in bien_the[["maSP", "loaiBienThe", "giaTri"]].itertuples(index=False):
        variants[str(ma).strip()].append((normalize(loai), normalize(gt)))

    rows, docs = [], []
    for ma, ten, hang in zip(sp["maSP"], sp["tenSP"], sp["hang"]):
        pairs = specs.get(ma, [])
        vs = variants.get(ma, [])
        rows.append(extract_specs(pairs, vs))
        parts = [normalize(ten), normalize(hang)]
        parts += [f"{l} {v}" for l, v in pairs]
        parts += [v for _, v in vs]
        docs.append(" ".join(p for p in parts if p))
    return pd.DataFrame(rows), docs
