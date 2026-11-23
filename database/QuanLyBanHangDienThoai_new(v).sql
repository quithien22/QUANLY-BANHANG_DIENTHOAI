/*
====================================================================
DATABASE: QuanLyBanHangDienThoai  (PHIÊN BẢN ĐÃ SẮP XẾP LẠI)
- Các bảng được tạo theo đúng thứ tự phụ thuộc khóa ngoại
- Cột chứa tiếng Việt có dấu dùng NVARCHAR
- Dữ liệu tiếng Việt trong INSERT có tiền tố N'...'
- Đã gộp các lệnh ALTER TABLE vào CREATE TABLE
====================================================================
*/

USE master;

IF EXISTS (
    SELECT 1
    FROM sys.databases
    WHERE
        name = 'QuanLyBanHangDienThoai'
)
BEGIN
    ALTER DATABASE QuanLyBanHangDienThoai SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE QuanLyBanHangDienThoai
END;

CREATE DATABASE QuanLyBanHangDienThoai;

USE QuanLyBanHangDienThoai;

/*
====================================================================
PHẦN 1: TẠO BẢNG
====================================================================
*/

-- ------------------------------------------------------------------
-- 1. NHÂN SỰ
-- ------------------------------------------------------------------
CREATE TABLE ChucVu (
    maCV VARCHAR(20) PRIMARY KEY,
    tenCV NVARCHAR(50)
);

CREATE TABLE ChucNang (
    maChucNang VARCHAR(20) PRIMARY KEY,
    tenChucNang NVARCHAR(100)
);

CREATE TABLE PhanQuyen (
    maCV VARCHAR(20),
    maChucNang VARCHAR(20),
    quyen INT,
    PRIMARY KEY (maCV, maChucNang),
    FOREIGN KEY (maCV) REFERENCES ChucVu (maCV),
    FOREIGN KEY (maChucNang) REFERENCES ChucNang (maChucNang)
);

CREATE TABLE NhanVien (
    maNV VARCHAR(20) PRIMARY KEY,
    hoTen NVARCHAR(50),
    ngaySinh DATE,
    gioiTinh NVARCHAR(10),
    diaChi NVARCHAR(MAX),
    email VARCHAR(255),
    SDT VARCHAR(15),
    avatar NVARCHAR(500) NULL,
    trangThai BIT,
    maCV VARCHAR(20),
    matKhau VARCHAR(255),
    FOREIGN KEY (maCV) REFERENCES ChucVu (maCV)
);

CREATE TABLE HopDong (
    maHopDong VARCHAR(20) PRIMARY KEY,
    ngayBD DATE,
    ngayKT DATE,
    luongCB FLOAT,
    maNV VARCHAR(20),
    trangThai BIT,
    hinhThucLamViec NVARCHAR(50),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

CREATE TABLE ChamCong (
    maNV VARCHAR(20),
    thoiGianChamCong DATE,
    PRIMARY KEY (maNV, thoiGianChamCong),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

CREATE TABLE Luong (
    maLuong VARCHAR(20) PRIMARY KEY,
    maNV VARCHAR(20),
    tongNgayCong INT,
    luongCoBan DECIMAL(15, 2),
    luongThuong DECIMAL(15, 2),
    luongThucNhan DECIMAL(15, 2),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

-- ------------------------------------------------------------------
-- 2. KHÁCH HÀNG
-- ------------------------------------------------------------------
CREATE TABLE KhachHang (
    maKH VARCHAR(20) PRIMARY KEY,
    hoTen NVARCHAR(50),
    diaChi NVARCHAR(MAX),
    diemTichLuy INT DEFAULT 0,
    SDT VARCHAR(15),
    gioiTinh NVARCHAR(10),
    email VARCHAR(255),
    ngaySinh DATE,
    matKhau VARCHAR(255),
    tongDonHang INT DEFAULT 0,
    trangThai BIT
);

-- Sổ địa chỉ giao hàng (mỗi khách có thể lưu nhiều địa chỉ)
CREATE TABLE DiaChiGiaoHang (
    maDiaChi INT IDENTITY(1, 1) PRIMARY KEY,
    maKH VARCHAR(20),
    hoTenNguoiNhan NVARCHAR(50),
    SDT VARCHAR(15),
    diaChiChiTiet NVARCHAR(MAX),
    macDinh BIT DEFAULT 0,
    daXoa BIT DEFAULT 0,
    FOREIGN KEY (maKH) REFERENCES KhachHang (maKH)
);

-- ------------------------------------------------------------------
-- 3. SẢN PHẨM
-- (ThuongHieu phải tạo TRƯỚC SanPham vì SanPham tham chiếu tới nó)
-- ------------------------------------------------------------------
CREATE TABLE LoaiSanPham (
    maLSP VARCHAR(20) PRIMARY KEY,
    tenLSP NVARCHAR(100),
    trangThai BIT
);

CREATE TABLE ThuongHieu (
    maThuongHieu VARCHAR(20) PRIMARY KEY,
    tenThuongHieu NVARCHAR(100),
    hinhAnh VARCHAR(500), -- đường dẫn / URL logo của hãng
    trangThai BIT DEFAULT 1
);

CREATE TABLE SanPham (
    maSP VARCHAR(20) PRIMARY KEY,
    tenSP NVARCHAR(100),
    trangThai BIT,
    tonKho INT,
    hinhAnh VARCHAR(255),
    donVi NVARCHAR(20),
    maLSP VARCHAR(20),
    giaBan FLOAT,
    maThuongHieu VARCHAR(20), -- dùng để lọc theo hãng
    badge NVARCHAR(50), -- "GIẢM SỐC", "Hàng Đặt Trước"...
    tag NVARCHAR(50), -- "Trả góp 0%"...
    diemDanhGiaTB FLOAT DEFAULT 0, -- rating trung bình (đồng bộ với DanhGiaSanPham)
    soLuongDanhGia INT DEFAULT 0,
    FOREIGN KEY (maLSP) REFERENCES LoaiSanPham (maLSP),
    FOREIGN KEY (maThuongHieu) REFERENCES ThuongHieu (maThuongHieu)
);

-- Biến thể sản phẩm: dung lượng, màu sắc
CREATE TABLE BienTheSanPham (
    maBienThe VARCHAR(20) PRIMARY KEY,
    maSP VARCHAR(20),
    loaiBienThe VARCHAR(20), -- 'dungluong' hoặc 'mausac'
    giaTri NVARCHAR(50), -- '256GB', 'Đen'...
    giaChenhLech FLOAT DEFAULT 0, -- chênh lệch giá so với giá gốc
    hinhAnh VARCHAR(255),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP)
);

-- Thông số kỹ thuật (nhãn - giá trị hiển thị ở trang chi tiết)
CREATE TABLE ThongSoKyThuat (
    maThongSo INT IDENTITY(1, 1) PRIMARY KEY,
    maSP VARCHAR(20),
    nhan NVARCHAR(100), -- "Màn hình", "Chip", "Pin"...
    giaTri NVARCHAR(255), -- "6.7 inches, Super Retina XDR OLED, 120Hz"
    thuTu INT DEFAULT 0,
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP)
);

-- ------------------------------------------------------------------
-- 4. NHÀ CUNG CẤP - NHẬP HÀNG
-- ------------------------------------------------------------------
CREATE TABLE NhaCungCap (
    maNCC VARCHAR(20) PRIMARY KEY,
    tenNCC NVARCHAR(100),
    diaChi NVARCHAR(MAX),
    SDT VARCHAR(15),
    trangThai BIT
);

CREATE TABLE LoHang (
    maLoHang VARCHAR(20) PRIMARY KEY,
    maSP VARCHAR(20),
    hanSuDung DATE,
    ngayNhap DATE,
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP)
);

