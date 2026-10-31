"""Hiểu câu chat tiếng Việt: chuẩn hoá, tách ngân sách, nhu cầu, hãng (không cần model nặng)."""
import re
import unicodedata


def normalize(text):
    """Bỏ dấu, hạ chữ thường: 'Chơi game' -> 'choi game'."""
    if text is None or (isinstance(text, float) and text != text):
        return ""
    s = unicodedata.normalize("NFD", str(text).lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^\w\s.,<>~\-]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# ----------------------------- Ngân sách -----------------------------
_MULT = {"trieu": 1e6, "tr": 1e6, "cu": 1e6, "m": 1e6, "ty": 1e9,
         "nghin": 1e3, "ngan": 1e3, "k": 1e3}
_AMT = r"(\d+(?:[.,]\d+)*)\s*(trieu|tr|cu|ty|nghin|ngan|k|m)?(?![a-z0-9])"


def _num(s):
    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", s):  # 10.000.000
        return float(s.replace(".", ""))
    return float(s.replace(",", "."))


def _val(num, unit, fallback=None):
    unit = unit or fallback
    n = _num(num)
    if unit:
        return n * _MULT[unit]
    return n if n >= 100_000 else None  # số trần chỉ coi là tiền khi đủ lớn


def parse_budget(q):
    """Trả về (giaMin, giaMax, câu_đã_bỏ_phần_giá). Nhận: 'duoi 10 trieu', 'tu 5 den 8tr',
    'tren 20tr', 'khoang 15 trieu', '10 cu'..."""
    q = q.replace("<", " duoi ").replace(">", " tren ").replace("~", " khoang ")
    q = re.sub(r"\s+", " ", q)
    gmin = gmax = None

    m = re.search(rf"\b(?:tu\s+)?{_AMT}\s*(?:\bden\b|\btoi\b|-)\s*{_AMT}", q)
    if m:
        lo = _val(m.group(1), m.group(2), m.group(4))
        hi = _val(m.group(3), m.group(4))
        if lo and hi:
            gmin, gmax = sorted((lo, hi))
            q = q[:m.start()] + " " + q[m.end():]
            return round(gmin), round(gmax), q

    patterns = [
        ("max", rf"\b(?:duoi|toi da|khong qua|nho hon|re hon)\s*{_AMT}"),
        ("min", rf"\b(?:tren|toi thieu|lon hon|it nhat|tu)\s+{_AMT}"),
        ("around", rf"\b(?:khoang|tam|gan|xap xi|ngan sach)\s*{_AMT}"),
    ]
    for kind, pat in patterns:
        m = re.search(pat, q)
        if not m:
            continue
        v = _val(m.group(1), m.group(2))
        if not v:
            continue
        if kind == "max":
            gmax = v
        elif kind == "min":
            gmin = v
        else:
            gmin, gmax = v * 0.8, v * 1.2
        q = q[:m.start()] + " " + q[m.end():]

    if gmin is None and gmax is None:  # "10tr", "10 trieu" đứng một mình
        for m in re.finditer(_AMT, q):
            if m.group(2):
                v = _val(m.group(1), m.group(2))
                gmin, gmax = v * 0.8, v * 1.2
                q = q[:m.start()] + " " + q[m.end():]
                break

    return (round(gmin) if gmin else None), (round(gmax) if gmax else None), q


# ----------------------------- Nhu cầu -----------------------------
NEED_KEYWORDS = {
    "gaming": ["choi game", "game", "gaming", "pubg", "lien quan", "fps", "cau hinh manh", "hieu nang"],
    "camera": ["chup anh", "chup hinh", "camera", "quay phim", "selfie", "song ao", "vlog", "quay video"],
    "pin": ["pin trau", "pin khoe", "pin lau", "dung pin", "pin tot", "pin cao", "sac nhanh", "pin"],
    "man_hinh": ["man hinh dep", "man hinh lon", "xem phim", "amoled", "oled", "120hz", "man hinh"],
    "gia_re": ["gia re", "re nhat", "tiet kiem", "sinh vien", "hoc sinh", "binh dan"],
    "cao_cap": ["cao cap", "flagship", "sang trong", "dang cap", "tot nhat", "xin so"],
    "nho_gon": ["nho gon", "de cam", "cam gon"],
    "nguoi_lon_tuoi": ["nguoi lon tuoi", "ong ba", "bo me", "cha me", "de dung", "chu to"],
    "van_phong": ["van phong", "lam viec", "cong viec", "da nhiem"],
}

NEED_LABEL = {
    "gaming": "chơi game", "camera": "chụp ảnh/quay phim", "pin": "pin trâu",
    "man_hinh": "màn hình đẹp", "gia_re": "giá rẻ", "cao_cap": "cao cấp",
    "nho_gon": "nhỏ gọn", "nguoi_lon_tuoi": "người lớn tuổi", "van_phong": "làm việc/văn phòng",
}

# Mỗi nhu cầu = trọng số trên các đặc trưng (đã quy về thứ hạng 0..1 giữa các máy)
NEED_PROFILES = {
    "gaming": {"ram": .30, "hz": .25, "pin": .15, "premium": .20, "rom": .10},
    "camera": {"cam": .55, "premium": .30, "rom": .15},
    "pin": {"pin": .85, "ram": .10, "rom": .05},
    "man_hinh": {"hz": .35, "screen": .35, "premium": .30},
    "gia_re": {"cheap": 1.0},
    "cao_cap": {"premium": .70, "cam": .15, "ram": .15},
    "nho_gon": {"compact": .80, "premium": .20},
    "nguoi_lon_tuoi": {"screen": .35, "pin": .35, "cheap": .30},
    "van_phong": {"ram": .40, "pin": .30, "rom": .30},
}


def detect_needs(q):
    found = []
    for need, kws in NEED_KEYWORDS.items():
        for kw in sorted(kws, key=len, reverse=True):
            pat = rf"\b{re.escape(kw)}\b"
            if re.search(pat, q):
                if need not in found:
                    found.append(need)
                q = re.sub(pat, " ", q)
    return found, q


# ----------------------------- Hãng / từ khoá còn lại -----------------------------
BRAND_ALIAS = {"iphone": "apple", "ipad": "apple", "galaxy": "samsung",
               "redmi": "xiaomi", "poco": "xiaomi", "reno": "oppo"}

GENERIC_RECO = ["goi y", "tu van", "nen mua", "dien thoai nao", "may nao", "mua may",
                "mua dien thoai", "tim may", "tim dien thoai", "can mua", "muon mua"]

STOP = set("""toi minh em anh chi ban shop cho can muon tim mua nen goi y tu van dien thoai
may nao loai dong la co khong giup voi duoc cua hay hoac nhe nha oi a o thi va nhung con de
se dang rat lam hon mot cai chiec nhat gi ve di xin chao hello hi tren duoi khoang tam den
toi thieu da tot""".split())


def clean_text(q):
    toks = [t for t in re.findall(r"[a-z0-9]+", q) if t not in STOP]
    return " ".join(toks)
