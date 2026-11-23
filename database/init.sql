-- =====================================================================
-- KHOI TAO CO SO DU LIEU CHO HE THONG QUAN LY BAN HANG DIEN THOAI
-- Database: QuanLyBanHangDienThoai
-- =====================================================================

IF DB_ID(N'QuanLyBanHangDienThoai') IS NULL
BEGIN
    CREATE DATABASE [QuanLyBanHangDienThoai];
END;
GO

USE [QuanLyBanHangDienThoai];
GO

-- 1. BANG CHUC VU
IF OBJECT_ID(N'ChucVu', N'U') IS NULL
BEGIN
    CREATE TABLE ChucVu (
        maCV VARCHAR(20) PRIMARY KEY,
        tenCV NVARCHAR(100) NOT NULL,
        moTa NVARCHAR(255) NULL
    );
END;
GO

-- 2. BANG PHAN QUYEN
IF OBJECT_ID(N'PhanQuyen', N'U') IS NULL
BEGIN
    CREATE TABLE PhanQuyen (
        maCV VARCHAR(20) NOT NULL,
        maChucNang VARCHAR(50) NOT NULL,
        PRIMARY KEY (maCV, maChucNang)
    );
END;
GO

-- 3. BANG NHAN VIEN
IF OBJECT_ID(N'NhanVien', N'U') IS NULL
BEGIN
    CREATE TABLE NhanVien (
        maNV VARCHAR(20) PRIMARY KEY,
        hoTen NVARCHAR(100) NOT NULL,
        ngaySinh DATE NULL,
        gioiTinh NVARCHAR(10) NULL,
        diaChi NVARCHAR(255) NULL,
        SDT VARCHAR(20) NULL,
        email VARCHAR(100) NULL,
        avatar NVARCHAR(255) NULL,
        maCV VARCHAR(20) NULL,
        matKhau VARCHAR(255) NOT NULL,
        trangThai BIT DEFAULT 1
    );
END;
GO