CREATE TABLE PhieuNhap (
    maPN VARCHAR(20) PRIMARY KEY,
    ngayLap DATE,
    gioLap TIME,
    tongTien DECIMAL(15, 2),
    maNCC VARCHAR(20),
    maNV VARCHAR(20),
    trangThai BIT,
    FOREIGN KEY (maNCC) REFERENCES NhaCungCap (maNCC),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

CREATE TABLE ChiTietPhieuNhap (
    maPN VARCHAR(20),
    maLoHang VARCHAR(20),
    soLuong INT,
    giaNhap FLOAT,
    PRIMARY KEY (maPN, maLoHang),
    FOREIGN KEY (maPN) REFERENCES PhieuNhap (maPN),
    FOREIGN KEY (maLoHang) REFERENCES LoHang (maLoHang)
);

-- ------------------------------------------------------------------
-- 5. KHUYẾN MÃI - FLASH SALE
-- ------------------------------------------------------------------
CREATE TABLE KhuyenMai (
    maKM VARCHAR(20) PRIMARY KEY,
    tenKM NVARCHAR(255),
    dieuKien NVARCHAR(MAX),
    ngayBD DATE,
    ngayKT DATE,
    phanTram FLOAT,
    trangThai BIT
);

-- Khung giờ flash sale (09:00-12:00, 12:00-15:00...)
CREATE TABLE KhungGioFlashSale (
    maKhungGio VARCHAR(20) PRIMARY KEY,
    gioBD TIME,
    gioKT TIME,
    ngayApDung DATE,
    trangThai VARCHAR(20) -- 'da_dien_ra', 'dang_dien_ra', 'sap_dien_ra'
);

-- Sản phẩm giảm giá trong từng khung giờ, số lượng giới hạn
CREATE TABLE SanPhamFlashSale (
    maKhungGio VARCHAR(20),
    maSP VARCHAR(20),
    giaFlashSale FLOAT,
    soLuongGioiHan INT,
    daBan INT DEFAULT 0,
    PRIMARY KEY (maKhungGio, maSP),
    FOREIGN KEY (maKhungGio) REFERENCES KhungGioFlashSale (maKhungGio),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP)
);

-- ------------------------------------------------------------------
-- 6. ĐÁNH GIÁ SẢN PHẨM
-- ------------------------------------------------------------------
CREATE TABLE DanhGiaSanPham (
    maDanhGia INT IDENTITY(1, 1) PRIMARY KEY,
    maSP VARCHAR(20),
    maKH VARCHAR(20),
    soSao INT CHECK (soSao BETWEEN 1 AND 5),
    noiDung NVARCHAR(MAX),
    daMuaHang BIT DEFAULT 0, -- badge "Đã mua tại Blue-Tech"
    ngayTao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP),
    FOREIGN KEY (maKH) REFERENCES KhachHang (maKH)
);

CREATE TABLE HinhAnhDanhGia (
    maAnh INT IDENTITY(1, 1) PRIMARY KEY,
    maDanhGia INT,
    duongDan VARCHAR(255),
    FOREIGN KEY (maDanhGia) REFERENCES DanhGiaSanPham (maDanhGia)
);

CREATE TABLE PhanHoiDanhGia (
    maPhanHoi INT IDENTITY(1, 1) PRIMARY KEY,
    maDanhGia INT,
    maNV VARCHAR(20), -- nhân viên/shop trả lời đánh giá
    noiDung NVARCHAR(MAX),
    ngayTao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (maDanhGia) REFERENCES DanhGiaSanPham (maDanhGia),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

-- ------------------------------------------------------------------
-- 7. YÊU THÍCH - GIỎ HÀNG
-- ------------------------------------------------------------------
CREATE TABLE SanPhamYeuThich (
    maKH VARCHAR(20),
    maSP VARCHAR(20),
    ngayThem DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (maKH, maSP),
    FOREIGN KEY (maKH) REFERENCES KhachHang (maKH),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP)
);

CREATE TABLE GioHang (
    maGioHang INT IDENTITY(1, 1) PRIMARY KEY,
    maKH VARCHAR(20),
    maSP VARCHAR(20),
    maBienThe VARCHAR(20) NULL,
    soLuong INT,
    ngayThem DATETIME DEFAULT GETDATE(),
    tenPhanLoai NVARCHAR(100), -- (gộp từ ALTER) VD: '256GB - Đen'
    gia DECIMAL(15, 2), -- (gộp từ ALTER) đơn giá để tính tiền
    FOREIGN KEY (maKH) REFERENCES KhachHang (maKH),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP),
    FOREIGN KEY (maBienThe) REFERENCES BienTheSanPham (maBienThe)
);

-- ------------------------------------------------------------------
-- 8. HÓA ĐƠN - THANH TOÁN - VẬN CHUYỂN
-- ------------------------------------------------------------------
CREATE TABLE HoaDon (
    maHoaDon VARCHAR(20) PRIMARY KEY,
    tongTien FLOAT,
    maKH VARCHAR(20),
    maNV VARCHAR(20),
    maKM VARCHAR(20),
    maDiaChi INT, -- địa chỉ giao hàng được chọn cho đơn này
    thoiGianLap DATETIME,
    trangThai VARCHAR(30), -- 'cho_xac_nhan', 'dang_giao', 'hoan_tat', 'da_huy'
    FOREIGN KEY (maKH) REFERENCES KhachHang (maKH),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV),
    FOREIGN KEY (maKM) REFERENCES KhuyenMai (maKM),
    FOREIGN KEY (maDiaChi) REFERENCES DiaChiGiaoHang (maDiaChi)
);

CREATE TABLE ChiTietHoaDon (
    maChiTiet INT IDENTITY(1, 1) PRIMARY KEY,
    maHoaDon VARCHAR(20),
    maSP VARCHAR(20),
    maBienThe VARCHAR(20) NULL,
    soLuong INT,
    giaBan FLOAT,
    tenPhanLoai NVARCHAR(100), -- (gộp từ ALTER) lưu lại phân loại khi thanh toán
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon (maHoaDon),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP),
    FOREIGN KEY (maBienThe) REFERENCES BienTheSanPham (maBienThe)
);

CREATE TABLE ThanhToan (
    maThanhToan VARCHAR(20) PRIMARY KEY,
    maHoaDon VARCHAR(20),
    phuongThuc NVARCHAR(30), -- 'COD', 'VNPay', 'Momo', 'Chuyển khoản'...
    soTien FLOAT,
    trangThai VARCHAR(20), -- 'cho_thanh_toan', 'da_thanh_toan', 'that_bai'
    thoiGian DATETIME,
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon (maHoaDon)
);

CREATE TABLE VanChuyen (
    maVanChuyen VARCHAR(20) PRIMARY KEY,
    maHoaDon VARCHAR(20),
    donViVanChuyen NVARCHAR(50),
    maVanDon VARCHAR(50),
    phiVanChuyen FLOAT,
    trangThai VARCHAR(30), -- 'cho_lay_hang', 'dang_giao', 'da_giao', 'da_huy'
    ngayGiaoDuKien DATE,
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon (maHoaDon)
);

