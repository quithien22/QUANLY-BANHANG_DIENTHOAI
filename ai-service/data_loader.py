"""Lấy dữ liệu huấn luyện từ SQL Server (và lưu bản CSV vào thư mục data/ để kiểm tra)."""
import pandas as pd
from sqlalchemy import text

import config

# tên -> (câu SQL, các cột, bắt buộc?)
TABLES = {
    "san_pham": (
        "SELECT maSP, tenSP, giaBan, hinhAnh, hang, tonKho, trangThai FROM SanPham",
        ["maSP", "tenSP", "giaBan", "hinhAnh", "hang", "tonKho", "trangThai"],
        True,
    ),
    "thong_so": (
        "SELECT maSP, nhan, giaTri FROM ThongSoKyThuat",
        ["maSP", "nhan", "giaTri"],
        True,
    ),
    "mua_hang": (
        """SELECT ct.maHoaDon, hd.maKH, ct.maSP, ct.soLuong
           FROM ChiTietHoaDon ct
           JOIN HoaDon hd ON hd.maHoaDon = ct.maHoaDon
           WHERE hd.trangThai <> 'da_huy'""",
        ["maHoaDon", "maKH", "maSP", "soLuong"],
        True,
    ),
    "bien_the": (
        "SELECT maSP, loaiBienThe, giaTri FROM BienTheSanPham",
        ["maSP", "loaiBienThe", "giaTri"],
        False,
    ),
    "yeu_thich": (
        "SELECT maKH, maSP FROM SanPhamYeuThich",
        ["maKH", "maSP"],
        False,
    ),
    "danh_gia": (
        "SELECT maKH, maSP, soSao FROM DanhGiaSanPham",
        ["maKH", "maSP", "soSao"],
        False,
    ),
}


def load_data(engine, save_csv=True):
    data = {}
    with engine.connect() as conn:
        for name, (sql, cols, required) in TABLES.items():
            try:
                df = pd.read_sql(text(sql), conn)
            except Exception as err:  # bảng tuỳ chọn lỗi thì bỏ qua
                if required:
                    raise
                print(f"[cảnh báo] Không đọc được '{name}': {err}")
                df = pd.DataFrame(columns=cols)
            data[name] = df
            print(f"  - {name}: {len(df)} dòng")

    if save_csv:
        config.DATA_DIR.mkdir(exist_ok=True)
        for name, df in data.items():
            df.to_csv(config.DATA_DIR / f"{name}.csv", index=False, encoding="utf-8-sig")
    return data


def load_data_from_csv():
    """Huấn luyện lại từ các file CSV đã export trước đó (không cần kết nối DB)."""
    data = {}
    for name, (_, cols, required) in TABLES.items():
        path = config.DATA_DIR / f"{name}.csv"
        if path.exists():
            data[name] = pd.read_csv(path, encoding="utf-8-sig")
        elif required:
            raise FileNotFoundError(f"Thiếu {path}. Hãy chạy train.py (có DB) ít nhất một lần.")
        else:
            data[name] = pd.DataFrame(columns=cols)
    return data