-- 4. BANG KHACH HANG
IF OBJECT_ID(N'KhachHang', N'U') IS NULL
BEGIN
    CREATE TABLE KhachHang (
        maKH VARCHAR(20) PRIMARY KEY,
        hoTen NVARCHAR(100) NOT NULL,
        email VARCHAR(255) NULL,
        SDT VARCHAR(20) NULL,
        matKhau VARCHAR(255) NOT NULL,
        diemTichLuy INT DEFAULT 0,
        tongDonHang INT DEFAULT 0,
        trangThai BIT DEFAULT 1,
        ngayTao DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 5. BANG DIA CHI GIAO HANG
IF OBJECT_ID(N'DiaChiGiaoHang', N'U') IS NULL
BEGIN
    CREATE TABLE DiaChiGiaoHang (
        maDiaChi INT IDENTITY(1,1) PRIMARY KEY,
        maKH VARCHAR(20) NOT NULL,
        hoTenNguoiNhan NVARCHAR(100) NOT NULL,
        SDT VARCHAR(20) NOT NULL,
        diaChiChiTiet NVARCHAR(MAX) NOT NULL,
        macDinh BIT DEFAULT 0
    );
END;
GO

-- 6. BANG LOAI SAN PHAM
IF OBJECT_ID(N'LoaiSanPham', N'U') IS NULL
BEGIN
    CREATE TABLE LoaiSanPham (
        maLSP VARCHAR(20) PRIMARY KEY,
        tenLSP NVARCHAR(100) NOT NULL
    );
END;
GO

-- 7. BANG THUONG HIEU
IF OBJECT_ID(N'ThuongHieu', N'U') IS NULL
BEGIN
    CREATE TABLE ThuongHieu (
        maThuongHieu VARCHAR(20) PRIMARY KEY,
        tenThuongHieu NVARCHAR(100) NOT NULL,
        hinhAnh VARCHAR(500) NULL,
        trangThai BIT DEFAULT 1
    );
END;
GO

-- 8. BANG SAN PHAM
IF OBJECT_ID(N'SanPham', N'U') IS NULL
BEGIN
    CREATE TABLE SanPham (
        maSP VARCHAR(20) PRIMARY KEY,
        tenSP NVARCHAR(255) NOT NULL,
        hang NVARCHAR(100) NULL,
        maLSP VARCHAR(20) NULL,
        giaBan INT NOT NULL,
        tonKho INT DEFAULT 0,
        hinhAnh VARCHAR(500) NULL,
        trangThai BIT DEFAULT 1,
        badge NVARCHAR(100) NULL,
        tag NVARCHAR(100) NULL,
        diemDanhGiaTB FLOAT DEFAULT 0,
        soLuongDanhGia INT DEFAULT 0,
        moTa NVARCHAR(MAX) NULL
    );
END;
GO

-- 9. BANG BIEN THE SAN PHAM
IF OBJECT_ID(N'BienTheSanPham', N'U') IS NULL
BEGIN
    CREATE TABLE BienTheSanPham (
        maBienThe INT IDENTITY(1,1) PRIMARY KEY,
        maSP VARCHAR(20) NOT NULL,
        loaiBienThe VARCHAR(50) NOT NULL,
        giaTri NVARCHAR(100) NOT NULL,
        giaChenhLech INT DEFAULT 0,
        hinhAnh VARCHAR(500) NULL
    );
END;
GO

-- 10. BANG THONG SO KY THUAT
IF OBJECT_ID(N'ThongSoKyThuat', N'U') IS NULL
BEGIN
    CREATE TABLE ThongSoKyThuat (
        maThongSo INT IDENTITY(1,1) PRIMARY KEY,
        maSP VARCHAR(20) NOT NULL,
        nhan NVARCHAR(100) NOT NULL,
        giaTri NVARCHAR(255) NOT NULL
    );
END;
GO

-- 11. BANG HINH ANH SAN PHAM
IF OBJECT_ID(N'HinhAnhSanPham', N'U') IS NULL
BEGIN
    CREATE TABLE HinhAnhSanPham (
        maHinhAnh INT IDENTITY(1,1) PRIMARY KEY,
        maSP VARCHAR(20) NOT NULL,
        duongDan VARCHAR(500) NOT NULL
    );
END;
GO

-- 12. BANG GIO HANG
IF OBJECT_ID(N'GioHang', N'U') IS NULL
BEGIN
    CREATE TABLE GioHang (
        maGioHang INT IDENTITY(1,1) PRIMARY KEY,
        maKH VARCHAR(20) NOT NULL,
        maSP VARCHAR(20) NOT NULL,
        maBienThe VARCHAR(100) NULL,
        soLuong INT DEFAULT 1,
        hetHanLuc DATETIME NULL,
        dsMaBienThe VARCHAR(100) NULL
    );
END;
GO

-- 13. BANG KHUYEN MAI
IF OBJECT_ID(N'KhuyenMai', N'U') IS NULL
BEGIN
    CREATE TABLE KhuyenMai (
        maKM VARCHAR(20) PRIMARY KEY,
        tenKM NVARCHAR(200) NOT NULL,
        phanTram FLOAT DEFAULT 0,
        dieuKien NVARCHAR(100) NULL,
        ngayBD DATE NOT NULL,
        ngayKT DATE NOT NULL,
        trangThai BIT DEFAULT 1
    );
END;
GO

-- 14. BANG KHUNG GIO FLASH SALE
IF OBJECT_ID(N'KhungGioFlashSale', N'U') IS NULL
BEGIN
    CREATE TABLE KhungGioFlashSale (
        maKhungGio VARCHAR(20) PRIMARY KEY,
        gioBD TIME NOT NULL,
        gioKT TIME NOT NULL,
        ngayApDung DATE NOT NULL,
        trangThai NVARCHAR(50) DEFAULT 'sap_dien_ra',
        maKM VARCHAR(20) NULL
    );
END;
GO

-- 15. BANG SAN PHAM FLASH SALE
IF OBJECT_ID(N'SanPhamFlashSale', N'U') IS NULL
BEGIN
    CREATE TABLE SanPhamFlashSale (
        maKhungGio VARCHAR(20) NOT NULL,
        maSP VARCHAR(20) NOT NULL,
        giaFlashSale BIGINT NOT NULL,
        soLuongGioiHan INT NOT NULL,
        daBan INT DEFAULT 0,
        PRIMARY KEY (maKhungGio, maSP)
    );
END;
GO

-- 16. BANG HOA DON
IF OBJECT_ID(N'HoaDon', N'U') IS NULL
BEGIN
    CREATE TABLE HoaDon (
        maHoaDon VARCHAR(20) PRIMARY KEY,
        tongTien FLOAT DEFAULT 0,
        maKH VARCHAR(20) NULL,
        maNV VARCHAR(20) NULL,
        maKM VARCHAR(20) NULL,
        maDiaChi INT NULL,
        thoiGianLap DATETIME DEFAULT GETDATE(),
        trangThai NVARCHAR(50) DEFAULT 'cho_xac_nhan'
    );
END;
GO

-- 17. BANG CHI TIET HOA DON
IF OBJECT_ID(N'ChiTietHoaDon', N'U') IS NULL
BEGIN
    CREATE TABLE ChiTietHoaDon (
        maCTHD INT IDENTITY(1,1) PRIMARY KEY,
        maHoaDon VARCHAR(20) NOT NULL,
        maSP VARCHAR(20) NOT NULL,
        maBienThe VARCHAR(100) NULL,
        soLuong INT NOT NULL,
        giaBan FLOAT NOT NULL,
        tenPhanLoai NVARCHAR(200) NULL,
        dsMaBienThe VARCHAR(100) NULL
    );
END;
GO

-- 18. BANG THANH TOAN
IF OBJECT_ID(N'ThanhToan', N'U') IS NULL
BEGIN
    CREATE TABLE ThanhToan (
        maThanhToan VARCHAR(20) PRIMARY KEY,
        maHoaDon VARCHAR(20) NOT NULL,
        phuongThuc VARCHAR(30) DEFAULT 'cod',
        soTien FLOAT DEFAULT 0,
        trangThai NVARCHAR(50) DEFAULT 'cho_thanh_toan',
        thoiGian DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 19. BANG VAN CHUYEN
IF OBJECT_ID(N'VanChuyen', N'U') IS NULL
BEGIN
    CREATE TABLE VanChuyen (
        maVanChuyen VARCHAR(20) PRIMARY KEY,
        maHoaDon VARCHAR(20) NOT NULL,
        donViVanChuyen NVARCHAR(100) NULL,
        maVanDon VARCHAR(50) NULL,
        phiVanChuyen INT DEFAULT 0,
        trangThai NVARCHAR(50) DEFAULT 'cho_lay_hang',
        ngayGiaoDuKien DATE NULL
    );
END;
GO

-- 20. BANG DOI TRA HANG
IF OBJECT_ID(N'DoiTraHang', N'U') IS NULL
BEGIN
    CREATE TABLE DoiTraHang (
        maDoiTra VARCHAR(20) PRIMARY KEY,
        maHoaDon VARCHAR(20) NOT NULL,
        maSP VARCHAR(20) NOT NULL,
        lyDo NVARCHAR(MAX) NULL,
        loaiYeuCau NVARCHAR(50) NOT NULL,
        trangThai NVARCHAR(50) DEFAULT 'cho_xu_ly',
        ngayTao DATETIME DEFAULT GETDATE(),
        hinhAnh VARCHAR(500) NULL,
        hinhThucGiaiQuyet NVARCHAR(255) NULL,
        ghiChuNoiBo NVARCHAR(MAX) NULL,
        maNV VARCHAR(20) NULL
    );
END;
GO

-- 21. BANG DANH GIA SAN PHAM
IF OBJECT_ID(N'DanhGiaSanPham', N'U') IS NULL
BEGIN
    CREATE TABLE DanhGiaSanPham (
        maDanhGia INT IDENTITY(1,1) PRIMARY KEY,
        maSP VARCHAR(20) NOT NULL,
        maKH VARCHAR(20) NOT NULL,
        soSao INT DEFAULT 5,
        noiDung NVARCHAR(MAX) NULL,
        daMuaHang BIT DEFAULT 1,
        ngayTao DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 22. BANG HINH ANH DANH GIA
IF OBJECT_ID(N'HinhAnhDanhGia', N'U') IS NULL
BEGIN
    CREATE TABLE HinhAnhDanhGia (
        maHinhAnh INT IDENTITY(1,1) PRIMARY KEY,
        maDanhGia INT NOT NULL,
        duongDan VARCHAR(500) NOT NULL
    );
END;
GO

-- 23. BANG PHAN HOI DANH GIA
IF OBJECT_ID(N'PhanHoiDanhGia', N'U') IS NULL
BEGIN
    CREATE TABLE PhanHoiDanhGia (
        maPhanHoi INT IDENTITY(1,1) PRIMARY KEY,
        maDanhGia INT NOT NULL,
        maNV VARCHAR(20) NOT NULL,
        noiDung NVARCHAR(MAX) NOT NULL,
        ngayTao DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 24. BANG SAN PHAM YEU THICH
IF OBJECT_ID(N'SanPhamYeuThich', N'U') IS NULL
BEGIN
    CREATE TABLE SanPhamYeuThich (
        maKH VARCHAR(20) NOT NULL,
        maSP VARCHAR(20) NOT NULL,
        ngayThem DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (maKH, maSP)
    );
END;
GO

-- 25. BANG NHA CUNG CAP
IF OBJECT_ID(N'NhaCungCap', N'U') IS NULL
BEGIN
    CREATE TABLE NhaCungCap (
        maNCC VARCHAR(20) PRIMARY KEY,
        tenNCC NVARCHAR(255) NOT NULL,
        diaChi NVARCHAR(255) NULL,
        SDT VARCHAR(20) NULL,
        trangThai BIT DEFAULT 1
    );
END;
GO

-- 26. BANG LO HANG
IF OBJECT_ID(N'LoHang', N'U') IS NULL
BEGIN
    CREATE TABLE LoHang (
        maLoHang VARCHAR(20) PRIMARY KEY,
        maSP VARCHAR(20) NOT NULL,
        hanSuDung DATE NULL,
        ngayNhap DATE DEFAULT CAST(GETDATE() AS DATE)
    );
END;
GO

-- 27. BANG PHIEU NHAP
IF OBJECT_ID(N'PhieuNhap', N'U') IS NULL
BEGIN
    CREATE TABLE PhieuNhap (
        maPN VARCHAR(20) PRIMARY KEY,
        ngayLap DATE DEFAULT CAST(GETDATE() AS DATE),
        gioLap TIME DEFAULT CAST(GETDATE() AS TIME),
        tongTien DECIMAL(15,2) DEFAULT 0,
        maNCC VARCHAR(20) NULL,
        maNV VARCHAR(20) NULL,
        trangThai NVARCHAR(50) DEFAULT 'hoan_tat'
    );
END;
GO

-- 28. BANG CHI TIET PHIEU NHAP
IF OBJECT_ID(N'ChiTietPhieuNhap', N'U') IS NULL
BEGIN
    CREATE TABLE ChiTietPhieuNhap (
        maPN VARCHAR(20) NOT NULL,
        maLoHang VARCHAR(20) NOT NULL,
        soLuong INT NOT NULL,
        giaNhap DECIMAL(15,2) NOT NULL,
        PRIMARY KEY (maPN, maLoHang)
    );
END;
GO

-- 29. BANG CHAM CONG
IF OBJECT_ID(N'ChamCong', N'U') IS NULL
BEGIN
    CREATE TABLE ChamCong (
        maChamCong INT IDENTITY(1,1) PRIMARY KEY,
        maNV VARCHAR(20) NOT NULL,
        thoiGianChamCong DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 30. BANG LUONG
IF OBJECT_ID(N'Luong', N'U') IS NULL
BEGIN
    CREATE TABLE Luong (
        maLuong VARCHAR(20) PRIMARY KEY,
        maNV VARCHAR(20) NOT NULL,
        tongNgayCong INT DEFAULT 0,
        luongCoBan BIGINT DEFAULT 0,
        luongThuong BIGINT DEFAULT 0,
        luongThucNhan BIGINT DEFAULT 0,
        thangNam VARCHAR(20) NULL
    );
END;
GO

-- 31. BANG CAI DAT HE THONG
IF OBJECT_ID(N'CaiDatHeThong', N'U') IS NULL
BEGIN
    CREATE TABLE CaiDatHeThong (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tenCuaHang NVARCHAR(255),
        diaChi NVARCHAR(255),
        hotline VARCHAR(20),
        logo VARCHAR(500),
        moTa NVARCHAR(MAX),
        phiMacDinh INT DEFAULT 30000,
        nguongMienPhi INT DEFAULT 500000,
        donViHoTro NVARCHAR(MAX)
    );
END;
GO

-- 32. BANG BANNER QC
IF OBJECT_ID(N'BannerQC', N'U') IS NULL
BEGIN
    CREATE TABLE BannerQC (
        maBanner INT IDENTITY(1,1) PRIMARY KEY,
        tenBanner NVARCHAR(255),
        hinhAnh VARCHAR(500),
        duongDan VARCHAR(500),
        viTri VARCHAR(50),
        thuTu INT DEFAULT 1,
        trangThai BIT DEFAULT 1,
        tieuDe NVARCHAR(255) NULL,
        moTa NVARCHAR(MAX) NULL,
        textNutBam NVARCHAR(100) NULL
    );
END;
GO

-- 33. BANG DANH MUC FAQ
IF OBJECT_ID(N'DanhMucFAQ', N'U') IS NULL
BEGIN
    CREATE TABLE DanhMucFAQ (
        maDanhMuc INT IDENTITY(1,1) PRIMARY KEY,
        tenDanhMuc NVARCHAR(255),
        thuTu INT DEFAULT 1,
        trangThai BIT DEFAULT 1
    );
END;
GO

-- 34. BANG CAU HOI FAQ
IF OBJECT_ID(N'CauHoiFAQ', N'U') IS NULL
BEGIN
    CREATE TABLE CauHoiFAQ (
        maCauHoi INT IDENTITY(1,1) PRIMARY KEY,
        maDanhMuc INT,
        cauHoi NVARCHAR(MAX),
        traLoi NVARCHAR(MAX),
        thuTu INT DEFAULT 1,
        trangThai BIT DEFAULT 1,
        linkLienQuan NVARCHAR(MAX) NULL,
        anhLienQuan NVARCHAR(MAX) NULL
    );
END;
GO

-- =====================================================================
-- NẠP DỮ LIỆU MẪU (SEED DATA)
-- =====================================================================

-- 1. CHUC VU
IF NOT EXISTS (SELECT 1 FROM ChucVu WHERE maCV = 'CV01')
BEGIN
    INSERT INTO ChucVu (maCV, tenCV, moTa) VALUES
    ('CV01', N'Giám đốc', N'Toàn quyền quản trị hệ thống'),
    ('CV02', N'Quản lý', N'Quản lý đơn hàng, kho và nhân sự'),
    ('CV03', N'Nhân viên bán hàng', N'Tư vấn và xử lý đơn hàng'),
    ('CV04', N'Nhân viên kho', N'Quản lý xuất nhập tồn kho');
END;
GO

-- 2. PHAN QUYEN
IF NOT EXISTS (SELECT 1 FROM PhanQuyen WHERE maCV = 'CV01')
BEGIN
    INSERT INTO PhanQuyen (maCV, maChucNang) VALUES
    ('CV01', 'tong_quan'), ('CV01', 'san_pham'), ('CV01', 'don_hang'), ('CV01', 'khach_hang'),
    ('CV01', 'nhan_su'), ('CV01', 'kho_hang'), ('CV01', 'marketing'), ('CV01', 'danh_gia'),
    ('CV01', 'ho_tro'), ('CV01', 'he_thong'),
    ('CV02', 'tong_quan'), ('CV02', 'san_pham'), ('CV02', 'don_hang'), ('CV02', 'khach_hang'),
    ('CV02', 'kho_hang'), ('CV02', 'danh_gia'),
    ('CV03', 'san_pham'), ('CV03', 'don_hang'), ('CV03', 'danh_gia'),
    ('CV04', 'kho_hang'), ('CV04', 'san_pham');
END;
GO

-- 3. NHAN VIEN (Mật khẩu mặc định: 123456 - tự động bcrypt khi đăng nhập lần đầu)
IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE maNV = 'NV01')
BEGIN
    INSERT INTO NhanVien (maNV, hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai) VALUES
    ('NV01', N'Quản trị viên', '1995-01-01', N'Nam', N'Hà Nội', '0900000001', 'admin@store.com', 'CV01', '123456', 1),
    ('NV02', N'Nguyễn Văn Quản Lý', '1996-05-10', N'Nam', N'TP. Hồ Chí Minh', '0900000002', 'quanly@store.com', 'CV02', '123456', 1),
    ('NV03', N'Trần Thị Bán Hàng', '1998-09-20', N'Nữ', N'Đà Nẵng', '0900000003', 'banhang@store.com', 'CV03', '123456', 1);
END;
GO

-- 4. KHACH HANG (Mật khẩu mặc định: 123456)
IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE maKH = 'KH000001')
BEGIN
    INSERT INTO KhachHang (maKH, hoTen, email, SDT, matKhau, diemTichLuy, tongDonHang, trangThai) VALUES
    ('KH000001', N'Nguyễn Văn A', 'user@gmail.com', '0912345678', '123456', 120, 3, 1),
    ('KH000002', N'Lê Thị Thu Thảo', 'thuthao@gmail.com', '0987654321', '123456', 50, 1, 1);
END;
GO

-- 5. DIA CHI GIAO HANG
IF NOT EXISTS (SELECT 1 FROM DiaChiGiaoHang WHERE maKH = 'KH000001')
BEGIN
    INSERT INTO DiaChiGiaoHang (maKH, hoTenNguoiNhan, SDT, diaChiChiTiet, macDinh) VALUES
    ('KH000001', N'Nguyễn Văn A', '0912345678', N'Số 12 ngõ 34 Cầu Giấy, Hà Nội', 1),
    ('KH000002', N'Lê Thị Thu Thảo', '0987654321', N'456 Lê Duẩn, Quận 1, TP. Hồ Chí Minh', 1);
END;
GO

-- 6. LOAI SAN PHAM
IF NOT EXISTS (SELECT 1 FROM LoaiSanPham WHERE maLSP = 'LSP01')
BEGIN
    INSERT INTO LoaiSanPham (maLSP, tenLSP) VALUES
    ('LSP01', N'Điện thoại'),
    ('LSP02', N'Tablet'),
    ('LSP03', N'Phụ kiện');
END;
GO

-- 7. THUONG HIEU
IF NOT EXISTS (SELECT 1 FROM ThuongHieu WHERE maThuongHieu = 'TH01')
BEGIN
    INSERT INTO ThuongHieu (maThuongHieu, tenThuongHieu, hinhAnh, trangThai) VALUES
    ('TH01', N'Apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', 1),
    ('TH02', N'Samsung', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg', 1),
    ('TH03', N'Xiaomi', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg', 1),
    ('TH04', N'Oppo', 'https://upload.wikimedia.org/wikipedia/commons/b/b8/OPPO_Logo.svg', 1);
END;
GO

-- 8. SAN PHAM
IF NOT EXISTS (SELECT 1 FROM SanPham WHERE maSP = 'SP000001')
BEGIN
    INSERT INTO SanPham (maSP, tenSP, hang, maLSP, giaBan, tonKho, hinhAnh, trangThai, badge, tag, diemDanhGiaTB, soLuongDanhGia, moTa) VALUES
    ('SP000001', N'iPhone 15 Pro Max 256GB', N'Apple', 'LSP01', 29990000, 50, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', 1, N'Hot', N'Titan tự nhiên', 4.9, 28, N'Siêu phẩm iPhone 15 Pro Max vỏ Titan chuẩn hàng không vũ trụ, chip A17 Pro mạnh mẽ vượt trội.'),
    ('SP000002', N'iPhone 16 Pro Max 256GB', N'Apple', 'LSP01', 34990000, 40, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600', 1, N'Mới ra mắt', N'Apple Intelligence', 5.0, 15, N'iPhone 16 Pro Max với nút Camera Control hoàn toàn mới cùng sức mạnh AI của chip A18 Pro.'),
    ('SP000003', N'Samsung Galaxy S24 Ultra 256GB', N'Samsung', 'LSP01', 28490000, 45, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', 1, N'Galaxy AI', N'Bút S-Pen', 4.8, 32, N'Galaxy S24 Ultra trang bị trợ lý quyền năng Galaxy AI, camera zoom 100x và khung viền Titan siêu bền.'),
    ('SP000004', N'Samsung Galaxy Z Fold6 256GB', N'Samsung', 'LSP01', 41990000, 20, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600', 1, N'Gập mở', N'Màn hình lớn', 4.7, 12, N'Galaxy Z Fold6 thiết kế siêu mỏng nhẹ, tối ưu trải nghiệm đa nhiệm với màn hình gập đỉnh cao.'),
    ('SP000005', N'Xiaomi 14 Ultra 512GB', N'Xiaomi', 'LSP01', 26990000, 30, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600', 1, N'Leica Camera', N'Chụp ảnh đỉnh', 4.8, 19, N'Xiaomi 14 Ultra hợp tác huyền thoại cùng Leica đem đến cụm 4 camera 50MP cảm biến 1 inch.'),
    ('SP000006', N'Oppo Find X7 Ultra 256GB', N'Oppo', 'LSP01', 21990000, 25, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', 1, N'Hasselblad', N'Sạc siêu nhanh', 4.6, 9, N'Oppo Find X7 Ultra cụm camera kép tiềm vọng đầu tiên trên thế giới, màu sắc Hasselblad tuyệt mỹ.'),
    ('SP000007', N'iPad Pro M4 11 inch 256GB Wi-Fi', N'Apple', 'LSP02', 27990000, 18, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600', 1, N'Chip M4', N'Màn Ultra Retina', 4.9, 14, N'iPad Pro M4 siêu mỏng 5.1mm, màn hình OLED 2 lớp đỉnh cao cho người làm sáng tạo chuyên nghiệp.'),
    ('SP000008', N'Tai nghe Apple AirPods Pro 2 Type-C', N'Apple', 'LSP03', 5790000, 60, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600', 1, N'Chống ồn', N'Cổng Type-C', 4.9, 45, N'AirPods Pro 2 trang bị chip H2, khử tiếng ồn chủ động gấp 2 lần và âm thanh thích ứng.');
END;
GO

-- 9. BIEN THE SAN PHAM
IF NOT EXISTS (SELECT 1 FROM BienTheSanPham WHERE maSP = 'SP000001')
BEGIN
    INSERT INTO BienTheSanPham (maSP, loaiBienThe, giaTri, giaChenhLech, hinhAnh) VALUES
    ('SP000001', 'dungluong', '256GB', 0, NULL),
    ('SP000001', 'dungluong', '512GB', 4000000, NULL),
    ('SP000001', 'mausac', N'Titan Tự Nhiên', 0, NULL),
    ('SP000001', 'mausac', N'Titan Đen', 0, NULL),
    ('SP000002', 'dungluong', '256GB', 0, NULL),
    ('SP000002', 'dungluong', '512GB', 5000000, NULL),
    ('SP000002', 'mausac', N'Titan Sa Mạc', 0, NULL),
    ('SP000003', 'dungluong', '256GB', 0, NULL),
    ('SP000003', 'dungluong', '512GB', 3500000, NULL),
    ('SP000003', 'mausac', N'Titan Xám', 0, NULL);
END;
GO

-- 10. THONG SO KY THUAT
IF NOT EXISTS (SELECT 1 FROM ThongSoKyThuat WHERE maSP = 'SP000001')
BEGIN
    INSERT INTO ThongSoKyThuat (maSP, nhan, giaTri) VALUES
    ('SP000001', N'RAM', N'8GB'),
    ('SP000001', N'ROM / Bộ nhớ trong', N'256GB'),
    ('SP000001', N'Màn hình', N'6.7 inch, Super Retina XDR OLED 120Hz'),
    ('SP000001', N'Chip xử lý (CPU)', N'Apple A17 Pro (3nm)'),
    ('SP000001', N'Camera sau', N'Chính 48MP, Siêu rộng 12MP, Tele 5x 12MP'),
    ('SP000001', N'Pin & Sạc', N'4422 mAh, Sạc nhanh 20W, MagSafe 15W'),
    ('SP000002', N'RAM', N'8GB'),
    ('SP000002', N'ROM / Bộ nhớ trong', N'256GB'),
    ('SP000002', N'Màn hình', N'6.9 inch, Super Retina XDR OLED 120Hz'),
    ('SP000002', N'Chip xử lý (CPU)', N'Apple A18 Pro'),
    ('SP000003', N'RAM', N'12GB'),
    ('SP000003', N'ROM / Bộ nhớ trong', N'256GB'),
    ('SP000003', N'Màn hình', N'6.8 inch, Dynamic AMOLED 2X, Quad HD+ 120Hz'),
    ('SP000003', N'Chip xử lý (CPU)', N'Snapdragon 8 Gen 3 for Galaxy');
END;
GO

-- 11. KHUYEN MAI
IF NOT EXISTS (SELECT 1 FROM KhuyenMai WHERE maKM = 'KM000001')
BEGIN
    INSERT INTO KhuyenMai (maKM, tenKM, phanTram, dieuKien, ngayBD, ngayKT, trangThai) VALUES
    ('KM000001', N'Siêu Sale Điện Thoại Mới', 10, '0', '2026-01-01', '2028-12-31', 1),
    ('KM000002', N'Mã Chào Bạn Mới', 5, '0', '2026-01-01', '2028-12-31', 1);
END;
GO

-- 12. KHUNG GIO FLASH SALE & SAN PHAM FLASH SALE
IF NOT EXISTS (SELECT 1 FROM KhungGioFlashSale WHERE maKhungGio = 'KG0001')
BEGIN
    INSERT INTO KhungGioFlashSale (maKhungGio, gioBD, gioKT, ngayApDung, trangThai, maKM) VALUES
    ('KG0001', '00:00:00', '23:59:59', CAST(GETDATE() AS DATE), 'dang_dien_ra', 'KM000001');

    INSERT INTO SanPhamFlashSale (maKhungGio, maSP, giaFlashSale, soLuongGioiHan, daBan) VALUES
    ('KG0001', 'SP000001', 26990000, 20, 5),
    ('KG0001', 'SP000003', 25490000, 15, 3);
END;
GO

-- 13. CAI DAT HE THONG
IF NOT EXISTS (SELECT 1 FROM CaiDatHeThong WHERE id = 1)
BEGIN
    INSERT INTO CaiDatHeThong (tenCuaHang, diaChi, hotline, logo, moTa, phiMacDinh, nguongMienPhi, donViHoTro) VALUES
    (N'ThienStore - Thế Giới Smartphone', N'123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh', '0981918724', '/images/logo.jpg', N'Hệ thống bán lẻ điện thoại và thiết bị công nghệ chính hãng hàng đầu Việt Nam.', 30000, 500000, N'["Giao Hàng Nhanh", "Viettel Post", "J&T Express", "Hỏa Tốc 2H"]');
END;
GO

-- 14. BANNER QC
IF NOT EXISTS (SELECT 1 FROM BannerQC WHERE maBanner = 1)
BEGIN
    INSERT INTO BannerQC (tenBanner, hinhAnh, duongDan, viTri, thuTu, trangThai, tieuDe, moTa, textNutBam) VALUES
    (N'Banner iPhone 16 Pro Max', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200', '/san-pham/SP000002', 'home_top', 1, 1, N'iPhone 16 Pro Max', N'Đỉnh cao công nghệ Apple Intelligence - Đặt mua ngay', N'Mua ngay'),
    (N'Banner Galaxy S24 Ultra', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200', '/san-pham/SP000003', 'home_top', 2, 1, N'Galaxy S24 Ultra', N'Kỷ nguyên quyền năng Galaxy AI trong tầm tay', N'Khám phá');
END;
GO

-- 15. DANH MUC & CAU HOI FAQ
IF NOT EXISTS (SELECT 1 FROM DanhMucFAQ WHERE maDanhMuc = 1)
BEGIN
    INSERT INTO DanhMucFAQ (tenDanhMuc, thuTu, trangThai) VALUES
    (N'Mua hàng & Thanh toán', 1, 1),
    (N'Vận chuyển & Giao nhận', 2, 1),
    (N'Bảo hành & Đổi trả', 3, 1);

    INSERT INTO CauHoiFAQ (maDanhMuc, cauHoi, traLoi, thuTu, trangThai) VALUES
    (1, N'Cửa hàng có chấp nhận thanh toán MoMo không?', N'Cửa hàng hỗ trợ thanh toán MoMo, VNPAY, Thẻ và COD nhận hàng.', 1, 1),
    (1, N'Cửa hàng có chính sách trả góp 0% không?', N'Có, hỗ trợ trả góp 0% qua thẻ tín dụng và các công ty tài chính.', 2, 1),
    (2, N'Phí vận chuyển được tính thế nào?', N'Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên, dưới 500.000đ phí giao là 30.000đ.', 1, 1),
    (3, N'Chính sách bảo hành sản phẩm ra sao?', N'Toàn bộ sản phẩm được bảo hành chính hãng từ 12 đến 24 tháng theo đúng tiêu chuẩn nhà sản xuất.', 1, 1);
END;
GO

-- 16. NHA CUNG CAP
IF NOT EXISTS (SELECT 1 FROM NhaCungCap WHERE maNCC = 'NCC01')
BEGIN
    INSERT INTO NhaCungCap (maNCC, tenNCC, diaChi, SDT, trangThai) VALUES
    ('NCC01', N'Apple Việt Nam', N'Tòa nhà Deutsches Haus, Quận 1, TP. HCM', '18001127', 1),
    ('NCC02', N'Samsung Vina Electronics', N'Tòa nhà Bitexco, Quận 1, TP. HCM', '1800588889', 1),
    ('NCC03', N'FPT Synnex', N'Tòa nhà FPT Cầu Giấy, Hà Nội', '02473006666', 1);
END;
GO
