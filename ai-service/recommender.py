"""Bộ gợi ý sản phẩm cho ThienStore: huấn luyện (fit) + suy luận.

Mô hình lai (hybrid), gồm 4 phần học từ dữ liệu của cửa hàng:
  1. Content-based : TF-IDF trên tên + hãng + thông số kỹ thuật + biến thể của từng máy.
  2. Collaborative : độ giống giữa các máy theo hành vi (mua, yêu thích, đánh giá, cùng đơn hàng).
  3. Độ phổ biến   : bán chạy + yêu thích + điểm đánh giá (làm mượt Bayes).
  4. FAQ           : TF-IDF trên chatbot-train.json để trả lời chính sách/bảo hành...
Hiểu câu chat bằng luật (nlu.py): ngân sách, hãng, nhu cầu (chơi game, chụp ảnh, pin trâu...).
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize as l2_normalize

from features import build_features
from nlu import (BRAND_ALIAS, GENERIC_RECO, NEED_LABEL, NEED_PROFILES,
                 clean_text, detect_needs, normalize, parse_budget)

FAQ_MANH = 0.45   # >= ngưỡng này: chắc chắn là câu hỏi chính sách
FAQ_YEU = 0.25    # >= ngưỡng này (và không có ý định mua máy): vẫn trả lời FAQ
TEXT_HIT = 0.25   # độ giống tên/thông số đủ để coi là đang hỏi về một mẫu máy


def _nz(v):
    v = np.asarray(v, dtype=float)
    m = v.max() if v.size else 0
    return v / m if m > 0 else v


def _tien(v):
    v = float(v)
    if v >= 1e6:
        return f"{v / 1e6:.1f}".rstrip("0").rstrip(".") + " triệu"
    return f"{int(v):,}".replace(",", ".") + "đ"


def _gia(v):
    return f"{int(v):,}".replace(",", ".") + "đ"


@dataclass
class Intent:
    raw: str = ""
    gia_min: Optional[float] = None
    gia_max: Optional[float] = None
    hang: Optional[str] = None
    nhu_cau: list = field(default_factory=list)
    text: str = ""
    generic: bool = False

    @property
    def manh(self):
        """Có điều kiện rõ ràng (giá/hãng/nhu cầu) -> chắc chắn đang muốn mua máy."""
        return bool(self.gia_min or self.gia_max or self.hang or self.nhu_cau)

    def to_dict(self):
        return {"giaMin": self.gia_min, "giaMax": self.gia_max, "hang": self.hang,
                "nhuCau": [NEED_LABEL[n] for n in self.nhu_cau], "tuKhoa": self.text}


def _str_cols(df, cols):
    df = df.copy()
    for c in cols:
        if c not in df.columns:
            df[c] = None
    df = df.dropna(subset=cols)
    for c in cols:
        df[c] = df[c].astype(str).str.strip()
    return df


class Recommender:
    # ======================================================================
    #  HUẤN LUYỆN
    # ======================================================================
    def fit(self, data, faq=None):
        # ---- 1. Sản phẩm ----
        sp = data["san_pham"].copy()
        sp["maSP"] = sp["maSP"].astype(str).str.strip()
        sp = sp.drop_duplicates("maSP").reset_index(drop=True)
        if sp.empty:
            raise ValueError("Bảng SanPham đang trống, chưa thể huấn luyện.")
        sp["giaBan"] = pd.to_numeric(sp["giaBan"], errors="coerce").fillna(0.0)
        sp["tonKho"] = pd.to_numeric(sp["tonKho"], errors="coerce").fillna(0)
        sp["trangThai"] = pd.to_numeric(sp["trangThai"], errors="coerce").fillna(0)

        n = len(sp)
        self.ids = sp["maSP"].tolist()
        self.idx = {m: i for i, m in enumerate(self.ids)}
        self.names = sp["tenSP"].fillna("").astype(str).tolist()
        self.brand = sp["hang"].fillna("").astype(str).tolist()
        self.images = sp["hinhAnh"].fillna("").astype(str).tolist()
        self.price = sp["giaBan"].to_numpy(float)
        self.active = ((sp["trangThai"] == 1) & (sp["tonKho"] > 0)).to_numpy()
        self.brand_norm = np.array([normalize(b) for b in self.brand])
        self.brands = {normalize(b): b for b in set(self.brand) if b.strip()}

        # ---- 2. Content-based: đặc trưng số + TF-IDF ----
        raw, docs = build_features(sp, data["thong_so"], data["bien_the"])
        self.R = {c: raw[c].to_numpy(float) for c in raw.columns}

        self.tfidf = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True,
                                     token_pattern=r"(?u)\b\w+\b")
        self.P = self.tfidf.fit_transform(docs)
        self.content_sim = (self.P @ self.P.T).toarray().astype(np.float32)
        np.fill_diagonal(self.content_sim, 0)

        def pct(v):  # thứ hạng phần trăm 0..1, thiếu dữ liệu -> 0.5 (trung lập)
            return pd.Series(v).rank(pct=True).fillna(0.5).to_numpy()

        price_pct = pct(np.where(self.price > 0, self.price, np.nan))
        self.Fv = {c: pct(self.R[c]) for c in ("ram", "rom", "pin", "cam", "hz", "screen")}
        self.Fv["cheap"] = 1 - price_pct
        self.Fv["premium"] = price_pct
        self.Fv["compact"] = 1 - self.Fv["screen"]

        # ---- 3. Hành vi: mua, yêu thích, đánh giá ----
        mh = _str_cols(data["mua_hang"], ["maHoaDon", "maKH", "maSP"])
        mh["soLuong"] = pd.to_numeric(data["mua_hang"].loc[mh.index, "soLuong"], errors="coerce").fillna(1)
        yt = _str_cols(data["yeu_thich"], ["maKH", "maSP"])
        dg = _str_cols(data["danh_gia"], ["maKH", "maSP"])
        dg["soSao"] = pd.to_numeric(data["danh_gia"].loc[dg.index, "soSao"], errors="coerce").fillna(0)

        inter = defaultdict(float)
        self.user_bought = defaultdict(set)
        for ma_kh, ma_sp in mh[["maKH", "maSP"]].drop_duplicates().itertuples(index=False):
            if ma_sp in self.idx:
                inter[(ma_kh, self.idx[ma_sp])] += 3.0
                self.user_bought[ma_kh].add(self.idx[ma_sp])
        for ma_kh, ma_sp in yt[["maKH", "maSP"]].drop_duplicates().itertuples(index=False):
            if ma_sp in self.idx:
                inter[(ma_kh, self.idx[ma_sp])] += 2.0
        for ma_kh, ma_sp, sao in dg[["maKH", "maSP", "soSao"]].itertuples(index=False):
            if ma_sp in self.idx and sao >= 3:
                inter[(ma_kh, self.idx[ma_sp])] += 2.0 if sao >= 4 else 1.0

        self.user_items = defaultdict(dict)
        for (ma_kh, i), w in inter.items():
            self.user_items[ma_kh][i] = min(w, 5.0)

        # Collaborative: cột = khách hàng + mỗi đơn nhiều món là một "người dùng ảo"
        users = sorted(self.user_items)
        ucol = {u: j for j, u in enumerate(users)}
        rows, cols, vals = [], [], []
        for u, items in self.user_items.items():
            for i, w in items.items():
                rows.append(i); cols.append(ucol[u]); vals.append(w)
        n_order = 0
        for _, g in mh.groupby("maHoaDon"):
            items = {self.idx[m] for m in g["maSP"] if m in self.idx}
            if len(items) < 2:
                continue
            for i in items:
                rows.append(i); cols.append(len(users) + n_order); vals.append(1.0)
            n_order += 1

        if vals:
            X = sparse.csr_matrix((vals, (rows, cols)), shape=(n, len(users) + n_order))
            Xn = l2_normalize(X)
            self.cf_sim = (Xn @ Xn.T).toarray().astype(np.float32)
            np.fill_diagonal(self.cf_sim, 0)
        else:
            self.cf_sim = np.zeros((n, n), dtype=np.float32)

        # ---- 4. Độ phổ biến ----
        self.sales = (mh.groupby("maSP")["soLuong"].sum().reindex(self.ids).fillna(0).to_numpy(float)
                      if len(mh) else np.zeros(n))
        wish = (yt.groupby("maSP").size().reindex(self.ids).fillna(0).to_numpy(float)
                if len(yt) else np.zeros(n))
        dgv = dg[dg["soSao"] > 0]
        if len(dgv):
            g = dgv.groupby("maSP")["soSao"].agg(["mean", "count"]).reindex(self.ids)
            self.rating_cnt = g["count"].fillna(0).to_numpy(float)
            self.rating_avg = g["mean"].fillna(0).to_numpy(float)
            gm = float(dgv["soSao"].mean())
        else:
            self.rating_cnt = np.zeros(n)
            self.rating_avg = np.zeros(n)
            gm = 4.0
        bayes = (self.rating_cnt * self.rating_avg + 3 * gm) / (self.rating_cnt + 3)
        self.pop = (0.5 * _nz(np.log1p(self.sales)) + 0.2 * _nz(np.log1p(wish))
                    + 0.3 * (bayes / 5.0))
        self.pop_order = np.argsort(-self.pop)
        pos = self.sales[self.sales > 0]
        self.sales_q80 = float(np.quantile(pos, 0.8)) if pos.size else float("inf")

        # ---- 5. FAQ ----
        self.faq = [f for f in (faq or []) if f.get("cauHoi") and f.get("traLoi")]
        if self.faq:
            self.faq_tfidf = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True,
                                             token_pattern=r"(?u)\b\w+\b")
            self.faq_P = self.faq_tfidf.fit_transform(
                [normalize(f"{f['cauHoi']} {f['cauHoi']} {f['traLoi']}") for f in self.faq])

        self.metrics = {}
        self.trained_at = datetime.now().isoformat(timespec="seconds")
        self.stats = {
            "sanPham": n, "sanPhamDangBan": int(self.active.sum()),
            "khachCoHanhVi": len(users), "donNhieuMon": n_order, "faq": len(self.faq),
            "coHanhViMua": bool(vals),
        }
        return self

    def info(self):
        return {"trainedAt": self.trained_at, **self.stats, "metrics": self.metrics}

    # ======================================================================
    #  ĐIỂM SỐ
    # ======================================================================
    def _blend(self, w, price_ref=None):
        """Điểm gợi ý từ tập máy đã tương tác {chỉ_số: trọng_số} (collaborative + content)."""
        n = len(self.ids)
        cf = np.zeros(n)
        ct = np.zeros(n)
        for i, wt in w.items():
            cf += wt * self.cf_sim[i]
            ct += wt * self.content_sim[i]
        cfn, ctn = _nz(cf), _nz(ct)
        score = 0.55 * cfn + 0.45 * ctn if cf.max() > 0 else ctn
        if price_ref is not None:
            close = np.exp(-2 * np.abs(np.log((self.price + 1) / (self.price[price_ref] + 1))))
            score = 0.8 * score + 0.2 * close
        return 0.9 * score + 0.1 * self.pop

    def _text_scores(self, text):
        if not text:
            return np.zeros(len(self.ids))
        q = self.tfidf.transform([text])
        return (self.P @ q.T).toarray().ravel()

    def _need_scores(self, needs):
        if not needs:
            return np.zeros(len(self.ids))
        total = np.zeros(len(self.ids))
        for need in needs:
            prof = NEED_PROFILES[need]
            total += sum(w * self.Fv[c] for c, w in prof.items()) / sum(prof.values())
        return total / len(needs)

    # ======================================================================
    #  HIỂU CÂU HỎI
    # ======================================================================
    def _detect_brand(self, q):
        for key, orig in self.brands.items():
            pat = rf"\b{re.escape(key)}\b"
            if re.search(pat, q):
                return orig, re.sub(pat, " ", q)
        for alias, target in BRAND_ALIAS.items():
            if re.search(rf"\b{alias}\b", q):
                orig = self.brands.get(target)
                if orig:
                    return orig, q  # giữ lại chữ 'iphone 15' để khớp tên máy
        return None, q

    def parse(self, message):
        q = normalize(message)
        generic = any(re.search(rf"\b{p}\b", q) for p in GENERIC_RECO)
        gmin, gmax, q = parse_budget(q)
        needs, q = detect_needs(q)
        hang, q = self._detect_brand(q)
        return Intent(raw=message, gia_min=gmin, gia_max=gmax, hang=hang,
                      nhu_cau=needs, text=clean_text(q), generic=generic)

    # ======================================================================
    #  GỢI Ý
    # ======================================================================
    def _candidates(self, it):
        notes = []
        base = self.active.copy()
        if it.hang:
            base &= (self.brand_norm == normalize(it.hang))

        def pm(f_lo=1.0, f_hi=1.0):
            m = base.copy()
            if it.gia_min:
                m &= self.price >= it.gia_min * f_lo
            if it.gia_max:
                m &= self.price <= it.gia_max * f_hi
            return m

        m = pm()
        if not m.any() and (it.gia_min or it.gia_max):
            m = pm(0.8, 1.2)
            if m.any():
                notes.append("Chưa có máy đúng tầm giá bạn nêu, mình mở rộng khoảng ±20%.")
            else:
                m = base.copy()
                if m.any():
                    notes.append("Không có máy trong tầm giá bạn nêu, đây là các máy gần nhu cầu nhất.")
        if not m.any() and it.hang:
            m = self.active.copy()
            if m.any():
                notes.append(f"Hiện chưa có máy {it.hang} phù hợp, mình gợi ý hãng khác.")
        return m, notes

    def _recommend(self, it, limit):
        mask, notes = self._candidates(it)
        if not mask.any():
            return [], notes
        s_text = self._text_scores(it.text)
        has_text = bool(it.text) and s_text.max() > 0
        if has_text:
            s_text = s_text / s_text.max()
        w_t = 0.5 if has_text else 0.0
        w_n = 0.4 if it.nhu_cau else 0.0
        w_p = 0.2
        score = (w_t * s_text + w_n * self._need_scores(it.nhu_cau) + w_p * self.pop) / (w_t + w_n + w_p)
        score = np.where(mask, score, -np.inf)
        top = [i for i in np.argsort(-score)[:limit] if np.isfinite(score[i])]
        return [self._card(i, score[i], it) for i in top], notes

    def recommend_by_query(self, message, limit=3):
        it = self.parse(message)
        cards, notes = self._recommend(it, max(1, min(limit, 10)))
        return {"loai": "san_pham", "boLoc": it.to_dict(), "sanPham": cards, "ghiChu": notes}

    def similar_products(self, ma_sp, limit=5):
        i = self.idx.get(str(ma_sp).strip())
        if i is None:
            return None
        score = self._blend({i: 1.0}, price_ref=i)
        score[i] = -np.inf
        score = np.where(self.active, score, -np.inf)
        top = [j for j in np.argsort(-score)[:limit] if np.isfinite(score[j])]
        return [self._card(j, score[j]) for j in top]

    def recommend_for_customer(self, ma_kh, limit=5):
        ma_kh = str(ma_kh).strip()
        items = self.user_items.get(ma_kh)
        if not items:  # khách mới -> máy phổ biến
            top = [i for i in self.pop_order if self.active[i]][:limit]
            return {"loai": "pho_bien", "sanPham": [self._card(i, self.pop[i]) for i in top]}
        score = self._blend(items)
        for i in self.user_bought.get(ma_kh, ()):
            score[i] = -np.inf
        score = np.where(self.active, score, -np.inf)
        top = [i for i in np.argsort(-score)[:limit] if np.isfinite(score[i])]
        return {"loai": "ca_nhan_hoa", "sanPham": [self._card(i, score[i]) for i in top]}

    # ======================================================================
    #  CHATBOT
    # ======================================================================
    def _faq_match(self, message):
        if not self.faq:
            return None, 0.0
        sims = (self.faq_P @ self.faq_tfidf.transform([normalize(message)]).T).toarray().ravel()
        j = int(sims.argmax())
        return self.faq[j]["traLoi"], float(sims[j])

    def chat(self, message, limit=3):
        it = self.parse(message)
        faq_ans, faq_sim = self._faq_match(message)
        s_text = self._text_scores(it.text)
        text_hit = bool(it.text) and s_text.max() >= TEXT_HIT
        san_pham_y = it.manh or it.generic or text_hit

        if faq_ans and faq_sim >= FAQ_MANH and not it.manh:
            return {"loai": "faq", "reply": faq_ans, "sanPham": [], "doTinCay": round(faq_sim, 3)}

        if san_pham_y:
            cards, notes = self._recommend(it, max(1, min(limit, 5)))
            return {"loai": "san_pham", "reply": self._compose_reply(it, cards, notes),
                    "sanPham": cards, "boLoc": it.to_dict()}

        if faq_ans and faq_sim >= FAQ_YEU:
            return {"loai": "faq", "reply": faq_ans, "sanPham": [], "doTinCay": round(faq_sim, 3)}

        return {"loai": "khac", "sanPham": [], "reply":
                "Mình chưa hiểu rõ nhu cầu của bạn. Bạn cho mình biết ngân sách, hãng yêu thích "
                "hoặc mục đích dùng (chơi game, chụp ảnh, pin trâu...) để mình gợi ý nhé."}

    def _compose_reply(self, it, cards, notes):
        if not cards:
            return (" ".join(notes) + " " if notes else "") + \
                "Hiện chưa có máy phù hợp. Bạn thử nới ngân sách hoặc đổi hãng nhé."
        dk = []
        if it.hang:
            dk.append(f"hãng {it.hang}")
        if it.gia_min and it.gia_max:
            dk.append(f"tầm giá {_tien(it.gia_min)} – {_tien(it.gia_max)}")
        elif it.gia_max:
            dk.append(f"dưới {_tien(it.gia_max)}")
        elif it.gia_min:
            dk.append(f"từ {_tien(it.gia_min)}")
        dk += [NEED_LABEL[n] for n in it.nhu_cau]

        head = ("Với " + ", ".join(dk) + ", mình gợi ý:") if dk else "Mình gợi ý một vài mẫu đang được quan tâm:"
        lines = [f"{k}. {c['tenSP']} – {_gia(c['giaBan'])}"
                 + (f" ({'; '.join(c['lyDo'])})" if c["lyDo"] else "")
                 for k, c in enumerate(cards, 1)]
        tail = "" if dk else "\nBạn cho mình biết thêm ngân sách hoặc nhu cầu để mình chọn chính xác hơn nhé."
        return "\n".join([*notes, head, *lines]) + tail

    # ======================================================================
    #  HIỂN THỊ
    # ======================================================================
    def _spec_summary(self, i):
        parts = []
        for key, label, unit in (("ram", "RAM", "GB"), ("rom", "Bộ nhớ", "GB"), ("pin", "Pin", "mAh"),
                                 ("cam", "Camera", "MP"), ("hz", "Màn hình", "Hz")):
            v = self.R[key][i]
            if not np.isnan(v):
                parts.append(f"{label} {v:g}{unit}")
        return " • ".join(parts)

    def _reasons(self, i, it):
        R, out = self.R, []

        def has(k):
            return not np.isnan(R[k][i])

        for need in it.nhu_cau:
            if need == "gaming":
                bits = []
                if has("ram"):
                    bits.append(f"RAM {R['ram'][i]:g}GB")
                if has("hz"):
                    bits.append(f"màn hình {R['hz'][i]:g}Hz")
                if bits:
                    out.append("hợp chơi game: " + ", ".join(bits))
            elif need == "camera" and has("cam"):
                out.append(f"camera {R['cam'][i]:g}MP")
            elif need in ("pin", "nguoi_lon_tuoi") and has("pin"):
                out.append(f"pin {R['pin'][i]:g}mAh")
            elif need == "man_hinh":
                if has("hz"):
                    out.append(f"màn hình {R['hz'][i]:g}Hz")
                elif has("screen"):
                    out.append(f"màn hình {R['screen'][i]:g} inch")
            elif need == "van_phong" and has("ram"):
                out.append(f"RAM {R['ram'][i]:g}GB đa nhiệm tốt")
            elif need == "gia_re" and self.Fv["cheap"][i] >= 0.6:
                out.append("giá dễ tiếp cận")
            elif need == "cao_cap" and self.Fv["premium"][i] >= 0.7:
                out.append("dòng cao cấp")
            elif need == "nho_gon" and self.Fv["compact"][i] >= 0.6:
                out.append("kích thước gọn")

        if self.rating_cnt[i] >= 3 and self.rating_avg[i] >= 4.5:
            out.append(f"được đánh giá cao ({self.rating_avg[i]:.1f}/5)")
        if self.sales[i] > 0 and self.sales[i] >= self.sales_q80:
            out.append("bán chạy")
        if not out:
            s = self._spec_summary(i)
            if s:
                out.append(s)
        return out[:3]

    def _card(self, i, score, it=None):
        return {
            "maSP": self.ids[i], "tenSP": self.names[i], "giaBan": int(self.price[i]),
            "hinhAnh": self.images[i], "hang": self.brand[i],
            "thongSo": self._spec_summary(i),
            "lyDo": self._reasons(i, it) if it else [],
            "diem": round(float(score), 3),
        }

    # ======================================================================
    #  ĐÁNH GIÁ
    # ======================================================================
    def evaluate_baskets(self, baskets, k=5):
        """Mỗi giỏ: ẩn món cuối, dự đoán từ các món còn lại, xem có nằm trong top-k không.
        So sánh với baseline 'gợi ý máy phổ biến nhất'."""
        hits = pop_hits = total = 0
        for b in baskets:
            idxs = [self.idx[m] for m in b if m in self.idx]
            if len(idxs) < 2:
                continue
            held, given = idxs[-1], idxs[:-1]
            score = self._blend({i: 1.0 for i in given})
            score[given] = -np.inf
            hits += int(held in np.argsort(-score)[:k])
            pop_top = [i for i in self.pop_order if i not in given][:k]
            pop_hits += int(held in pop_top)
            total += 1
        return {"soDonKiemTra": total,
                f"hit@{k}": round(hits / total, 3) if total else None,
                f"baseline_pho_bien_hit@{k}": round(pop_hits / total, 3) if total else None}