-- ------------------------------------------------------------------
-- 9. ĐỔI TRẢ HÀNG
-- ------------------------------------------------------------------
CREATE TABLE DoiTraHang (
    maDoiTra VARCHAR(20) PRIMARY KEY,
    maHoaDon VARCHAR(20),
    maSP VARCHAR(20),
    lyDo NVARCHAR(MAX),
    loaiYeuCau VARCHAR(20), -- 'doi_hang' / 'tra_hang'
    hinhThucGiaiQuyet NVARCHAR(30),
    ghiChuNoiBo NVARCHAR(MAX),
    hinhAnh NVARCHAR(MAX),
    maNV VARCHAR(20), -- nhân viên xử lý
    trangThai VARCHAR(20), -- 'cho_duyet', 'da_duyet', 'tu_choi', 'hoan_tat'
    ngayTao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon (maHoaDon),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

-- ------------------------------------------------------------------
-- 10. FAQ - CÀI ĐẶT HỆ THỐNG - BANNER QUẢNG CÁO
-- ------------------------------------------------------------------
CREATE TABLE DanhMucFAQ (
    maDanhMuc INT IDENTITY(1, 1) PRIMARY KEY,
    tenDanhMuc NVARCHAR(100),
    thuTu INT DEFAULT 0,
    trangThai BIT DEFAULT 1
);

CREATE TABLE CauHoiFAQ (
    maCauHoi INT IDENTITY(1, 1) PRIMARY KEY,
    maDanhMuc INT,
    cauHoi NVARCHAR(500),
    traLoi NVARCHAR(MAX),
    thuTu INT DEFAULT 0,
    trangThai BIT DEFAULT 1,
    maNV VARCHAR(20) NULL, -- nhân viên soạn / cập nhật câu hỏi
    FOREIGN KEY (maDanhMuc) REFERENCES DanhMucFAQ (maDanhMuc),
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

-- Cấu hình cửa hàng: chỉ có DUY NHẤT 1 dòng (id = 1)
CREATE TABLE CaiDatHeThong (
    id INT PRIMARY KEY CHECK (id = 1),
    tenCuaHang NVARCHAR(100),
    diaChi NVARCHAR(MAX),
    hotline VARCHAR(20),
    logo VARCHAR(500) NULL,
    moTa NVARCHAR(MAX) NULL,
    phiMacDinh FLOAT DEFAULT 0, -- phí vận chuyển mặc định
    nguongMienPhi FLOAT DEFAULT 0, -- đơn từ mức này được miễn phí ship
    donViHoTro NVARCHAR(MAX), -- JSON danh sách đơn vị vận chuyển hỗ trợ
    maNV VARCHAR(20) NULL, -- nhân viên cập nhật cấu hình lần cuối
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV)
);

CREATE TABLE BannerQC (
    maBanner INT IDENTITY(1, 1) PRIMARY KEY,
    tenBanner NVARCHAR(200),
    hinhAnh VARCHAR(1000),
    duongDan VARCHAR(500), -- link khi bấm vào banner
    viTri VARCHAR(50), -- 'slider_chinh', 'phu_tren', 'phu_duoi'
    thuTu INT DEFAULT 0,
    trangThai BIT DEFAULT 1,
    tieuDe NVARCHAR(200) NULL,
    moTa NVARCHAR(MAX) NULL,
    textNutBam NVARCHAR(100) NULL,
    maNV VARCHAR(20) NULL, -- nhân viên tạo banner
    maSP VARCHAR(20) NULL, -- sản phẩm được quảng cáo (nếu có)
    maKM VARCHAR(20) NULL, -- khuyến mãi được quảng cáo (nếu có)
    FOREIGN KEY (maNV) REFERENCES NhanVien (maNV),
    FOREIGN KEY (maSP) REFERENCES SanPham (maSP),
    FOREIGN KEY (maKM) REFERENCES KhuyenMai (maKM)
);

/*
====================================================================
PHẦN 2: DỮ LIỆU MẪU (theo đúng thứ tự phụ thuộc)
Lưu ý: chuỗi tiếng Việt phải có tiền tố N'...'
====================================================================
*/

-- 1. NHÂN SỰ ---------------------------------------------------------
INSERT INTO
    ChucVu (maCV, tenCV)
VALUES ('CV01', N'Quản lý cửa hàng'),
    ('CV02', N'Nhân viên bán hàng'),
    ('CV03', N'Nhân viên kho');

INSERT INTO
    ChucNang (maChucNang, tenChucNang)
VALUES ('CN01', N'Quản lý Đơn Hàng'),
    ('CN02', N'Quản lý Sản Phẩm'),
    ('CN03', N'Quản lý Khách Hàng');

INSERT INTO
    PhanQuyen (maCV, maChucNang, quyen)
VALUES ('CV01', 'CN01', 1),
    ('CV01', 'CN02', 1),
    ('CV01', 'CN03', 1),
    ('CV02', 'CN01', 1),
    ('CV02', 'CN03', 1),
    ('CV03', 'CN02', 1);

INSERT INTO
    NhanVien (
        maNV,
        hoTen,
        ngaySinh,
        gioiTinh,
        diaChi,
        email,
        SDT,
        trangThai,
        maCV,
        matKhau
    )
VALUES (
        'NV01',
        N'Trần Qui Thiện',
        '1995-05-12',
        N'Nam',
        N'TP.HCM',
        'thien@gmail.com',
        '0911000111',
        1,
        'CV01',
        '123456'
    ),
    (
        'NV02',
        N'Nguyễn Thị Hoa',
        '1998-08-20',
        N'Nữ',
        N'Hà Nội',
        'hoa@gmail.com',
        '0911000222',
        1,
        'CV02',
        '123456'
    ),
    (
        'NV03',
        N'Lê Văn Luyện',
        '1990-01-01',
        N'Nam',
        N'Đà Nẵng',
        'luyen@gmail.com',
        '0911000333',
        1,
        'CV03',
        '123456'
    ),
    (
        'NV04',
        N'Phạm Quỳnh Anh',
        '1999-02-14',
        N'Nữ',
        N'Cần Thơ',
        'quynhanh@gmail.com',
        '0911000444',
        1,
        'CV02',
        '123456'
    ),
    (
        'NV05',
        N'Hoàng Trọng Nghĩa',
        '1996-11-11',
        N'Nam',
        N'Huế',
        'nghia@gmail.com',
        '0911000555',
        1,
        'CV03',
        '123456'
    ),
    (
        'NV06',
        N'Vũ Đức Đam',
        '1985-09-02',
        N'Nam',
        N'Hải Phòng',
        'dam@gmail.com',
        '0911000666',
        1,
        'CV01',
        '123456'
    ),
    (
        'NV07',
        N'Bùi Thị Xuân',
        '2000-03-08',
        N'Nữ',
        N'TP.HCM',
        'xuan@gmail.com',
        '0911000777',
        1,
        'CV02',
        '123456'
    ),
    (
        'NV08',
        N'Đặng Trần Côn',
        '1992-04-30',
        N'Nam',
        N'Hà Nội',
        'con@gmail.com',
        '0911000888',
        1,
        'CV03',
        '123456'
    ),
    (
        'NV09',
        N'Ngô Tất Tố',
        '1994-10-10',
        N'Nam',
        N'Nam Định',
        'to@gmail.com',
        '0911000999',
        1,
        'CV02',
        '123456'
    ),
    (
        'NV10',
        N'Trịnh Công Sơn',
        '1988-12-25',
        N'Nam',
        N'Đà Lạt',
        'son@gmail.com',
        '0911000000',
        1,
        'CV01',
        '123456'
    );

INSERT INTO
    HopDong (
        maHopDong,
        ngayBD,
        ngayKT,
        luongCB,
        maNV,
        trangThai,
        hinhThucLamViec
    )
VALUES (
        'HD01',
        '2023-01-01',
        '2026-01-01',
        15000000,
        'NV01',
        1,
        N'Full-time'
    ),
    (
        'HD02',
        '2023-02-01',
        '2026-02-01',
        8000000,
        'NV02',
        1,
        N'Full-time'
    ),
    (
        'HD03',
        '2023-03-01',
        '2026-03-01',
        9000000,
        'NV03',
        1,
        N'Full-time'
    ),
    (
        'HD04',
        '2023-04-01',
        '2026-04-01',
        8000000,
        'NV04',
        1,
        N'Part-time'
    ),
    (
        'HD05',
        '2023-05-01',
        '2026-05-01',
        9000000,
        'NV05',
        1,
        N'Full-time'
    ),
    (
        'HD06',
        '2023-06-01',
        '2026-06-01',
        15000000,
        'NV06',
        1,
        N'Full-time'
    ),
    (
        'HD07',
        '2023-07-01',
        '2026-07-01',
        8000000,
        'NV07',
        1,
        N'Part-time'
    ),
    (
        'HD08',
        '2023-08-01',
        '2026-08-01',
        9000000,
        'NV08',
        1,
        N'Full-time'
    ),
    (
        'HD09',
        '2023-09-01',
        '2026-09-01',
        8000000,
        'NV09',
        1,
        N'Full-time'
    ),
    (
        'HD10',
        '2023-10-01',
        '2026-10-01',
        15000000,
        'NV10',
        1,
        N'Full-time'
    );

INSERT INTO
    ChamCong (maNV, thoiGianChamCong)
VALUES ('NV01', '2026-09-01'),
    ('NV02', '2026-09-01'),
    ('NV03', '2026-09-01'),
    ('NV04', '2026-09-01'),
    ('NV05', '2026-09-01'),
    ('NV06', '2026-09-01'),
    ('NV07', '2026-09-01'),
    ('NV08', '2026-09-01'),
    ('NV09', '2026-09-01'),
    ('NV10', '2026-09-01');

INSERT INTO
    Luong (
        maLuong,
        maNV,
        tongNgayCong,
        luongCoBan,
        luongThuong,
        luongThucNhan
    )
VALUES (
        'L01',
        'NV01',
        26,
        15000000,
        2000000,
        17000000
    ),
    (
        'L02',
        'NV02',
        24,
        8000000,
        500000,
        8500000
    ),
    (
        'L03',
        'NV03',
        26,
        9000000,
        500000,
        9500000
    ),
    (
        'L04',
        'NV04',
        15,
        4000000,
        0,
        4000000
    ),
    (
        'L05',
        'NV05',
        25,
        9000000,
        500000,
        9500000
    ),
    (
        'L06',
        'NV06',
        26,
        15000000,
        3000000,
        18000000
    ),
    (
        'L07',
        'NV07',
        14,
        4000000,
        200000,
        4200000
    ),
    (
        'L08',
        'NV08',
        26,
        9000000,
        1000000,
        10000000
    ),
    (
        'L09',
        'NV09',
        26,
        8000000,
        1500000,
        9500000
    ),
    (
        'L10',
        'NV10',
        26,
        15000000,
        2000000,
        17000000
    );

-- 2. KHÁCH HÀNG ------------------------------------------------------
INSERT INTO
    KhachHang (
        maKH,
        hoTen,
        diaChi,
        diemTichLuy,
        SDT,
        gioiTinh,
        email,
        ngaySinh,
        matKhau,
        trangThai
    )
VALUES (
        'KH01',
        N'Lê Văn Hùng',
        N'123 Cầu Giấy, HN',
        500,
        '0988765432',
        N'Nam',
        'hung@gmail.com',
        '1995-10-10',
        'pass',
        1
    ),
    (
        'KH02',
        N'Trần Thị Lan',
        N'456 Lê Lợi, HCM',
        1200,
        '0912345678',
        N'Nữ',
        'lan@gmail.com',
        '1992-04-15',
        'pass',
        1
    ),
    (
        'KH03',
        N'Nguyễn Minh Anh',
        N'789 Nguyễn Trãi, HCM',
        300,
        '0909111222',
        N'Nữ',
        'minhanh@gmail.com',
        '1998-07-22',
        'pass',
        1
    ),
    (
        'KH04',
        N'Phạm Hồng Sơn',
        N'321 Lê Văn Sỹ, HCM',
        2100,
        '0977444555',
        N'Nam',
        'son@gmail.com',
        '1990-11-05',
        'pass',
        1
    ),
    (
        'KH05',
        N'Hoàng Ngọc Ánh',
        N'654 Quang Trung, HN',
        450,
        '0933666777',
        N'Nữ',
        'ngocanh@gmail.com',
        '2001-02-14',
        'pass',
        1
    ),
    (
        'KH06',
        N'Đặng Quốc Khánh',
        N'987 NĐC, HCM',
        800,
        '0966888999',
        N'Nam',
        'khanh@gmail.com',
        '1994-08-30',
        'pass',
        1
    ),
    (
        'KH07',
        N'Bùi Thị Tuyết',
        N'111 CMT8, HCM',
        150,
        '0944222333',
        N'Nữ',
        'tuyet@gmail.com',
        '1997-12-12',
        'pass',
        0
    ),
    (
        'KH08',
        N'Vũ Hoàng Nam',
        N'222 Bà Triệu, HN',
        3400,
        '0955999111',
        N'Nam',
        'nam@gmail.com',
        '1989-05-19',
        'pass',
        1
    ),
    (
        'KH09',
        N'Đỗ Hải Yến',
        N'333 ĐBP, HCM',
        0,
        '0911223344',
        N'Nữ',
        'haiyen@gmail.com',
        '2000-09-09',
        'pass',
        0
    ),
    (
        'KH10',
        N'Phan Văn Đức',
        N'444 Hùng Vương, ĐN',
        620,
        '0922334455',
        N'Nam',
        'duc@gmail.com',
        '1996-03-25',
        'pass',
        1
    );

INSERT INTO
    DiaChiGiaoHang (
        maKH,
        hoTenNguoiNhan,
        SDT,
        diaChiChiTiet,
        macDinh
    )
VALUES (
        'KH01',
        N'Lê Văn Hùng',
        '0988765432',
        N'Tòa nhà A, 123 Cầu Giấy, HN',
        1
    ),
    (
        'KH02',
        N'Trần Thị Lan',
        '0912345678',
        N'Số 10, ngõ 456 Lê Lợi, HCM',
        1
    ),
    (
        'KH03',
        N'Nguyễn Minh Anh',
        '0909111222',
        N'789 Nguyễn Trãi, HCM',
        1
    ),
    (
        'KH04',
        N'Phạm Hồng Sơn',
        '0977444555',
        N'321 Lê Văn Sỹ, HCM',
        1
    ),
    (
        'KH05',
        N'Hoàng Ngọc Ánh',
        '0933666777',
        N'654 Quang Trung, HN',
        1
    ),
    (
        'KH06',
        N'Đặng Quốc Khánh',
        '0966888999',
        N'987 NĐC, HCM',
        1
    ),
    (
        'KH07',
        N'Bùi Thị Tuyết',
        '0944222333',
        N'111 CMT8, HCM',
        1
    ),
    (
        'KH08',
        N'Vũ Hoàng Nam',
        '0955999111',
        N'222 Bà Triệu, HN',
        1
    ),
    (
        'KH09',
        N'Đỗ Hải Yến',
        '0911223344',
        N'333 ĐBP, HCM',
        1
    ),
    (
        'KH10',
        N'Phan Văn Đức',
        '0922334455',
        N'444 Hùng Vương, ĐN',
        1
    );

-- 3. SẢN PHẨM --------------------------------------------------------
INSERT INTO
    LoaiSanPham (maLSP, tenLSP, trangThai)
VALUES ('LSP01', N'Điện thoại', 1),
    ('LSP02', N'Máy tính bảng', 1),
    ('LSP03', N'Phụ kiện', 1);

-- Thương hiệu (phải insert trước SanPham). Thêm TH07 'Khác' cho phụ kiện không rõ hãng.
INSERT INTO
    ThuongHieu (
        maThuongHieu,
        tenThuongHieu,
        hinhAnh,
        trangThai
    )
VALUES (
        'TH01',
        N'Apple',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-18-pro-01.jpg',
        1
    ),
    (
        'TH02',
        N'Samsung',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:300:300/q:100/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-samsung-galaxy-s25-ultra_3__3.png',
        1
    ),
    (
        'TH03',
        N'Xiaomi',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-poco-f9-ultra-red.jpg',
        1
    ),
    (
        'TH04',
        N'Oppo',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/o/p/oppo-reno16f-pop-white-9.jpg',
        1
    ),
    (
        'TH05',
        N'Vivo',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-pad-mini.jpg',
        1
    ),
    (
        'TH06',
        N'Asus',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/p/apple-airpods-4-thumb.png',
        1
    ),
    ('TH07', N'Khác', NULL, 1);

INSERT INTO
    SanPham (
        maSP,
        tenSP,
        trangThai,
        tonKho,
        hinhAnh,
        donVi,
        maLSP,
        giaBan,
        maThuongHieu,
        badge,
        tag,
        diemDanhGiaTB,
        soLuongDanhGia
    )
VALUES (
        'SP01',
        N'iPhone 15 Pro Max',
        1,
        50,
        'ip15pm.png',
        N'Chiếc',
        'LSP01',
        29990000,
        'TH01',
        N'BÁN CHẠY',
        N'Trả góp 0%',
        4.8,
        120
    ),
    (
        'SP02',
        N'Samsung Galaxy S24 Ultra',
        1,
        30,
        's24ultra.png',
        N'Chiếc',
        'LSP01',
        31990000,
        'TH02',
        N'MỚI',
        N'Tặng 1 triệu',
        4.9,
        85
    ),
    (
        'SP03',
        N'Oppo Find N3 Flip',
        1,
        15,
        'oppon3.png',
        N'Chiếc',
        'LSP01',
        22990000,
        'TH04',
        NULL,
        NULL,
        4.5,
        45
    ),
    (
        'SP04',
        N'Xiaomi 14 Pro',
        1,
        40,
        'mi14pro.png',
        N'Chiếc',
        'LSP01',
        21990000,
        'TH03',
        N'HOT',
        NULL,
        4.7,
        60
    ),
    (
        'SP05',
        N'iPad Pro 11 inch M2',
        1,
        25,
        'ipadprom2.png',
        N'Chiếc',
        'LSP02',
        20990000,
        'TH01',
        N'GIẢM 5%',
        NULL,
        4.8,
        200
    ),
    (
        'SP06',
        N'Galaxy Tab S9',
        1,
        15,
        'tabs9.png',
        N'Chiếc',
        'LSP02',
        19990000,
        'TH02',
        NULL,
        N'Kèm S-Pen',
        4.6,
        50
    ),
    (
        'SP07',
        N'AirPods Pro 2',
        1,
        100,
        'airpodspro2.png',
        N'Chiếc',
        'LSP03',
        6000000,
        'TH01',
        N'BÁN CHẠY',
        NULL,
        4.9,
        300
    ),
    (
        'SP08',
        N'Sạc Samsung 45W',
        1,
        200,
        'sac45w.png',
        N'Củ',
        'LSP03',
        500000,
        'TH02',
        NULL,
        NULL,
        4.8,
        150
    ),
    (
        'SP09',
        N'Ốp lưng iPhone 15 PM',
        1,
        150,
        'opip15pm.png',
        N'Chiếc',
        'LSP03',
        250000,
        'TH07',
        NULL,
        NULL,
        4.5,
        80
    ),
    (
        'SP10',
        N'Cáp Type-C 2m',
        1,
        300,
        'captypec.png',
        N'Sợi',
        'LSP03',
        150000,
        'TH07',
        NULL,
        NULL,
        4.7,
        210
    );

INSERT INTO
    BienTheSanPham (
        maBienThe,
        maSP,
        loaiBienThe,
        giaTri,
        giaChenhLech,
        hinhAnh
    )
VALUES (
        'BT01',
        'SP01',
        'dungluong',
        N'256GB',
        0,
        'ip15pm_256.png'
    ),
    (
        'BT02',
        'SP02',
        'dungluong',
        N'512GB',
        2000000,
        's24_512.png'
    ),
    (
        'BT03',
        'SP03',
        'mausac',
        N'Hồng',
        0,
        'oppo_hong.png'
    ),
    (
        'BT04',
        'SP04',
        'mausac',
        N'Đen',
        0,
        'mi14_den.png'
    ),
    (
        'BT05',
        'SP05',
        'dungluong',
        N'128GB',
        0,
        'ipad_128.png'
    ),
    (
        'BT06',
        'SP06',
        'dungluong',
        N'256GB',
        1500000,
        'tab_256.png'
    ),
    (
        'BT07',
        'SP07',
        'mausac',
        N'Trắng',
        0,
        'airpods_trang.png'
    ),
    (
        'BT08',
        'SP08',
        'mausac',
        N'Đen',
        0,
        'sac_den.png'
    ),
    (
        'BT09',
        'SP09',
        'mausac',
        N'Trong suốt',
        0,
        'op_trong.png'
    ),
    (
        'BT10',
        'SP10',
        'mausac',
        N'Trắng',
        0,
        'cap_trang.png'
    );

INSERT INTO
    ThongSoKyThuat (maSP, nhan, giaTri, thuTu)
VALUES (
        'SP01',
        N'Màn hình',
        N'6.7 inch',
        1
    ),
    (
        'SP02',
        N'Pin',
        N'5000 mAh',
        1
    ),
    ('SP03', N'Camera', N'50MP', 1),
    (
        'SP04',
        N'Chip',
        N'Snapdragon 8 Gen 3',
        1
    ),
    (
        'SP05',
        N'Chip',
        N'Apple M2',
        1
    ),
    (
        'SP06',
        N'Màn hình',
        N'11 inch Dynamic AMOLED',
        1
    ),
    ('SP07', N'Pin', N'30 giờ', 1),
    (
        'SP08',
        N'Công suất',
        N'45W',
        1
    ),
    (
        'SP09',
        N'Chất liệu',
        N'Silicon',
        1
    ),
    (
        'SP10',
        N'Độ dài',
        N'2 mét',
        1
    );

-- 4. NHÀ CUNG CẤP - NHẬP HÀNG -----------------------------------------
INSERT INTO
    NhaCungCap (
        maNCC,
        tenNCC,
        diaChi,
        SDT,
        trangThai
    )
VALUES (
        'NCC01',
        N'Apple VN',
        N'HCM',
        '19001111',
        1
    ),
    (
        'NCC02',
        N'Samsung VN',
        N'Bắc Ninh',
        '19002222',
        1
    ),
    (
        'NCC03',
        N'Digiworld',
        N'HCM',
        '19003333',
        1
    );

INSERT INTO
    LoHang (
        maLoHang,
        maSP,
        hanSuDung,
        ngayNhap
    )
VALUES (
        'LH01',
        'SP01',
        '2028-01-01',
        '2026-01-10'
    ),
    (
        'LH02',
        'SP02',
        '2028-02-01',
        '2026-01-11'
    ),
    (
        'LH03',
        'SP03',
        '2028-03-01',
        '2026-01-12'
    ),
    (
        'LH04',
        'SP04',
        '2028-04-01',
        '2026-01-13'
    ),
    (
        'LH05',
        'SP05',
        '2028-05-01',
        '2026-01-14'
    ),
    (
        'LH06',
        'SP06',
        '2028-06-01',
        '2026-01-15'
    ),
    (
        'LH07',
        'SP07',
        '2028-07-01',
        '2026-01-16'
    ),
    (
        'LH08',
        'SP08',
        '2028-08-01',
        '2026-01-17'
    ),
    (
        'LH09',
        'SP09',
        '2028-09-01',
        '2026-01-18'
    ),
    (
        'LH10',
        'SP10',
        '2028-10-01',
        '2026-01-19'
    );

INSERT INTO
    PhieuNhap (
        maPN,
        ngayLap,
        gioLap,
        tongTien,
        maNCC,
        maNV,
        trangThai
    )
VALUES (
        'PN01',
        '2026-01-10',
        '09:00',
        500000000,
        'NCC01',
        'NV03',
        1
    ),
    (
        'PN02',
        '2026-01-11',
        '10:00',
        300000000,
        'NCC02',
        'NV03',
        1
    ),
    (
        'PN03',
        '2026-01-12',
        '11:00',
        200000000,
        'NCC03',
        'NV05',
        1
    ),
    (
        'PN04',
        '2026-01-13',
        '14:00',
        150000000,
        'NCC03',
        'NV05',
        1
    ),
    (
        'PN05',
        '2026-01-14',
        '15:00',
        400000000,
        'NCC01',
        'NV08',
        1
    ),
    (
        'PN06',
        '2026-01-15',
        '16:00',
        250000000,
        'NCC02',
        'NV08',
        1
    ),
    (
        'PN07',
        '2026-01-16',
        '08:00',
        100000000,
        'NCC01',
        'NV03',
        1
    ),
    (
        'PN08',
        '2026-01-17',
        '09:30',
        50000000,
        'NCC02',
        'NV03',
        1
    ),
    (
        'PN09',
        '2026-01-18',
        '10:45',
        20000000,
        'NCC03',
        'NV05',
        1
    ),
    (
        'PN10',
        '2026-01-19',
        '13:20',
        30000000,
        'NCC03',
        'NV05',
        1
    );

INSERT INTO
    ChiTietPhieuNhap (
        maPN,
        maLoHang,
        soLuong,
        giaNhap
    )
VALUES ('PN01', 'LH01', 50, 25000000),
    ('PN02', 'LH02', 30, 26000000),
    ('PN03', 'LH03', 15, 18000000),
    ('PN04', 'LH04', 40, 17000000),
    ('PN05', 'LH05', 25, 17000000),
    ('PN06', 'LH06', 15, 15000000),
    ('PN07', 'LH07', 100, 4000000),
    ('PN08', 'LH08', 200, 200000),
    ('PN09', 'LH09', 150, 50000),
    ('PN10', 'LH10', 300, 30000);

-- 5. KHUYẾN MÃI - FLASH SALE -------------------------------------------
INSERT INTO
    KhuyenMai (
        maKM,
        tenKM,
        dieuKien,
        ngayBD,
        ngayKT,
        phanTram,
        trangThai
    )
VALUES (
        'KM01',
        N'Sale Tháng 9',
        N'Đơn từ 10M',
        '2026-09-01',
        '2026-09-30',
        5,
        1
    ),
    (
        'KM02',
        N'Freeship',
        N'Mọi đơn',
        '2026-09-01',
        '2026-09-30',
        100,
        1
    );

INSERT INTO
    KhungGioFlashSale (
        maKhungGio,
        gioBD,
        gioKT,
        ngayApDung,
        trangThai
    )
VALUES (
        'FS01',
        '09:00:00',
        '12:00:00',
        '2026-09-15',
        'dang_dien_ra'
    );

INSERT INTO
    SanPhamFlashSale (
        maKhungGio,
        maSP,
        giaFlashSale,
        soLuongGioiHan,
        daBan
    )
VALUES (
        'FS01',
        'SP01',
        27000000,
        10,
        2
    ),
    (
        'FS01',
        'SP02',
        29000000,
        10,
        5
    );

-- 6. ĐÁNH GIÁ ---------------------------------------------------------
INSERT INTO
    DanhGiaSanPham (
        maSP,
        maKH,
        soSao,
        noiDung,
        daMuaHang
    )
VALUES (
        'SP01',
        'KH01',
        5,
        N'Rất mượt',
        1
    ),
    (
        'SP02',
        'KH02',
        5,
        N'Camera đỉnh',
        1
    ),
    (
        'SP03',
        'KH03',
        4,
        N'Hơi nóng',
        1
    ),
    (
        'SP04',
        'KH04',
        5,
        N'Sạc nhanh',
        1
    ),
    (
        'SP05',
        'KH05',
        5,
        N'Tuyệt vời',
        1
    ),
    (
        'SP06',
        'KH06',
        4,
        N'Bút viết ngon',
        1
    ),
    (
        'SP07',
        'KH07',
        5,
        N'Bass ấm',
        1
    ),
    (
        'SP08',
        'KH08',
        5,
        N'Sạc vèo cái đầy',
        1
    ),
    (
        'SP09',
        'KH09',
        3,
        N'Hơi ố vàng',
        1
    ),
    (
        'SP10',
        'KH10',
        5,
        N'Cáp chắc chắn',
        1
    );

INSERT INTO
    HinhAnhDanhGia (maDanhGia, duongDan)
VALUES (1, 'rv1.png'),
    (2, 'rv2.png');

INSERT INTO
    PhanHoiDanhGia (maDanhGia, maNV, noiDung)
VALUES (1, 'NV02', N'Cảm ơn bạn!'),
    (2, 'NV04', N'Shop rất vui!');

-- 7. YÊU THÍCH - GIỎ HÀNG ------------------------------------------------
INSERT INTO
    SanPhamYeuThich (maKH, maSP)
VALUES ('KH01', 'SP02'),
    ('KH02', 'SP01'),
    ('KH03', 'SP04'),
    ('KH04', 'SP03'),
    ('KH05', 'SP06'),
    ('KH06', 'SP05'),
    ('KH07', 'SP08'),
    ('KH08', 'SP07'),
    ('KH09', 'SP10'),
    ('KH10', 'SP09');

INSERT INTO
    GioHang (
        maKH,
        maSP,
        maBienThe,
        soLuong,
        ngayThem,
        tenPhanLoai,
        gia
    )
VALUES (
        'KH01',
        'SP01',
        'BT01',
        1,
        GETDATE(),
        N'256GB',
        29990000
    ),
    (
        'KH02',
        'SP02',
        'BT02',
        1,
        GETDATE(),
        N'512GB',
        33990000
    ),
    (
        'KH03',
        'SP03',
        'BT03',
        2,
        GETDATE(),
        N'Hồng',
        22990000
    ),
    (
        'KH04',
        'SP04',
        'BT04',
        1,
        GETDATE(),
        N'Đen',
        21990000
    ),
    (
        'KH05',
        'SP05',
        'BT05',
        1,
        GETDATE(),
        N'128GB',
        20990000
    ),
    (
        'KH06',
        'SP06',
        'BT06',
        1,
        GETDATE(),
        N'256GB',
        21490000
    ),
    (
        'KH07',
        'SP07',
        'BT07',
        3,
        GETDATE(),
        N'Trắng',
        6000000
    ),
    (
        'KH08',
        'SP08',
        'BT08',
        2,
        GETDATE(),
        N'Đen',
        500000
    ),
    (
        'KH09',
        'SP09',
        'BT09',
        5,
        GETDATE(),
        N'Trong suốt',
        250000
    ),
    (
        'KH10',
        'SP10',
        'BT10',
        4,
        GETDATE(),
        N'Trắng',
        150000
    );

-- 8. HÓA ĐƠN - THANH TOÁN - VẬN CHUYỂN -----------------------------------
INSERT INTO
    HoaDon (
        maHoaDon,
        tongTien,
        maKH,
        maNV,
        maKM,
        maDiaChi,
        thoiGianLap,
        trangThai
    )
VALUES (
        'HD-001',
        29990000,
        'KH01',
        'NV02',
        NULL,
        1,
        '2026-09-01 10:00:00',
        'hoan_tat'
    ),
    (
        'HD-002',
        31990000,
        'KH02',
        'NV04',
        NULL,
        2,
        '2026-09-02 11:00:00',
        'dang_giao'
    ),
    (
        'HD-003',
        22990000,
        'KH03',
        'NV07',
        NULL,
        3,
        '2026-09-03 12:00:00',
        'cho_xac_nhan'
    ),
    (
        'HD-004',
        21990000,
        'KH04',
        'NV09',
        NULL,
        4,
        '2026-09-04 13:00:00',
        'da_huy'
    ),
    (
        'HD-005',
        20990000,
        'KH05',
        'NV02',
        NULL,
        5,
        '2026-09-05 14:00:00',
        'hoan_tat'
    ),
    (
        'HD-006',
        19990000,
        'KH06',
        'NV04',
        NULL,
        6,
        '2026-09-06 15:00:00',
        'dang_giao'
    ),
    (
        'HD-007',
        6000000,
        'KH07',
        'NV07',
        NULL,
        7,
        '2026-09-07 16:00:00',
        'cho_xac_nhan'
    ),
    (
        'HD-008',
        500000,
        'KH08',
        'NV09',
        NULL,
        8,
        '2026-09-08 17:00:00',
        'hoan_tat'
    ),
    (
        'HD-009',
        250000,
        'KH09',
        'NV02',
        NULL,
        9,
        '2026-09-09 18:00:00',
        'hoan_tat'
    ),
    (
        'HD-010',
        150000,
        'KH10',
        'NV04',
        NULL,
        10,
        '2026-09-10 19:00:00',
        'cho_xac_nhan'
    );

INSERT INTO
    ChiTietHoaDon (
        maHoaDon,
        maSP,
        maBienThe,
        soLuong,
        giaBan,
        tenPhanLoai
    )
VALUES (
        'HD-001',
        'SP01',
        'BT01',
        1,
        29990000,
        N'256GB'
    ),
    (
        'HD-002',
        'SP02',
        'BT02',
        1,
        31990000,
        N'512GB'
    ),
    (
        'HD-003',
        'SP03',
        'BT03',
        1,
        22990000,
        N'Hồng'
    ),
    (
        'HD-004',
        'SP04',
        'BT04',
        1,
        21990000,
        N'Đen'
    ),
    (
        'HD-005',
        'SP05',
        'BT05',
        1,
        20990000,
        N'128GB'
    ),
    (
        'HD-006',
        'SP06',
        'BT06',
        1,
        19990000,
        N'256GB'
    ),
    (
        'HD-007',
        'SP07',
        'BT07',
        1,
        6000000,
        N'Trắng'
    ),
    (
        'HD-008',
        'SP08',
        'BT08',
        1,
        500000,
        N'Đen'
    ),
    (
        'HD-009',
        'SP09',
        'BT09',
        1,
        250000,
        N'Trong suốt'
    ),
    (
        'HD-010',
        'SP10',
        'BT10',
        1,
        150000,
        N'Trắng'
    );

INSERT INTO
    ThanhToan (
        maThanhToan,
        maHoaDon,
        phuongThuc,
        soTien,
        trangThai,
        thoiGian
    )
VALUES (
        'TT01',
        'HD-001',
        N'VNPay',
        29990000,
        'da_thanh_toan',
        '2026-09-01 10:05:00'
    ),
    (
        'TT02',
        'HD-002',
        N'Momo',
        31990000,
        'da_thanh_toan',
        '2026-09-02 11:05:00'
    ),
    (
        'TT03',
        'HD-003',
        N'COD',
        22990000,
        'cho_thanh_toan',
        '2026-09-03 12:00:00'
    ),
    (
        'TT04',
        'HD-004',
        N'ZaloPay',
        21990000,
        'that_bai',
        '2026-09-04 13:05:00'
    ),
    (
        'TT05',
        'HD-005',
        N'COD',
        20990000,
        'da_thanh_toan',
        '2026-09-05 14:05:00'
    ),
    (
        'TT06',
        'HD-006',
        N'Chuyển khoản',
        19990000,
        'da_thanh_toan',
        '2026-09-06 15:05:00'
    ),
    (
        'TT07',
        'HD-007',
        N'COD',
        6000000,
        'cho_thanh_toan',
        '2026-09-07 16:00:00'
    ),
    (
        'TT08',
        'HD-008',
        N'VNPay',
        500000,
        'da_thanh_toan',
        '2026-09-08 17:05:00'
    ),
    (
        'TT09',
        'HD-009',
        N'Momo',
        250000,
        'da_thanh_toan',
        '2026-09-09 18:05:00'
    ),
    (
        'TT10',
        'HD-010',
        N'COD',
        150000,
        'cho_thanh_toan',
        '2026-09-10 19:00:00'
    );

INSERT INTO
    VanChuyen (
        maVanChuyen,
        maHoaDon,
        donViVanChuyen,
        maVanDon,
        phiVanChuyen,
        trangThai,
        ngayGiaoDuKien
    )
VALUES (
        'VC01',
        'HD-001',
        N'GHN',
        'MVD01',
        30000,
        'da_giao',
        '2026-09-03'
    ),
    (
        'VC02',
        'HD-002',
        N'GHTK',
        'MVD02',
        35000,
        'dang_giao',
        '2026-09-05'
    ),
    (
        'VC03',
        'HD-003',
        N'J&T',
        'MVD03',
        25000,
        'cho_lay_hang',
        '2026-09-06'
    ),
    (
        'VC04',
        'HD-004',
        N'NinjaVan',
        'MVD04',
        30000,
        'da_huy',
        '2026-09-06'
    ),
    (
        'VC05',
        'HD-005',
        N'GHN',
        'MVD05',
        30000,
        'da_giao',
        '2026-09-07'
    ),
    (
        'VC06',
        'HD-006',
        N'GHTK',
        'MVD06',
        40000,
        'dang_giao',
        '2026-09-09'
    ),
    (
        'VC07',
        'HD-007',
        N'ViettelPost',
        'MVD07',
        50000,
        'cho_lay_hang',
        '2026-09-10'
    ),
    (
        'VC08',
        'HD-008',
        N'GHN',
        'MVD08',
        20000,
        'da_giao',
        '2026-09-10'
    ),
    (
        'VC09',
        'HD-009',
        N'GHTK',
        'MVD09',
        20000,
        'da_giao',
        '2026-09-11'
    ),
    (
        'VC10',
        'HD-010',
        N'J&T',
        'MVD10',
        25000,
        'cho_lay_hang',
        '2026-09-13'
    );

-- 9. ĐỔI TRẢ HÀNG -------------------------------------------------------
INSERT INTO
    DoiTraHang (
        maDoiTra,
        maHoaDon,
        maSP,
        lyDo,
        loaiYeuCau,
        trangThai
    )
VALUES (
        'DT01',
        'HD-001',
        'SP01',
        N'Màn hình trầy nhẹ',
        'doi_hang',
        'da_duyet'
    ),
    (
        'DT02',
        'HD-005',
        'SP05',
        N'Lỗi sạc không vào',
        'tra_hang',
        'hoan_tat'
    ),
    (
        'DT03',
        'HD-008',
        'SP08',
        N'Giao nhầm màu',
        'doi_hang',
        'cho_duyet'
    ),
    (
        'DT04',
        'HD-009',
        'SP09',
        N'Không vừa điện thoại',
        'tra_hang',
        'tu_choi'
    ),
    (
        'DT05',
        'HD-006',
        'SP06',
        N'Bút S-Pen bị gãy',
        'doi_hang',
        'cho_duyet'
    );

-- 10. FAQ - CÀI ĐẶT HỆ THỐNG - BANNER ---------------------------------------
INSERT INTO
    DanhMucFAQ (tenDanhMuc, thuTu, trangThai)
VALUES (N'Đơn hàng & Giao hàng', 1, 1),
    (
        N'Phương thức Thanh toán',
        2,
        1
    ),
    (N'Chính sách Bảo hành', 3, 1),
    (N'Đổi trả & Hoàn tiền', 4, 1),
    (N'Khách hàng Smember', 5, 1);

INSERT INTO
    CauHoiFAQ (
        maDanhMuc,
        cauHoi,
        traLoi,
        thuTu,
        trangThai
    )
VALUES (
        1,
        N'Thời gian giao nhận hàng trong bao lâu?',
        N'Blue-Tech áp dụng chương trình giao nhanh 2 giờ cho khu vực nội thành. Các khu vực khác nhận hàng trong 2-5 ngày làm việc.',
        1,
        1
    ),
    (
        2,
        N'Tôi có thể thanh toán bằng những hình thức nào?',
        N'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví điện tử (Momo, ZaloPay) và VNPay.',
        1,
        1
    ),
    (
        4,
        N'Sản phẩm đổi trả có chịu chi phí gì không?',
        N'Nếu sản phẩm bị lỗi kỹ thuật do nhà sản xuất trong vòng 30 ngày, quý khách được đổi trả miễn phí hoàn toàn.',
        1,
        1
    ),
    (
        3,
        N'Chính sách bảo hành Smember có ưu điểm gì?',
        N'Khách hàng Smember được ưu tiên xử lý bảo hành nhanh, hỗ trợ lấy máy tận nơi và được tặng thêm thời gian bảo hành.',
        1,
        1
    );

INSERT INTO
    CaiDatHeThong (
        id,
        tenCuaHang,
        diaChi,
        hotline,
        logo,
        moTa,
        phiMacDinh,
        nguongMienPhi,
        donViHoTro
    )
VALUES (
        1,
        N'ThiệnStore',
        N'TP.HCM',
        '19001234',
        NULL,
        N'',
        30000,
        500000,
        N'[{"ma":"GHTK","ten":"Giao Hàng Tiết Kiệm","mauLogo":"#00b14f"},{"ma":"GHN","ten":"Giao Hàng Nhanh","mauLogo":"#ff6600"},{"ma":"JT","ten":"J&T Express","mauLogo":"#e60012"},{"ma":"VTP","ten":"Viettel Post","mauLogo":"#ee0033"}]'
    );

INSERT INTO
    BannerQC (
        tenBanner,
        hinhAnh,
        duongDan,
        viTri,
        thuTu,
        trangThai,
        tieuDe,
        moTa,
        textNutBam
    )
VALUES (
        N'Khuyến mãi iPhone 18 Pro',
        'banner_iphone18pro.jpg',
        '/san-pham/iphone-18-pro',
        'slider_chinh',
        1,
        1,
        N'iPhone 18 Pro Siêu Đỉnh',
        N'Trải nghiệm sức mạnh vượt trội với chip A20 Bionic và camera chuyên nghiệp.',
        N'Nhận ưu đãi ngay'
    ),
    (
        N'Ra mắt Xiaomi 18 Pro Max',
        'banner_xiaomi18promax.jpg',
        '/san-pham/xiaomi-18-pro-max',
        'slider_chinh',
        2,
        1,
        N'Xiaomi 18 Pro Max Siêu Phẩm',
        N'Khám phá phiên bản Transparent Special Edition mới nhất.',
        N'Khám phá ngay'
    ),
    (
        N'Iphone Duo',
        'banner_iphone_duo.jpg',
        '/danh-muc/dien-thoai',
        'phu_tren',
        1,
        1,
        NULL,
        NULL,
        NULL
    ),
    (
        N'Tai nghe',
        'banner_tai_nghe.jpg',
        '/danh-muc/tai-nghe',
        'phu_duoi',
        1,
        1,
        NULL,
        NULL,
        NULL
    );

UPDATE SanPham
SET
    soLuongDanhGia = ISNULL(
        (
            SELECT COUNT(*)
            FROM DanhGiaSanPham
            WHERE
                DanhGiaSanPham.maSP = SanPham.maSP
        ),
        0
    ),
    diemDanhGiaTB = ISNULL(
        (
            SELECT ROUND(AVG(CAST(soSao AS FLOAT)), 1)
            FROM DanhGiaSanPham
            WHERE
                DanhGiaSanPham.maSP = SanPham.maSP
        ),
        0
    );

-- Gán dữ liệu mẫu cho các khóa ngoại mới
UPDATE CauHoiFAQ SET maNV = 'NV01';

UPDATE CaiDatHeThong SET maNV = 'NV01';

UPDATE BannerQC SET maNV = 'NV01';

UPDATE BannerQC
SET
    maSP = 'SP01'
WHERE
    tenBanner = N'Khuyến mãi iPhone 18 Pro';

UPDATE BannerQC
SET
    maKM = 'KM01'
WHERE
    tenBanner = N'Ra mắt Xiaomi 18 Pro Max';