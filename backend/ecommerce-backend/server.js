const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

//thanh toan
const crypto = require('crypto');
const axios = require('axios');

// Doc khoa MoMo tu file .env (can: npm install dotenv). Neu chua cai thi bo qua, doc tu bien moi truong he thong.
try { require('dotenv').config(); } catch (e) { console.warn('Chua cai dotenv - khong doc duoc file .env (npm install dotenv)'); }

 

// hasing mat khau
const bcrypt = require('bcrypt');

const app = express();
const router = express.Router();
app.use(cors()); // Cho phép Frontend gọi API thoải mái
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

// ============== CẤU HÌNH UPLOAD ẢNH (multer) - PHẦN BỊ THIẾU ==============
// Lưu ảnh vào thư mục uploads/, đặt tên file tránh trùng nhau
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ten = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, ten);
    },
});
const upload = multer({ storage });

// Cho phép truy cập ảnh đã upload qua URL, VD: http://localhost:8080/uploads/xxx.jpg
app.use('/uploads', express.static('uploads'));

// Hàm dựng URL đầy đủ cho ảnh, để frontend <img src={...}> dùng được luôn
const layUrlAnh = (tenFile) => (tenFile ? `http://localhost:8080/uploads/${tenFile}` : null);
// ===========================================================================

// 1. Cấu hình kết nối SQL Server
const dbConfig = {
    user: 'sa',  
    password: '123456',  
    server: 'LAPTOP-THIEN123',
    database: 'QuanLyBanHangDienThoai',
    port: 1435,
    options: {
        instanceName: 'MSSQLSERVER01',
        encrypt: false,
        trustServerCertificate: true  
    }
};

// 2. Viết API Lấy danh sách danh mục (GET)
app.get('/api/categories', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM Categories');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi Database: ", err);
        res.status(500).send("Lỗi kết nối máy chủ");
    }
});


// ================================================= ADMIN ========================================
// ================= LẤY DANH SÁCH KHÁCH HÀNG & ĐẾM TỔNG ĐƠN HÀNG =================
app.get('/api/khachhang', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);

        // Sử dụng LEFT JOIN và COUNT để đếm số hóa đơn của từng khách hàng
        let result = await pool.request().query(`
            SELECT 
                kh.maKH, 
                kh.hoTen, 
                kh.SDT, 
                kh.email, 
                kh.diemTichLuy, 
                kh.trangThai,
                COUNT(hd.maHoaDon) AS tongDonHang
            FROM KhachHang kh
            LEFT JOIN HoaDon hd ON kh.maKH = hd.maKH
            GROUP BY 
                kh.maKH, kh.hoTen, kh.SDT, kh.email, kh.diemTichLuy, kh.trangThai
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách khách hàng:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});


// ================= SỬA THÔNG TIN & TRẠNG THÁI KHÁCH HÀNG =================
app.put('/api/khachhang/sua/:maKH', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH } = req.params;  
        const { hoTen, SDT, trangThai } = req.body;  

        // Ép kiểu trangThai về dạng Bit (1 hoặc 0) cho SQL Server
        const trangThaiBit = (trangThai === true || trangThai === "true") ? 1 : 0;

        await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('hoTen', sql.NVarChar(100), hoTen)
            .input('SDT', sql.VarChar(20), SDT)
            .input('trangThai', sql.Bit, trangThaiBit)
            .query(`
                UPDATE KhachHang 
                SET hoTen = @hoTen, SDT = @SDT, trangThai = @trangThai 
                WHERE maKH = @maKH
            `);

        res.json({ success: true, message: "Cập nhật thông tin khách hàng thành công!" });
    } catch (err) {
        console.error("Lỗi khi cập nhật khách hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// ====================== HOA DON (ADMIN) ==========
app.get('/api/hoadon', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT hd.maHoaDon, hd.tongTien, hd.thoiGianLap, hd.trangThai,
                   ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS tenKhachHang,
                   ISNULL(kh.SDT, dc.SDT) AS soDienThoai
            FROM HoaDon hd
            LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
            LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
            ORDER BY hd.thoiGianLap DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("CHI TIẾT LỖI KẾT NỐI DB:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});


// ======================= CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ADMIN) ===========================
// ================= CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG & CỘNG ĐIỂM KHÁCH HÀNG =================

app.put('/api/hoadon/capnhat-trangthai/:maHoaDon', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maHoaDon } = req.params;
        const { trangThai } = req.body;

        // TÌM TRẠNG THÁI CŨ CỦA ĐƠN HÀNG TRƯỚC KHI CẬP NHẬT
        let hdCuResult = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query("SELECT maKH, tongTien, trangThai AS trangThaiCu FROM HoaDon WHERE maHoaDon = @maHoaDon");

        if (hdCuResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });
        }

        const hd = hdCuResult.recordset[0];
        const trangThaiCu = hd.trangThaiCu;

        // CẬP NHẬT TRẠNG THÁI MỚI VÀO CƠ SỞ DỮ LIỆU
        await pool.request()
            .input('trangThai', sql.VarChar, trangThai)
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query("UPDATE HoaDon SET trangThai = @trangThai WHERE maHoaDon = @maHoaDon");

        //   LOGIC TÍCH ĐIỂM THÔNG MINH
        if (hd.maKH) {
            const diemThayDoi = Math.floor(hd.tongTien / 100000);

            //  Đơn hàng MỚI chuyển sang Hoàn tất -> Cộng điểm
            if (trangThai === 'hoan_tat' && trangThaiCu !== 'hoan_tat') {
                if (diemThayDoi > 0) {
                    await pool.request()
                        .input('diemCong', sql.Int, diemThayDoi)
                        .input('maKH', sql.VarChar, hd.maKH)
                        .query("UPDATE KhachHang SET diemTichLuy = ISNULL(diemTichLuy, 0) + @diemCong WHERE maKH = @maKH");
                }
            }

            // TH2: Lỡ tay chuyển từ Hoàn tất về trạng thái khác -> Trừ lại điểm đã cộng
            if (trangThaiCu === 'hoan_tat' && trangThai !== 'hoan_tat') {
                if (diemThayDoi > 0) {
                    await pool.request()
                        .input('diemTru', sql.Int, diemThayDoi)
                        .input('maKH', sql.VarChar, hd.maKH)
                        .query("UPDATE KhachHang SET diemTichLuy = ISNULL(diemTichLuy, 0) - @diemTru WHERE maKH = @maKH");
                }
            }
        }


        await pool.request()
            .input('maKH', sql.VarChar, hd.maKH)
            .query(`
                UPDATE KhachHang 
                SET tongDonHang = (SELECT COUNT(*) FROM HoaDon WHERE maKH = @maKH)
                WHERE maKH = @maKH
            `);

        res.json({ success: true, message: "Cập nhật trạng thái thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật trạng thái:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ============================== DANG NHAP ===========================
// ============================== DANG NHAP (ADMIN) ===========================
app.post('/api/admin/dang-nhap', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        // Đã sửa: Nhận 'taiKhoan' thay vì 'sdt'
        let { taiKhoan, matKhau } = req.body;

        // 1. Tìm tài khoản theo SĐT, Email hoặc Mã nhân viên
        let queryStr = `
            SELECT maNV, hoTen, maCV, trangThai, matKhau 
            FROM NhanVien 
            WHERE SDT = @taiKhoan OR email = @taiKhoan OR maNV = @taiKhoan
        `;
        let result = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query(queryStr);

        if (result.recordset.length === 0) {
            // Đã sửa: Câu thông báo chung chung và chính xác hơn
            return res.status(401).json({ success: false, message: "Tài khoản không chính xác!" });
        }

        let user = result.recordset[0];
        let isMatch = false;

        // 2. KIỂM TRA MẬT KHẨU THÔNG MINH (Hỗ trợ cả pass cũ và pass đã băm)
        if (user.matKhau && (user.matKhau.startsWith('$2a$') || user.matKhau.startsWith('$2b$'))) {
            // Trường hợp 1: Mật khẩu ĐÃ BĂM
            isMatch = await bcrypt.compare(matKhau, user.matKhau);
        } else {
            // Trường hợp 2: Mật khẩu CHƯA BĂM (Tài khoản cũ trong DB)
            isMatch = (matKhau === user.matKhau);

            // NẾU ĐĂNG NHẬP ĐÚNG -> TỰ ĐỘNG BĂM VÀ LƯU ĐÈ VÀO DB ĐỂ NÂNG CẤP BẢO MẬT!
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedMatKhau = await bcrypt.hash(matKhau, salt);
                
                await pool.request()
                    .input('maNV', sql.VarChar, user.maNV)
                    .input('matKhauMoi', sql.VarChar, hashedMatKhau)
                    .query(`UPDATE NhanVien SET matKhau = @matKhauMoi WHERE maNV = @maNV`);
            }
        }

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Mật khẩu không chính xác!" });
        }

        // 3. Kiểm tra trạng thái khóa
        if (user.trangThai == 0) {
            return res.status(403).json({ success: false, message: "Tài khoản bị khóa!" });
        }

        // Xóa thuộc tính mật khẩu khỏi object trước khi gửi về React cho an toàn
        delete user.matKhau; 
        res.status(200).json({ success: true, adminInfo: user });
    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        res.status(500).json({ success: false, message: "Lỗi máy chủ: " + err.message });
    }
});

app.post('/api/nhanvien/tao-tai-khoan', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let { thongTinMoi, maChucVuNguoiThaoTac } = req.body;

        if (maChucVuNguoiThaoTac !== 'CV01' && maChucVuNguoiThaoTac !== 'CV02') {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền cấp tài khoản!"
            });
        }

        // Băm mật khẩu mặc định (ví dụ: '123456')
        const salt = await bcrypt.genSalt(10);
        const hashedMatKhau = await bcrypt.hash('123456', salt);

        let queryStr = `
            INSERT INTO NhanVien (maNV, hoTen, SDT, matKhau, maCV, trangThai)
            VALUES (@maNV, @hoTen, @SDT, @matKhau, @maCV, 1)
        `;

        await pool.request()
            .input('maNV', sql.VarChar, thongTinMoi.maNV)
            .input('hoTen', sql.NVarChar, thongTinMoi.hoTen)
            .input('SDT', sql.VarChar, thongTinMoi.sdt)
            .input('matKhau', sql.VarChar, hashedMatKhau) // Lưu mật khẩu đã băm
            .input('maCV', sql.VarChar, thongTinMoi.maCV)
            .query(queryStr);

        res.status(200).json({ success: true, message: "Cấp tài khoản thành công!" });
    } catch (err) {
        res.status(500).send("Lỗi server: " + err.message);
    }
});

app.get('/api/hoadon/toanbo', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);

        let queryStr = `
            WITH TongSoLuongHD AS (
                SELECT maHoaDon, SUM(CAST(soLuong AS INT)) AS tongSoLuongSP
                FROM ChiTietHoaDon
                GROUP BY maHoaDon
            )
            SELECT 
                h.maHoaDon, 
                h.tongTien, 
                FORMAT(h.thoiGianLap, 'dd/MM/yyyy') AS thoiGianLap, -- ÉP KIỂU NGÀY THÁNG TẠI ĐÂY
                h.trangThai,
                k.hoTen AS tenKhachHang, 
                k.SDT AS sdtKhachHang,
                nv.hoTen AS tenNhanVien,
                ISNULL(tsl.tongSoLuongSP, 0) AS tongSoLuongSP,
                (
                    SELECT TOP 1 sp.tenSP 
                    FROM ChiTietHoaDon ct 
                    JOIN SanPham sp ON ct.maSP = sp.maSP 
                    WHERE ct.maHoaDon = h.maHoaDon
                ) AS tenSanPham,
                (
                    SELECT TOP 1 ha.duongDan 
                    FROM ChiTietHoaDon ct 
                    JOIN HinhAnhSanPham ha ON ct.maSP = ha.maSP 
                    WHERE ct.maHoaDon = h.maHoaDon
                ) AS img
            FROM HoaDon h
            LEFT JOIN KhachHang k ON h.maKH = k.maKH
            LEFT JOIN NhanVien nv ON h.maNV = nv.maNV
            LEFT JOIN TongSoLuongHD tsl ON h.maHoaDon = tsl.maHoaDon
            ORDER BY h.thoiGianLap DESC
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách hóa đơn:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// DANH SACH NHAN VIEN
app.get('/api/nhanvien', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT 
                nv.maNV, nv.hoTen, nv.ngaySinh, nv.gioiTinh, nv.diaChi, 
                nv.email, nv.SDT, nv.trangThai, nv.maCV,
                cv.tenCV AS chucVu,
                STRING_AGG(pq.maChucNang, ', ') AS danhSachQuyen
            FROM NhanVien nv
            LEFT JOIN ChucVu cv ON nv.maCV = cv.maCV
            LEFT JOIN PhanQuyen pq ON cv.maCV = pq.maCV
            GROUP BY 
                nv.maNV, nv.hoTen, nv.ngaySinh, nv.gioiTinh, nv.diaChi, 
                nv.email, nv.SDT, nv.trangThai, nv.maCV, cv.tenCV
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách nhân viên:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// ================= THÊM NHÂN VIÊN MỚI =================
app.post('/api/admin/nhanvien/them', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai } = req.body;

        // 1. Tự động sinh mã nhân viên (NV + số thứ tự)
        let idResult = await pool.request().query("SELECT TOP 1 maNV FROM NhanVien ORDER BY maNV DESC");
        let nextMaNV = "NV01";
        if (idResult.recordset.length > 0) {
            let lastId = idResult.recordset[0].maNV; // Ví dụ: 'NV10'
            let num = parseInt(lastId.replace('NV', '')) + 1; // Lấy 10 + 1 = 11
            nextMaNV = 'NV' + num.toString().padStart(2, '0'); // Thành 'NV11'
        }

        // 2. Insert vào database
        await pool.request()
            .input('maNV', sql.VarChar, nextMaNV)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('ngaySinh', sql.Date, ngaySinh)
            .input('gioiTinh', sql.NVarChar, gioiTinh)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('SDT', sql.VarChar, SDT)
            .input('email', sql.VarChar, email)
            .input('maCV', sql.VarChar, maCV)
            .input('matKhau', sql.VarChar, matKhau)
            .input('trangThai', sql.Int, trangThai)
            .input('avatar', sql.NVarChar, 'https://placehold.co/150') // Gán avatar mặc định
            .query(`
                INSERT INTO NhanVien (maNV, hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai, avatar)
                VALUES (@maNV, @hoTen, @ngaySinh, @gioiTinh, @diaChi, @SDT, @email, @maCV, @matKhau, @trangThai, @avatar)
            `);

        res.json({ success: true, message: "Thêm nhân viên thành công!", maNV: nextMaNV });
    } catch (err) {
        console.error("Lỗi thêm nhân viên:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ================= SỬA THÔNG TIN NHÂN VIÊN =================
app.put('/api/admin/nhanvien/sua/:maNV', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNV } = req.params;
        const { hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, trangThai } = req.body;

        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('ngaySinh', sql.Date, ngaySinh)
            .input('gioiTinh', sql.NVarChar, gioiTinh)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('SDT', sql.VarChar, SDT)
            .input('email', sql.VarChar, email)
            .input('maCV', sql.VarChar, maCV)
            .input('trangThai', sql.Int, trangThai)
            .query(`
                UPDATE NhanVien 
                SET hoTen = @hoTen, ngaySinh = @ngaySinh, gioiTinh = @gioiTinh, 
                    diaChi = @diaChi, SDT = @SDT, email = @email, 
                    maCV = @maCV, trangThai = @trangThai
                WHERE maNV = @maNV
            `);

        res.json({ success: true, message: "Cập nhật nhân viên thành công!" });
    } catch (err) {
        console.error("Lỗi sửa nhân viên:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ================= XÓA NHÂN VIÊN =================
app.delete('/api/admin/nhanvien/xoa/:maNV', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNV } = req.params;

        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query("DELETE FROM NhanVien WHERE maNV = @maNV");

        res.json({ success: true, message: "Đã xóa nhân viên thành công!" });
    } catch (err) {
        console.error("Lỗi xóa nhân viên:", err);
        res.status(500).json({ success: false, message: "Không thể xóa nhân viên do ràng buộc dữ liệu!" });
    }
});

// ============================ NHA CUNG CAP, PHIEU NHAP =================
app.get('/api/phieunhap_nhacungcap', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT 
                pn.maPN, pn.ngayLap, pn.gioLap, pn.tongTien, pn.maNV, pn.trangThai,
                ncc.*
            FROM PhieuNhap pn
            LEFT JOIN NhaCungCap ncc ON pn.maNCC = ncc.maNCC
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách phiếu nhập:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});


// ============== NHÀ CUNG CẤP ==============

// Danh sách nhà cung cấp (route cũ /api/phieunhap_nhacungcap chỉ trả về
// phiếu nhập kèm NCC, không phải danh sách NCC thật -> cần route riêng này)
app.get('/api/nhacungcap', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`SELECT * FROM NhaCungCap ORDER BY maNCC`);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách nhà cung cấp:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// Thêm nhà cung cấp mới
app.post('/api/nhacungcap/them', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tenNCC, diaChi, SDT } = req.body;

        let countResult = await pool.request().query("SELECT COUNT(*) AS total FROM NhaCungCap");
        let maNCC = "NCC" + (countResult.recordset[0].total + 1).toString().padStart(2, '0');

        await pool.request()
            .input('maNCC', sql.VarChar(20), maNCC)
            .input('tenNCC', sql.NVarChar(100), tenNCC)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi)
            .input('SDT', sql.VarChar(15), SDT)
            .query(`INSERT INTO NhaCungCap (maNCC, tenNCC, diaChi, SDT, trangThai) VALUES (@maNCC, @tenNCC, @diaChi, @SDT, 0)`);

        res.json({ success: true, message: "Thêm nhà cung cấp thành công", maNCC });
    } catch (err) {
        console.error("Lỗi thêm nhà cung cấp:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// Sửa nhà cung cấp (kể cả đổi trạng thái Đang hợp tác / Ngừng hợp tác)
app.put('/api/nhacungcap/sua/:maNCC', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNCC } = req.params;
        const { tenNCC, diaChi, SDT, trangThai } = req.body;

        await pool.request()
            .input('maNCC', sql.VarChar(20), maNCC)
            .input('tenNCC', sql.NVarChar(100), tenNCC)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi)
            .input('SDT', sql.VarChar(15), SDT)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query(`UPDATE NhaCungCap SET tenNCC=@tenNCC, diaChi=@diaChi, SDT=@SDT, trangThai=@trangThai WHERE maNCC=@maNCC`);

        res.json({ success: true, message: "Cập nhật nhà cung cấp thành công" });
    } catch (err) {
        console.error("Lỗi sửa nhà cung cấp:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ============== PHIẾU NHẬP ==============

// Chi tiết 1 phiếu nhập (đi qua LoHang để lấy tên sản phẩm)
app.get('/api/phieunhap_nhacungcap/:maPN/chitiet', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maPN } = req.params;

        let result = await pool.request()
            .input('maPN', sql.VarChar(20), maPN)
            .query(`
                SELECT ctpn.soLuong, ctpn.giaNhap, sp.maSP, sp.tenSP AS tenSanPham,
                       lh.hanSuDung, lh.ngayNhap
                FROM ChiTietPhieuNhap ctpn
                JOIN LoHang lh ON ctpn.maLoHang = lh.maLoHang
                JOIN SanPham sp ON lh.maSP = sp.maSP
                WHERE ctpn.maPN = @maPN
            `);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy chi tiết phiếu nhập:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// Tạo phiếu nhập mới: tự tạo Lô hàng cho từng sản phẩm, ghi Chi tiết phiếu nhập,
// và CỘNG TỒN KHO tương ứng cho từng sản phẩm - tất cả trong 1 transaction.
app.post('/api/phieunhap_nhacungcap/them', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const { maNCC, maNV, danhSachSanPham } = req.body;
        // danhSachSanPham: [{ maSP, soLuong, giaNhap, hanSuDung }]

        if (!maNCC || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "Thiếu nhà cung cấp hoặc danh sách sản phẩm." });
        }

        const tongTien = danhSachSanPham.reduce(
            (tong, sp) => tong + (Number(sp.soLuong) || 0) * (Number(sp.giaNhap) || 0), 0
        );

        const maPN = 'PN' + Date.now();
        const reqPN = new sql.Request(transaction);
        await reqPN
            .input('maPN', sql.VarChar(20), maPN)
            .input('maNCC', sql.VarChar(20), maNCC)
            .input('maNV', sql.VarChar(20), maNV || null)
            .input('tongTien', sql.Decimal(15, 2), tongTien)
            .query(`
                INSERT INTO PhieuNhap (maPN, ngayLap, gioLap, tongTien, maNCC, maNV, trangThai)
                VALUES (@maPN, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), @tongTien, @maNCC, @maNV, 1)
            `);

        for (const sp of danhSachSanPham) {
            const maLoHang = 'LH' + Date.now() + Math.floor(Math.random() * 1000);

            const reqLoHang = new sql.Request(transaction);
            await reqLoHang
                .input('maLoHang', sql.VarChar(20), maLoHang)
                .input('maSP', sql.VarChar(20), sp.maSP)
                .input('hanSuDung', sql.Date, sp.hanSuDung || null)
                .query(`INSERT INTO LoHang (maLoHang, maSP, hanSuDung, ngayNhap) VALUES (@maLoHang, @maSP, @hanSuDung, GETDATE())`);

            const reqCT = new sql.Request(transaction);
            await reqCT
                .input('maPN', sql.VarChar(20), maPN)
                .input('maLoHang', sql.VarChar(20), maLoHang)
                .input('soLuong', sql.Int, sp.soLuong)
                .input('giaNhap', sql.Float, sp.giaNhap)
                .query(`INSERT INTO ChiTietPhieuNhap (maPN, maLoHang, soLuong, giaNhap) VALUES (@maPN, @maLoHang, @soLuong, @giaNhap)`);

            // Nhập hàng -> cộng tồn kho ngay
            const reqTonKho = new sql.Request(transaction);
            await reqTonKho
                .input('maSP', sql.VarChar(20), sp.maSP)
                .input('soLuong', sql.Int, sp.soLuong)
                .query(`UPDATE SanPham SET tonKho = tonKho + @soLuong WHERE maSP = @maSP`);
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "Tạo phiếu nhập thành công", maPN });
    } catch (error) {
        console.error("Lỗi tạo phiếu nhập:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// ============================ KHUYEN MAI, SALE =================
app.get('/api/khuyenmai', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `SELECT * FROM KhuyenMai km`;
        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách phiếu nhập:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});
//  ============== SAN PHAM FLASHSALE ========
app.get('/api/sanphamflashsale', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT 
                kgls.maKhungGio, kgls.gioBD, kgls.gioKT, kgls.ngayApDung, kgls.trangThai AS trangThaiKhungGio,
                spkm.giaFlashSale, spkm.soLuongGioiHan, spkm.daBan,
                sp.maSP, sp.tenSP, sp.hinhAnh, sp.giaBan
            FROM KhungGioFlashSale kgls
            LEFT JOIN SanPhamFlashSale spkm ON kgls.maKhungGio = spkm.maKhungGio
            LEFT JOIN SanPham sp ON spkm.maSP = sp.maSP
            ORDER BY kgls.ngayApDung DESC, kgls.gioBD DESC
        `;
        let result = await pool.request().query(queryStr);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});


// ================= API QUẢN LÝ FLASH SALE =================
// 1. Tạo khung giờ Flash Sale mới
app.post('/api/admin/flashsale/taokhunggio', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { ngayApDung, gioBD, gioKT } = req.body;

        // Sinh mã khung giờ tự động (bắt đầu bằng KG)
        const maKhungGio = 'KG' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .input('gioBD', sql.VarChar(10), gioBD)
            .input('gioKT', sql.VarChar(10), gioKT)
            .input('ngayApDung', sql.Date, ngayApDung)
            .query(`
                INSERT INTO KhungGioFlashSale (maKhungGio, gioBD, gioKT, ngayApDung, trangThai) 
                VALUES (@maKhungGio, @gioBD, @gioKT, @ngayApDung, 'sap_dien_ra')
            `);

        res.json({ success: true, message: "Tạo khung giờ Flash Sale thành công!" });
    } catch (err) {
        console.error("Lỗi tạo khung giờ:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

//  ==================== THEM SAN PHAM FASHSALE ====================
app.post('/api/admin/flashsale/themsanpham', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maFS, maSP, giaFlashSale, soLuongGioiHan } = req.body;

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maFS) // Lấy maFS từ React ghép vào maKhungGio
            .input('maSP', sql.VarChar(20), maSP)
            .input('giaFlashSale', sql.Float, giaFlashSale)
            .input('soLuongGioiHan', sql.Int, soLuongGioiHan)
            .query(`
                INSERT INTO SanPhamFlashSale (maKhungGio, maSP, giaFlashSale, soLuongGioiHan, daBan) 
                VALUES (@maKhungGio, @maSP, @giaFlashSale, @soLuongGioiHan, 0)
            `);

        res.json({ success: true, message: "Thêm sản phẩm vào Flash Sale thành công!" });
    } catch (err) {
        console.error("Lỗi thêm SP Flash Sale:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =============================== DANH GIA SAN PHAM ==========================
app.get('/api/danhgiasanpham', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT dg.*, sp.*, ph.*, kh.*, hasp.*, hadg.*
            FROM DanhGiaSanPham dg
            LEFT JOIN SanPham sp ON dg.maSP = sp.maSP
            LEFT JOIN KhachHang kh ON dg.maKH = kh.maKH
            LEFT JOIN PhanHoiDanhGia ph ON dg.maDanhGia = ph.maDanhGia
            LEFT JOIN HinhAnhSanPham hasp ON sp.maSP = hasp.maSP
            LEFT JOIN HinhAnhDanhGia hadg ON dg.maDanhGia = dg.maDanhGia
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm flash sale:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});


// ========================== HIEN THI PHAN HOI ===================
app.get('/api/thuonghieu', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT  th.*
            FROM ThuongHieu th
             
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm flash sale:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

//  ======================= CAP NHAT TRANG THAI =============================
app.put('/api/admin/thuonghieu/trangthai/:maThuongHieu', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maThuongHieu } = req.params;
        const { trangThai } = req.body;

        await pool.request()
            .input('maThuongHieu', sql.VarChar, maThuongHieu)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query("UPDATE ThuongHieu SET trangThai = @trangThai WHERE maThuongHieu = @maThuongHieu");

        res.json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (err) {
        console.error("Lỗi cập nhật trạng thái thương hiệu:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

//======================= THEM THUONG HIEU MOI (DANH MUC MOI) =====
app.post('/api/admin/thuonghieu/them', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tenThuongHieu, hinhAnh } = req.body;

        // Tự động tạo mã thương hiệu tiếp theo (Ví dụ: TH07, TH08...) hoặc dùng random
        let countResult = await pool.request().query("SELECT COUNT(*) AS total FROM ThuongHieu");
        let nextId = `TH0${countResult.recordset[0].total + 1}`;

        await pool.request()
            .input('maThuongHieu', sql.VarChar, nextId)
            .input('tenThuongHieu', sql.NVarChar(50), tenThuongHieu)
            .input('hinhAnh', sql.VarChar(255), hinhAnh || "https://via.placeholder.com/48")
            .input('trangThai', sql.Bit, 1) // Mặc định là bật (1)
            .query(`
                INSERT INTO ThuongHieu (maThuongHieu, tenThuongHieu, hinhAnh, trangThai) 
                VALUES (@maThuongHieu, @tenThuongHieu, @hinhAnh, @trangThai)
            `);

        res.json({ success: true, message: "Thêm thương hiệu thành công" });
    } catch (err) {
        console.error("Lỗi thêm thương hiệu:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

//======================= XOA THUONG HIEU MOI (DANH MUC MOI) =====
app.delete('/api/admin/thuonghieu/xoa/:id', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { id } = req.params;

        await pool.request()
            .input('maThuongHieu', sql.VarChar, id)
            .query("DELETE FROM ThuongHieu WHERE maThuongHieu = @maThuongHieu");

        res.json({ success: true, message: "Xóa thành công" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

//======================= SUA THUONG HIEU MOI (DANH MUC MOI) =====
app.put('/api/admin/thuonghieu/sua/:id', async (req, res) => { // THÊM :id VÀO ĐƯỜNG DẪN
    try {
        let pool = await sql.connect(dbConfig);
        const { id } = req.params; // Lấy ID từ URL
        const { tenThuongHieu, hinhAnh } = req.body;

        // DÙNG CÂU LỆNH UPDATE THAY VÌ INSERT
        await pool.request()
            .input('maThuongHieu', sql.VarChar, id)
            .input('tenThuongHieu', sql.NVarChar(50), tenThuongHieu)
            .input('hinhAnh', sql.VarChar(255), hinhAnh || "https://via.placeholder.com/48")
            .query(`
                UPDATE ThuongHieu 
                SET tenThuongHieu = @tenThuongHieu, hinhAnh = @hinhAnh 
                WHERE maThuongHieu = @maThuongHieu
            `);

        res.json({ success: true, message: "Cập nhật thương hiệu thành công" });
    } catch (err) {
        console.error("Lỗi sửa thương hiệu:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});



// ================= QUẢN LÝ ĐÁNH GIÁ (DÀNH CHO ADMIN) =================

// 1. Lấy toàn bộ danh sách đánh giá kèm tên sản phẩm và tên khách hàng
app.get('/api/admin/danhgiasanpham', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT dg.maDanhGia, dg.maSP, dg.maKH, dg.soSao, dg.noiDung, dg.daMuaHang, dg.ngayTao,
                   sp.tenSP, sp.hinhAnh, kh.hoTen, 
                   ph.noiDung AS shopReply, ph.ngayTao AS ngayReply
            FROM DanhGiaSanPham dg
            LEFT JOIN SanPham sp ON dg.maSP = sp.maSP
            LEFT JOIN KhachHang kh ON dg.maKH = kh.maKH
            LEFT JOIN PhanHoiDanhGia ph ON dg.maDanhGia = ph.maDanhGia
            ORDER BY dg.ngayTao DESC
        `);

        // Lấy thêm hình ảnh cho từng đánh giá (nếu có)
        let imgResult = await pool.request().query(`SELECT maDanhGia, duongDanDanhGia FROM HinhAnhDanhGia`);
        let dsAnh = imgResult.recordset;

        let ketQua = result.recordset.map(item => ({
            ...item,
            danhSachAnh: dsAnh.filter(a => a.maDanhGia === item.maDanhGia).map(a => a.duongDanDanhGia)
        }));

        res.json(ketQua);
    } catch (err) {
        console.error("Lỗi lấy danh sách đánh giá admin:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// 2. Gửi phản hồi từ Admin/Shop
app.post('/api/admin/danhgia/phanhoi', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDanhGia, maNV = 'NV01', noiDung } = req.body;

        // Kiểm tra xem đánh giá này đã có phản hồi trước đó chưa
        let check = await pool.request()
            .input('maDanhGia', sql.Int, maDanhGia)
            .query("SELECT * FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia");

        if (check.recordset.length > 0) {
            // Nếu có rồi thì UPDATE
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGia)
                .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
                .query("UPDATE PhanHoiDanhGia SET noiDung = @noiDung, ngayTao = GETDATE() WHERE maDanhGia = @maDanhGia");
        } else {
            // Nếu chưa thì INSERT mới
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGia)
                .input('maNV', sql.VarChar, maNV)
                .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
                .query("INSERT INTO PhanHoiDanhGia (maDanhGia, maNV, noiDung, ngayTao) VALUES (@maDanhGia, @maNV, @noiDung, GETDATE())");
        }

        res.json({ success: true, message: "Phản hồi thành công!" });
    } catch (err) {
        console.error("Lỗi gửi phản hồi:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// 3. Xóa đánh giá (Admin)
app.delete('/api/admin/danhgia/xoa/:maDanhGia', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDanhGia } = req.params;

        // Xóa các bảng liên quan trước (khóa ngoại) rồi mới xóa đánh giá
        await pool.request().input('maDanhGia', sql.Int, maDanhGia).query(`
            DELETE FROM HinhAnhDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia;
        `);

        res.json({ success: true, message: "Xóa đánh giá thành công." });
    } catch (err) {
        console.error("Lỗi xóa đánh giá:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// =============================== VAN CHUYEN ==========================
app.get('/api/vanchuyen', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT 
                vc.maVanChuyen, 
                vc.maHoaDon, 
                vc.donViVanChuyen, 
                vc.maVanDon, 
                vc.phiVanChuyen, 
                vc.trangThai, 
                vc.ngayGiaoDuKien,
                ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS hoTen,
                ISNULL(kh.SDT, dc.SDT) AS SDT,
                dc.diaChiChiTiet
            FROM VanChuyen vc
            LEFT JOIN HoaDon hd ON vc.maHoaDon = hd.maHoaDon
            LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
            LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
            ORDER BY vc.maVanChuyen DESC
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách vận chuyển:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// ==================== CẬP NHẬT VẬN CHUYỂN & ĐỒNG BỘ HÓA ĐƠN ====================
app.put('/api/vanchuyen/:maVanChuyen', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maVanChuyen } = req.params;
        const { donViVanChuyen, maHoaDon, ngayGiaoDuKien, trangThai } = req.body;

        // 1. Lấy maHoaDon liên quan từ bảng VanChuyen nếu chưa có sẵn trong request
        let vcResult = await pool.request()
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .query("SELECT maHoaDon FROM VanChuyen WHERE maVanChuyen = @maVanChuyen");

        if (vcResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin vận chuyển!" });
        }

        const targetMaHoaDon = vcResult.recordset[0].maHoaDon;

        // 2. Cập nhật bảng VanChuyen
        await pool.request()
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .input('donViVanChuyen', sql.VarChar(50), donViVanChuyen || null)
            .input('maVanDon', sql.VarChar(50), maHoaDon || null)
            .input('ngayGiaoDuKien', sql.Date, ngayGiaoDuKien || null)
            .input('trangThai', sql.VarChar(30), trangThai || 'cho_lay_hang')
            .query(`
                UPDATE VanChuyen 
                SET donViVanChuyen = @donViVanChuyen, 
                    maVanDon = @maVanDon, 
                    ngayGiaoDuKien = @ngayGiaoDuKien, 
                    trangThai = @trangThai 
                WHERE maVanChuyen = @maVanChuyen
            `);

        // 3. TỰ ĐỘNG ĐỒNG BỘ TRẠNG THÁI SANG BẢNG HÓA ĐƠN (HOADON)
        let trangThaiHoaDon = 'cho_xac_nhan';
        if (trangThai === 'dang_giao') {
            trangThaiHoaDon = 'dang_giao';
        } else if (trangThai === 'da_giao') {
            trangThaiHoaDon = 'hoan_tat';
        } else if (trangThai === 'da_huy') {
            trangThaiHoaDon = 'da_huy';
        }

        if (targetMaHoaDon) {
            await pool.request()
                .input('trangThaiHD', sql.VarChar(30), trangThaiHoaDon)
                .input('maHoaDon', sql.VarChar(20), targetMaHoaDon)
                .query("UPDATE HoaDon SET trangThai = @trangThaiHD WHERE maHoaDon = @maHoaDon");
        }

        res.json({ success: true, message: "Cập nhật vận chuyển và đồng bộ hóa đơn thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật vận chuyển:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ====================  LẤY DỮ LIỆU CHẤM CÔNG & LƯƠNG THEO THÁNG/NĂM ====================
app.get('/api/chamcong', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let { thang, nam } = req.query;

        let queryStr = `
            SELECT 
                nv.maNV, 
                nv.hoTen, 
                cv.tenCV,
                cc.thoiGianChamCong,
                l.luongCoBan, 
                l.luongThuong, 
                l.luongThucNhan,
                (
                    SELECT COUNT(*) 
                    FROM ChamCong 
                     WHERE maNV = nv.maNV 
                      AND MONTH(thoiGianChamCong) = @thang 
                      AND YEAR(thoiGianChamCong) = @nam
                ) AS tongNgayCong
            FROM NhanVien nv
            LEFT JOIN ChucVu cv ON nv.maCV = cv.maCV  
            LEFT JOIN ChamCong cc ON nv.maNV = cc.maNV 
                 AND MONTH(cc.thoiGianChamCong) = @thang 
                 AND YEAR(cc.thoiGianChamCong) = @nam
            LEFT JOIN Luong l ON nv.maNV = l.maNV
        `;

        let result = await pool.request()
            .input('thang', sql.Int, thang || new Date().getMonth() + 1)
            .input('nam', sql.Int, nam || new Date().getFullYear())
            .query(queryStr);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy dữ liệu chấm công:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// ====================  TÍNH TOÁN VÀ CẬP NHẬT LƯƠNG TỰ ĐỘNG ====================
app.post('/api/luong/tinh-toan', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        let { thang, nam } = req.body;

        // 1. Lấy danh sách nhân viên và số ngày làm thực tế trong tháng
        let dsChamCong = await pool.request()
            .input('thang', sql.Int, thang)
            .input('nam', sql.Int, nam)
            .query(`
                SELECT maNV, COUNT(thoiGianChamCong) AS soNgayLam
                FROM ChamCong
                WHERE MONTH(thoiGianChamCong) = @thang AND YEAR(thoiGianChamCong) = @nam
                GROUP BY maNV
            `);

        // 2. Duyệt qua từng nhân viên để cập nhật hoặc thêm mới vào bảng Luong
        for (let item of dsChamCong.recordset) {
            const { maNV, soNgayLam } = item;

            // Lấy lương cơ bản của nhân viên (giả định lấy từ chức vụ hoặc mặc định 10 triệu nếu chưa có)
            // Hoặc bạn có thể truy vấn từ bảng NhanVien/ChucVu tùy thiết kế cơ sở dữ liệu của bạn
            let nvInfo = await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query(`
                    SELECT ISNULL(l.luongCoBan, 10000000) AS luongCoBan, ISNULL(l.luongThuong, 500000) AS luongThuong
                    FROM NhanVien nv
                    LEFT JOIN Luong l ON nv.maNV = l.maNV
                    WHERE nv.maNV = @maNV
                `);

            let luongCoBan = nvInfo.recordset.length > 0 ? nvInfo.recordset[0].luongCoBan : 10000000;
            let luongThuong = nvInfo.recordset.length > 0 ? nvInfo.recordset[0].luongThuong : 500000;

            // Công thức tính lương thực nhận: (Lương cơ bản / 26 ngày chuẩn) * số ngày làm + Thưởng
            let luongThucNhan = Math.round((Number(luongCoBan) / 26.0) * soNgayLam + Number(luongThuong));

            // Kiểm tra xem nhân viên đã có dòng trong bảng Luong chưa
            let checkLuong = await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query("SELECT * FROM Luong WHERE maNV = @maNV");

            if (checkLuong.recordset.length > 0) {
                // Update
                await pool.request()
                    .input('maNV', sql.VarChar, maNV)
                    .input('tongNgayCong', sql.Int, soNgayLam)
                    .input('luongThucNhan', sql.Decimal(15, 2), luongThucNhan)
                    .query(`
                        UPDATE Luong 
                        SET tongNgayCong = @tongNgayCong, luongThucNhan = @luongThucNhan 
                        WHERE maNV = @maNV
                    `);
            } else {
                // Insert mới nếu chưa có
                const maLuong = 'L' + maNV + Date.now().toString().slice(-4);
                await pool.request()
                    .input('maLuong', sql.VarChar, maLuong)
                    .input('maNV', sql.VarChar, maNV)
                    .input('tongNgayCong', sql.Int, soNgayLam)
                    .input('luongCoBan', sql.Decimal(15, 2), luongCoBan)
                    .input('luongThuong', sql.Decimal(15, 2), luongThuong)
                    .input('luongThucNhan', sql.Decimal(15, 2), luongThucNhan)
                    .query(`
                        INSERT INTO Luong (maLuong, maNV, tongNgayCong, luongCoBan, luongThuong, luongThucNhan)
                        VALUES (@maLuong, @maNV, @tongNgayCong, @luongCoBan, @luongThuong, @luongThucNhan)
                    `);
            }
        }

        res.status(200).json({ success: true, message: "Tính toán và cập nhật lương thành công!" });
    } catch (err) {
        console.error("Lỗi API tính lương:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ================= TỰ ĐỘNG CHẤM CÔNG KHI ĐĂNG NHẬP =================
app.post('/api/chamcong/tu-dong', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let { maNV } = req.body;

        if (!maNV) {
            return res.status(400).json({ success: false, message: "Thiếu mã nhân viên!" });
        }

        // Kiểm tra xem hôm nay nhân viên này đã có bản ghi chấm công nào chưa
        let check = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(`
                SELECT * FROM ChamCong 
                WHERE maNV = @maNV AND CAST(thoiGianChamCong AS DATE) = CAST(GETDATE() AS DATE)
            `);

        // Nếu hôm nay chưa có -> Tự động chèn 1 dòng chấm công vào CSDL
        if (check.recordset.length === 0) {
            await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query(`
                    INSERT INTO ChamCong (maNV, thoiGianChamCong) 
                    VALUES (@maNV, GETDATE())
                `);
            return res.json({ success: true, message: "Đã tự động chấm công cho hôm nay." });
        }

        res.json({ success: true, message: "Hôm nay nhân viên này đã được chấm công trước đó rồi." });
    } catch (err) {
        console.error("Lỗi tự động chấm công:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ==================== CẬP NHẬT LƯƠNG (CÓ KIỂM TRA QUYỀN GIÁM ĐỐC) ====================
app.put('/api/luong/cap-nhat-co-ban/:maNV', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNV } = req.params;
        const { luongCoBanMoi, luongThuongMoi, maCVNguoiThaoTac } = req.body;

        // BẢO MẬT: Kiểm tra mã chức vụ người thao tác có phải Giám đốc ('CV01') hay không
        // (Bạn có thể truyền maCV từ frontend lên qua body request)
        if (maCVNguoiThaoTac !== 'CV01') {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền tăng hoặc sửa lương nhân viên! Chỉ có Giám đốc mới thực hiện được."
            });
        }

        let check = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query("SELECT * FROM Luong WHERE maNV = @maNV");

        if (check.recordset.length > 0) {
            await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .input('luongCoBan', sql.Decimal(15, 2), luongCoBanMoi)
                .input('luongThuong', sql.Decimal(15, 2), luongThuongMoi || 0)
                .query(`
                    UPDATE Luong 
                    SET luongCoBan = @luongCoBan, luongThuong = ISNULL(@luongThuong, luongThuong)
                    WHERE maNV = @maNV
                `);
        } else {
            const maLuong = 'L' + maNV;
            await pool.request()
                .input('maLuong', sql.VarChar, maLuong)
                .input('maNV', sql.VarChar, maNV)
                .input('luongCoBan', sql.Decimal(15, 2), luongCoBanMoi)
                .input('luongThuong', sql.Decimal(15, 2), luongThuongMoi || 0)
                .input('tongNgayCong', sql.Int, 0)
                .input('luongThucNhan', sql.Decimal(15, 2), luongCoBanMoi)
                .query(`
                    INSERT INTO Luong (maLuong, maNV, tongNgayCong, luongCoBan, luongThuong, luongThucNhan)
                    VALUES (@maLuong, @maNV, @tongNgayCong, @luongCoBan, @luongThuong, @luongThucNhan)
                `);
        }

        res.json({ success: true, message: "Cập nhật mức lương thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật lương:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// =============================== SAN PHAM ==========================
app.get('/api/sanpham', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT sp.*, lsp.tenLSP
            FROM SanPham sp
            LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// =============================== THÊM SẢN PHẨM ==========================
router.post('/api/sanpham/them', upload.array('anhSanPham', 10), async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

        const { tenSP, hang, tenLSP, giaBan, tonKho } = req.body;

        const danhSachFile = req.files || [];
        const anhDaiDien = danhSachFile.length > 0 ? layUrlAnh(danhSachFile[0].filename) : null;

        const queryInsertSP = `
            INSERT INTO SanPham (tenSP, hang, tenLSP, giaBan, tonKho, hinhAnh, trangThai)
            OUTPUT INSERTED.maSP
            VALUES (@tenSP, @hang, @tenLSP, @giaBan, @tonKho, @hinhAnh, 1)
        `;

        request.input('tenSP', sql.NVarChar, tenSP);
        request.input('hang', sql.NVarChar, hang);
        request.input('tenLSP', sql.NVarChar, tenLSP);
        request.input('giaBan', sql.Int, giaBan);
        request.input('tonKho', sql.Int, tonKho);
        request.input('hinhAnh', sql.VarChar, anhDaiDien);

        const resultSP = await request.query(queryInsertSP);
        const maSPMoi = resultSP.recordset[0].maSP;

        for (let i = 1; i < danhSachFile.length; i++) {
            const requestAnh = new sql.Request(transaction);
            await requestAnh
                .input('maSP', sql.Int, maSPMoi)
                .input('duongDan', sql.VarChar, layUrlAnh(danhSachFile[i].filename))
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "Thêm sản phẩm thành công", newProductId: maSPMoi });

    } catch (error) {
        console.error("Lỗi thêm sản phẩm:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// =============================== SỬA SẢN PHẨM ==========================
router.put('/api/sanpham/sua/:maSP', upload.array('anhSanPham', 10), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maSP } = req.params;
        const { tenSP, hang, tenLSP, giaBan, tonKho, trangThai } = req.body;

        // Cột trangThai trong DB là kiểu bit (0/1), frontend gửi lên chuỗi "1" hoặc "0"
        const trangThaiBit = (trangThai === "1" || trangThai === "true") ? 1 : 0;

        const request = pool.request();
        request.input('maSP', sql.VarChar(10), maSP);
        request.input('tenSP', sql.NVarChar, tenSP);
        request.input('hang', sql.NVarChar, hang);
        request.input('tenLSP', sql.NVarChar, tenLSP);
        request.input('giaBan', sql.Int, giaBan);
        request.input('tonKho', sql.Int, tonKho);
        request.input('trangThai', sql.Bit, trangThaiBit);

        await request.query(`
            UPDATE SanPham
            SET tenSP = @tenSP, hang = @hang, tenLSP = @tenLSP,
                giaBan = @giaBan, tonKho = @tonKho, trangThai = @trangThai
            WHERE maSP = @maSP
        `);

        const danhSachFile = req.files || [];
        for (const file of danhSachFile) {
            const requestAnh = pool.request();
            await requestAnh
                .input('maSP', sql.Int, maSP)
                .input('duongDan', sql.VarChar, layUrlAnh(file.filename))
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công" });

    } catch (error) {
        console.error("Lỗi cập nhật sản phẩm:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// =============================== XÓA SẢN PHẨM ==========================
router.delete('/api/sanpham/:maSP', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maSP } = req.params;

        await pool.request()
            .input('maSP', sql.Int, maSP)
            .query(`DELETE FROM SanPham WHERE maSP = @maSP`);

        res.status(200).json({ success: true, message: "Xóa sản phẩm thành công" });
    } catch (error) {
        console.error("Lỗi xóa sản phẩm:", error);
        res.status(500).json({
            success: false,
            message: "Không thể xóa (có thể sản phẩm đang được tham chiếu ở hóa đơn khác): " + error.message,
        });
    }
});


// ================= YÊU CẦU ĐỔI TRẢ (ADMIN) =================

// 1. Danh sách yêu cầu đổi trả kèm tên sản phẩm, mã đơn gốc
app.get('/api/doitrahang', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT dtr.maDoiTra, dtr.maHoaDon, dtr.maSP, dtr.lyDo, dtr.loaiYeuCau,
                   dtr.trangThai, dtr.ngayTao, dtr.hinhAnh, sp.tenSP
            FROM DoiTraHang dtr
            LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
            ORDER BY dtr.ngayTao DESC
        `);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách đổi trả:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// 2. Chi tiết 1 yêu cầu đổi trả (đơn gốc, khách hàng, thanh toán, ảnh minh chứng)
app.get('/api/doitrahang/:maDoiTra/chitiet', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDoiTra } = req.params;

        let ketQua = await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .query(`
                SELECT dtr.*, sp.tenSP, tt.phuongThuc,
                       ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS tenKhachHang,
                       ISNULL(kh.SDT, dc.SDT) AS sdtKhachHang,
                       dc.diaChiChiTiet
                FROM DoiTraHang dtr
                LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
                LEFT JOIN HoaDon hd ON dtr.maHoaDon = hd.maHoaDon
                LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
                LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
                LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
                WHERE dtr.maDoiTra = @maDoiTra
            `);

        if (ketQua.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        }

        const data = ketQua.recordset[0];

        // Tách chuỗi hinhAnh thành mảng (phòng trường hợp lưu nhiều URL cách nhau bằng dấu phẩy)
        const mangHinhAnh = data.hinhAnh ? data.hinhAnh.split(',') : [];

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
            ...data,
            hinhAnh: mangHinhAnh
        });
    } catch (err) {
        console.error("Lỗi lấy chi tiết đổi trả:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// ================= XỬ LÝ YÊU CẦU ĐỔI TRẢ (ADMIN) =================
app.put('/api/doitrahang/xuly/:maDoiTra', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDoiTra } = req.params;
        const { trangThai, hinhThucGiaiQuyet, ghiChuNoiBo, maNV } = req.body;

        await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .input('trangThai', sql.VarChar(20), trangThai)
            .input('hinhThucGiaiQuyet', sql.VarChar(30), hinhThucGiaiQuyet || null)
            .input('ghiChuNoiBo', sql.NVarChar(sql.MAX), ghiChuNoiBo || null)
            .input('maNV', sql.VarChar(20), maNV || null)
            .query(`
                UPDATE DoiTraHang
                SET trangThai = @trangThai, 
                    hinhThucGiaiQuyet = @hinhThucGiaiQuyet,
                    ghiChuNoiBo = @ghiChuNoiBo, 
                    maNV = @maNV
                WHERE maDoiTra = @maDoiTra
            `);

        res.json({ success: true, message: "Đã cập nhật yêu cầu đổi trả thành công!" });
    } catch (err) {
        console.error("Lỗi chi tiết khi Admin cập nhật đổi trả:", err);
        // Trả về lỗi chi tiết từ CSDL để popup ngoài giao diện hiển thị đúng nguyên nhân
        res.status(500).json({ success: false, message: "Lỗi CSDL: " + err.message });
    }
});

// ==================== 1. API LẤY TOÀN BỘ CÀI ĐẶT VÀ HỒ SƠ ====================
// ==================== 1. API LẤY TOÀN BỘ CÀI ĐẶT VÀ HỒ SƠ ====================
app.get('/api/caidat', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let maNV = req.query.maNV;

        // 1. Lấy thông tin hệ thống (Cửa hàng & Vận chuyển)
        let sysData = await pool.request().query("SELECT * FROM CaiDatHeThong WHERE id = 1");
        let heThong = sysData.recordset.length > 0 ? sysData.recordset[0] : {};

        // 2. Lấy hồ sơ cá nhân của người đang đăng nhập
        let hoSo = {};
        if (maNV) {
            try {
                // SỬA LỖI TẠI ĐÂY: Dùng 'avatar AS anhDaiDien' cho khớp với CSDL của bạn
                let user = await pool.request()
                    .input('maNV', sql.VarChar, maNV)
                    .query(`
                        SELECT 
                            hoTen, 
                            SDT as soDienThoai, 
                            email, 
                            avatar AS anhDaiDien 
                        FROM NhanVien 
                        WHERE maNV = @maNV
                    `);
                if (user.recordset.length > 0) {
                    hoSo = user.recordset[0];
                }
            } catch (errNV) {
                console.log("Cảnh báo: Bảng NhanVien thiếu cột email hoặc avatar. Bỏ qua lấy hồ sơ.");
            }
        }

        // 3. Phân tích chuỗi JSON cấu hình vận chuyển an toàn
        let danhSachDonVi = [];
        try {
            if (heThong.donViHoTro) {
                danhSachDonVi = JSON.parse(heThong.donViHoTro);
            }
        } catch (e) {
            console.log("Lỗi parse JSON donViHoTro:", e);
        }

        res.json({
            hoSo: hoSo,
            cuaHang: {
                tenCuaHang: heThong.tenCuaHang || "",
                diaChi: heThong.diaChi || "",
                hotline: heThong.hotline || "",
                logo: heThong.logo || "",
                moTa: heThong.moTa || ""
            },
            vanChuyen: {
                phiMacDinh: heThong.phiMacDinh || 0,
                nguongMienPhi: heThong.nguongMienPhi || 0,
                donViHoTro: danhSachDonVi
            }
        });
    } catch (err) {
        console.error("Lỗi GET cài đặt:", err);
        res.status(500).send(err.message);
    }
});

// ==================== 2. API CẬP NHẬT HỒ SƠ ====================
app.put('/api/caidat/hoso', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNV, hoTen, soDienThoai, email, anhDaiDien } = req.body;

        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('SDT', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email || null)
            // .input('anhDaiDien', sql.VarChar, anhDaiDien || null) // Mở comment nếu lưu ảnh base64
            .query("UPDATE NhanVien SET hoTen = @hoTen, SDT = @SDT, email = @email WHERE maNV = @maNV");

        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// ==================== 3. API ĐỔI MẬT KHẨU ====================
app.put('/api/caidat/matkhau', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maNV, hienTai, moi } = req.body;

        // Kiểm tra mật khẩu cũ (Giả định bảng TaiKhoan chứa maNV và matKhau)
        let check = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('matKhauCu', sql.VarChar, hienTai)
            .query("SELECT * FROM TaiKhoan WHERE (tenDangNhap = @maNV OR maNV = @maNV) AND matKhau = @matKhauCu");

        if (check.recordset.length === 0) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" });
        }

        // Cập nhật mật khẩu mới
        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('matKhauMoi', sql.VarChar, moi)
            .query("UPDATE TaiKhoan SET matKhau = @matKhauMoi WHERE (tenDangNhap = @maNV OR maNV = @maNV)");

        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// ==================== 4. API CẬP NHẬT CỬA HÀNG ====================
app.put('/api/caidat/cuahang', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tenCuaHang, diaChi, hotline, moTa } = req.body;

        await pool.request()
            .input('tenCuaHang', sql.NVarChar, tenCuaHang)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('hotline', sql.VarChar, hotline)
            .input('moTa', sql.NVarChar, moTa)
            .query(`UPDATE CaiDatHeThong SET tenCuaHang=@tenCuaHang, diaChi=@diaChi, hotline=@hotline, moTa=@moTa WHERE id=1`);

        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// ==================== 5. API CẬP NHẬT VẬN CHUYỂN ====================
app.put('/api/caidat/vanchuyen', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { phiMacDinh, nguongMienPhi, donViHoTro } = req.body;

        await pool.request()
            .input('phiMacDinh', sql.Float, phiMacDinh || 0)
            .input('nguongMienPhi', sql.Float, nguongMienPhi || 0)
            .input('donViHoTro', sql.NVarChar, JSON.stringify(donViHoTro))
            .query(`UPDATE CaiDatHeThong SET phiMacDinh=@phiMacDinh, nguongMienPhi=@nguongMienPhi, donViHoTro=@donViHoTro WHERE id=1`);

        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});



// ================= HÀM TRỢ GIÚP TÍNH THỜI GIAN THỐNG KÊ =================
const tinhKhoangThoiGian = (khoang) => {
    const now = new Date();
    const hienTai = { den: new Date(now) };
    const truoc = {};

    if (khoang === '7ngay') {
        hienTai.tu = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        truoc.den = new Date(hienTai.tu.getTime() - 1000);
        truoc.tu = new Date(truoc.den.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (khoang === 'quynay') {
        const quarter = Math.floor(now.getMonth() / 3);
        hienTai.tu = new Date(now.getFullYear(), quarter * 3, 1);
        truoc.den = new Date(hienTai.tu.getTime() - 1000);
        truoc.tu = new Date(truoc.den.getFullYear(), Math.floor(truoc.den.getMonth() / 3) * 3, 1);
    } else if (khoang === 'namnay') {
        hienTai.tu = new Date(now.getFullYear(), 0, 1);
        truoc.den = new Date(hienTai.tu.getTime() - 1000);
        truoc.tu = new Date(truoc.den.getFullYear(), 0, 1);
    } else {
        // Mặc định là 30 ngày
        hienTai.tu = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        truoc.den = new Date(hienTai.tu.getTime() - 1000);
        truoc.tu = new Date(truoc.den.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return { hienTai, truoc };
};

 
// ================= BÁO CÁO & THỐNG KÊ =================
 
app.get('/api/thongke/tongquan', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { khoang = '30ngay' } = req.query;
        const { hienTai, truoc } = tinhKhoangThoiGian(khoang);

        const layThongKe = async (tu, den) => {
            const result = await pool.request()
                .input('tu', sql.DateTime, tu)
                .input('den', sql.DateTime, den)
                .query(`
                    SELECT 
                        ISNULL(SUM(CASE WHEN trangThai = 'hoan_tat' THEN tongTien END), 0) AS doanhThu,
                        COUNT(*) AS tongDonHang,
                        ISNULL(AVG(CASE WHEN trangThai = 'hoan_tat' THEN tongTien END), 0) AS giaTriTB,
                        SUM(CASE WHEN trangThai = 'da_huy' THEN 1 ELSE 0 END) AS soDonHuy
                    FROM HoaDon
                    WHERE thoiGianLap BETWEEN @tu AND @den
                `);
            const row = result.recordset[0];
            const tyLeHuy = row.tongDonHang > 0 ? (row.soDonHuy / row.tongDonHang) * 100 : 0;
            return { ...row, tyLeHuy };
        };

        const [tkHienTai, tkTruoc] = await Promise.all([
            layThongKe(hienTai.tu, hienTai.den),
            layThongKe(truoc.tu, truoc.den),
        ]);

        const phanTram = (moi, cu) => (!cu ? (moi > 0 ? 100 : 0) : ((moi - cu) / cu) * 100);

        res.json({
            doanhThu: tkHienTai.doanhThu,
            doanhThuThayDoi: phanTram(tkHienTai.doanhThu, tkTruoc.doanhThu),
            tongDonHang: tkHienTai.tongDonHang,
            tongDonHangThayDoi: phanTram(tkHienTai.tongDonHang, tkTruoc.tongDonHang),
            giaTriTB: tkHienTai.giaTriTB,
            giaTriTBThayDoi: phanTram(tkHienTai.giaTriTB, tkTruoc.giaTriTB),
            tyLeHuy: tkHienTai.tyLeHuy,
            tyLeHuyThayDoi: tkHienTai.tyLeHuy - tkTruoc.tyLeHuy,
        });
    } catch (err) {
        console.error("Lỗi thống kê tổng quan:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// ===============  BIEU DO DOANH THU ==================== 
app.get('/api/thongke/doanhthu', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { khoang = '30ngay', theo = 'tuan' } = req.query;
        const { hienTai } = tinhKhoangThoiGian(khoang);

        let nhomTheo = `DATEPART(iso_week, thoiGianLap)`;
        if (theo === 'ngay') nhomTheo = `CONVERT(date, thoiGianLap)`;
        if (theo === 'thang') nhomTheo = `FORMAT(thoiGianLap, 'yyyy-MM')`;

        const result = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT ${nhomTheo} AS nhom, SUM(tongTien) AS doanhThu
                FROM HoaDon
                WHERE trangThai = 'hoan_tat' AND thoiGianLap BETWEEN @tu AND @den
                GROUP BY ${nhomTheo}
                ORDER BY nhom
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi biểu đồ doanh thu:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// 3. Top 5 sản phẩm bán chạy
app.get('/api/thongke/top-san-pham', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { khoang = '30ngay' } = req.query;
        const { hienTai } = tinhKhoangThoiGian(khoang);

        const result = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT TOP 5 sp.maSP, sp.tenSP,
                       SUM(ct.soLuong * ct.giaBan) AS doanhThu,
                       SUM(ct.soLuong) AS soLuongBan
                FROM ChiTietHoaDon ct
                JOIN HoaDon hd ON ct.maHoaDon = hd.maHoaDon
                JOIN SanPham sp ON ct.maSP = sp.maSP
                WHERE hd.trangThai = 'hoan_tat' AND hd.thoiGianLap BETWEEN @tu AND @den
                GROUP BY sp.maSP, sp.tenSP
                ORDER BY doanhThu DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi top sản phẩm:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// 4. Hiệu quả các chiến dịch khuyến mãi
app.get('/api/thongke/khuyenmai', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { khoang = '30ngay' } = req.query;
        const { hienTai } = tinhKhoangThoiGian(khoang);

        const result = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT km.maKM, km.tenKM, km.ngayBD, km.ngayKT, km.trangThai AS trangThaiBat,
                       COUNT(hd.maHoaDon) AS soDon,
                       ISNULL(SUM(hd.tongTien), 0) AS doanhThu
                FROM KhuyenMai km
                LEFT JOIN HoaDon hd ON hd.maKM = km.maKM AND hd.trangThai = 'hoan_tat'
                    AND hd.thoiGianLap BETWEEN @tu AND @den
                GROUP BY km.maKM, km.tenKM, km.ngayBD, km.ngayKT, km.trangThai
                ORDER BY doanhThu DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi hiệu quả khuyến mãi:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// 5. Danh sách tồn kho cần nhập gấp (dùng lại đúng ngưỡng 5 như trang Quản lý sản phẩm)
app.get('/api/thongke/ton-kho-canh-bao', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const NGUONG = 5;

        const result = await pool.request()
            .query(`
                SELECT sp.maSP, sp.tenSP, sp.hinhAnh, sp.tonKho,
                       th.tenThuongHieu, lsp.tenLSP
                FROM SanPham sp
                LEFT JOIN ThuongHieu th ON sp.maThuongHieu = th.maThuongHieu
                LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
                WHERE sp.tonKho <= ${NGUONG} AND sp.trangThai = 1
                ORDER BY sp.tonKho ASC
            `);

        res.json(result.recordset.map((r) => ({ ...r, nguongToiThieu: NGUONG })));
    } catch (err) {
        console.error("Lỗi tồn kho cảnh báo:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});


// ==================== 1. LẤY DANH SÁCH BANNER (Cho cả Admin & User) ====================
app.get('/api/caidat/banner', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query("SELECT * FROM BannerQC ORDER BY viTri, thuTu ASC");
        res.json(result.recordset);
    } catch (err) { 
        console.error("Lỗi lấy danh sách banner:", err);
        res.status(500).send(err.message); 
    }
});

// ==================== 2. THÊM BANNER MỚI (Admin) ====================
app.post('/api/caidat/banner', upload.single('hinhAnh'), async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tenBanner, duongDan, viTri, thuTu, tieuDe, moTa, textNutBam } = req.body;
        
        // Lấy đường dẫn URL đầy đủ của ảnh vừa upload
        const hinhAnhUrl = req.file ? layUrlAnh(req.file.filename) : null;

        await pool.request()
            .input('tenBanner', sql.NVarChar, tenBanner)
            .input('hinhAnh', sql.VarChar, hinhAnhUrl)
            .input('duongDan', sql.VarChar, duongDan || '')
            .input('viTri', sql.VarChar, viTri)
            .input('thuTu', sql.Int, thuTu || 1)
            .input('tieuDe', sql.NVarChar, tieuDe || '')
            .input('moTa', sql.NVarChar, moTa || '')
            .input('textNutBam', sql.NVarChar, textNutBam || '')
            .query(`
                INSERT INTO BannerQC (tenBanner, hinhAnh, duongDan, viTri, thuTu, trangThai, tieuDe, moTa, textNutBam) 
                VALUES (@tenBanner, @hinhAnh, @duongDan, @viTri, @thuTu, 1, @tieuDe, @moTa, @textNutBam)
            `);
            
        res.json({ success: true, message: "Đã thêm Banner thành công!" });
    } catch (err) { 
        console.error("Lỗi thêm banner:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// ==================== 3. ĐỔI TRẠNG THÁI HIỂN THỊ BANNER (Bật / Tắt) ====================
app.put('/api/caidat/banner/trangthai/:id', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { id } = req.params;
        const { trangThai } = req.body;
        
        await pool.request()
            .input('maBanner', sql.Int, id)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query("UPDATE BannerQC SET trangThai = @trangThai WHERE maBanner = @maBanner");
            
        res.json({ success: true, message: "Đổi trạng thái thành công!" });
    } catch (err) { 
        console.error("Lỗi đổi trạng thái banner:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// ==================== 4. XÓA BANNER ====================
app.delete('/api/caidat/banner/:id', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { id } = req.params;
        
        await pool.request()
            .input('maBanner', sql.Int, id)
            .query("DELETE FROM BannerQC WHERE maBanner = @maBanner");
            
        res.json({ success: true, message: "Xóa banner thành công!" });
    } catch (err) { 
        console.error("Lỗi xóa banner:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});


// ================= API QUẢN LÝ FAQ (ADMIN) =================

// 1. Thêm Danh Mục mới
app.post('/api/admin/faq/danhmuc', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tenDanhMuc, thuTu } = req.body;
        
        await pool.request()
            .input('tenDanhMuc', sql.NVarChar(255), tenDanhMuc)
            .input('thuTu', sql.Int, thuTu || 1)
            .query("INSERT INTO DanhMucFAQ (tenDanhMuc, thuTu, trangThai) VALUES (@tenDanhMuc, @thuTu, 1)");
            
        res.json({ success: true, message: "Thêm danh mục thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// =========================== THEM CAU HOI ===================
app.post('/api/admin/faq/cauhoi', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        
        // 1. Lấy thêm linkLienQuan và anhLienQuan từ req.body
        const { maDanhMuc, cauHoi, traLoi, thuTu, linkLienQuan, anhLienQuan } = req.body;
        
        await pool.request()
            .input('maDanhMuc', sql.Int, maDanhMuc)
            .input('cauHoi', sql.NVarChar(sql.MAX), cauHoi)
            .input('traLoi', sql.NVarChar(sql.MAX), traLoi)
            .input('thuTu', sql.Int, thuTu || 1)
            // 2. Định nghĩa tham số mới, nếu không có thì truyền null
            .input('linkLienQuan', sql.NVarChar(sql.MAX), linkLienQuan || null)
            .input('anhLienQuan', sql.NVarChar(sql.MAX), anhLienQuan || null)
            .query(`
                INSERT INTO CauHoiFAQ (maDanhMuc, cauHoi, traLoi, thuTu, trangThai, linkLienQuan, anhLienQuan) 
                VALUES (@maDanhMuc, @cauHoi, @traLoi, @thuTu, 1, @linkLienQuan, @anhLienQuan)
            `);
            
        res.json({ success: true, message: "Thêm câu hỏi thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// 3. Xóa Câu hỏi
app.delete('/api/admin/faq/cauhoi/:id', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { id } = req.params;
        
        await pool.request()
            .input('maCauHoi', sql.Int, id)
            .query("DELETE FROM CauHoiFAQ WHERE maCauHoi = @maCauHoi");
            
        res.json({ success: true, message: "Đã xóa câu hỏi!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

 

















// =================================== USER ==========================================
//========== DANG NHAP KHÁCH HÀNG (USER) ===================
app.post('/api/user/dang-nhap', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let { taiKhoan, matKhau } = req.body;

        // Chỉ tìm theo email hoặc sdt
        let queryStr = `
            SELECT maKH, hoTen, email, sdt, trangThai, matKhau 
            FROM KhachHang 
            WHERE (email = @taiKhoan OR sdt = @taiKhoan) 
        `;

        let result = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query(queryStr);

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: "Tài khoản không chính xác!" });
        }

        let user = result.recordset[0];
        let isMatch = false;

        // KIỂM TRA MẬT KHẨU THÔNG MINH (Hỗ trợ cả pass cũ và pass đã băm)
        if (user.matKhau && (user.matKhau.startsWith('$2a$') || user.matKhau.startsWith('$2b$'))) {
            //   Mật khẩu ĐÃ BĂM (Tài khoản mới hoặc đã được nâng cấp)
            isMatch = await bcrypt.compare(matKhau, user.matKhau);
        } else {
            //   Mật khẩu CHƯA BĂM (Tài khoản cũ trong CSDL)
            isMatch = (matKhau === user.matKhau);

            // NẾU ĐĂNG NHẬP ĐÚNG -> TỰ ĐỘNG BĂM VÀ LƯU ĐÈ VÀO DB ĐỂ NÂNG CẤP BẢO MẬT!
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedMatKhau = await bcrypt.hash(matKhau, salt);

                await pool.request()
                    .input('maKH', sql.VarChar, user.maKH)
                    .input('matKhauMoi', sql.VarChar, hashedMatKhau)
                    .query(`UPDATE KhachHang SET matKhau = @matKhauMoi WHERE maKH = @maKH`);
            }
        }

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Mật khẩu không chính xác!" });
        }

        if (user.trangThai == 0) {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!" });
        }

        if (
            user.trangThai === 0 || 
            user.trangThai === '0' || 
            user.trangThai === 'da_khoa' || 
            user.trangThai === 'Đã khóa (Chặn)'
        ) {
            return res.status(403).json({ 
                success: false, 
                message: "Tài khoản của bạn đã bị khóa bởi quản trị viên!" 
            });
        }

        res.status(200).json({
            success: true,
            userInfo: {
                maKH: user.maKH,
                hoTen: user.hoTen,
                email: user.email,
                sdt: user.sdt
            }
        });

    } catch (err) {
        console.error("Lỗi đăng nhập User:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống, vui lòng thử lại sau!" });
    }
});

// =========================== CAP NHAT THONG TIN CA NHAN(USER) ===============================
app.put('/api/user/cap-nhat-info', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig); 

        // Nhận dữ liệu từ Frontend gửi lên
        let { maKH, hoTen, gioiTinh, ngaySinh, diaChi, sdt, email } = req.body;

        let validNgaySinh = (ngaySinh && ngaySinh.trim() !== "") ? ngaySinh : null;

        let queryUpdate = `
            UPDATE KhachHang 
            SET hoTen = @hoTen, 
                gioiTinh = @gioiTinh, 
                ngaySinh = @ngaySinh, 
                diaChi = @diaChi,
                SDT = @sdt,
                email = @email
            WHERE maKH = @maKH
        `;

        await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .input('hoTen', sql.NVarChar(50), hoTen || '')
            .input('gioiTinh', sql.NVarChar(10), gioiTinh || '')
            .input('ngaySinh', sql.Date, validNgaySinh)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi || '')
            .input('sdt', sql.VarChar(15), sdt || null)
            .input('email', sql.VarChar(255), email || null)
            .query(queryUpdate);

        res.status(200).json({ success: true, message: "Cập nhật thành công!" });

    } catch (err) {
        // NẾU VẪN LỖI, BẠN HÃY NHÌN VÀO TERMINAL CHẠY NODE.JS ĐỂ XEM DÒNG CONSOLE.ERROR NÀY
        console.error("LỖI SQL KHI CẬP NHẬT KHÁCH HÀNG:", err.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

// =================== ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG (USER) ===================
app.post('/api/user/dang-ky', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let { taiKhoan, matKhau } = req.body; // taiKhoan có thể là email hoặc sdt

        if (!taiKhoan || !matKhau) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        // 1. Kiểm tra xem tài khoản (email hoặc sdt) đã tồn tại trong bảng KhachHang chưa
        let checkExist = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query("SELECT maKH FROM KhachHang WHERE email = @taiKhoan OR SDT = @taiKhoan");

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Email hoặc số điện thoại này đã được đăng ký!" });
        }

        // 2. Phân loại đầu vào là Email hay Số điện thoại
        let isEmail = taiKhoan.includes("@");
        let emailVal = isEmail ? taiKhoan : null;
        let sdtVal = !isEmail ? taiKhoan : null;

        // 3. Mã hóa (Băm) mật khẩu bằng bcrypt trước khi lưu
        const salt = await bcrypt.genSalt(10);
        const hashedMatKhau = await bcrypt.hash(matKhau, salt);

        // 4. Tự động sinh mã khách hàng mới (Ví dụ: KH + timestamp để không bao giờ trùng)
        let maKH_Moi = "KH" + Date.now().toString().slice(-6);

        // 5. Lưu dữ liệu vào Database theo đúng cấu trúc bảng
        let insertQuery = `
            INSERT INTO KhachHang 
                (maKH, hoTen, email, SDT, matKhau, diemTichLuy, tongDonHang, trangThai)
            VALUES 
                (@maKH, @hoTen, @email, @SDT, @matKhau, @diemTichLuy, @tongDonHang, @trangThai)
        `;

        await pool.request()
            .input('maKH', sql.VarChar(20), maKH_Moi)
            .input('hoTen', sql.NVarChar(50), "Khách hàng mới") // Tên mặc định, sẽ đổi ở bước Cập nhật thông tin
            .input('email', sql.VarChar(255), emailVal)
            .input('SDT', sql.VarChar(15), sdtVal)
            .input('matKhau', sql.VarChar(255), hashedMatKhau) // Lưu mật khẩu đã mã hóa
            .input('diemTichLuy', sql.Int, 0)
            .input('tongDonHang', sql.Int, 0)
            .input('trangThai', sql.Bit, 1) // 1 là tài khoản đang hoạt động bình thường
            .query(insertQuery);

        res.status(200).json({ success: true, message: "Đăng ký thành công!" });

    } catch (err) {
        console.error("Lỗi đăng ký Khách hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

// ======================= DOI MAT KHAU ===================== 
app.put('/api/user/doi-mat-khau', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);

        let { maKH, matKhauCu, matKhauMoi } = req.body;

        // Cập nhật mật khẩu MỚI, với điều kiện Mật khẩu CŨ trong CSDL phai khop
        let queryUpdate = `
            UPDATE KhachHang 
            SET matKhau = @matKhauMoi
            WHERE maKH = @maKH AND matKhau = @matKhauCu
        `;

        let result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('matKhauCu', sql.VarChar, matKhauCu)
            .input('matKhauMoi', sql.VarChar, matKhauMoi)
            .query(queryUpdate);

        // Thuộc tính rowsAffected sẽ trả về số lượng dòng bị thay đổi
        // Nếu = 0, nghĩa là câu lệnh WHERE không tìm thấy ai khớp mật khẩu cũ -> Tức là gõ sai
        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu cũ không chính xác!"
            });
        }

        res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });

    } catch (err) {
        console.error("Lỗi đổi mật khẩu KH:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});



// ========================== DANH MUC SAN PHAM (USER) =========================

// =============================== VAN CHUYEN ==========================
app.get('/api/user/danhmuc', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT th.*
            FROM ThuongHieu th
        `;

        let result = await pool.request().query("SELECT * FROM ThuongHieu WHERE trangThai = 1");;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm flash sale:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});




// ========================== KHUYEN MAI FASHSALE (USER) =========================

// =============================== DANH SACH BANG KHUYEN MAI ==========================
app.get('/api/user/khuyenmai', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT 
                sp.maSP, sp.tenSP, sp.hinhAnh, sp.giaBan, sp.tag, sp.badge, sp.diemDanhGiaTB ,sp.soLuongDanhGia, 
                spfs.giaFlashSale, spfs.soLuongGioiHan, spfs.daBan,
                kgfs.maKhungGio, kgfs.gioBD, kgfs.gioKT, kgfs.ngayApDung,
                -- SQL tự động so sánh giờ thực tế để báo cho User
                CASE 
                    WHEN CAST(GETDATE() AS TIME) BETWEEN kgfs.gioBD AND kgfs.gioKT THEN N'Đang diễn ra'
                    WHEN CAST(GETDATE() AS TIME) > kgfs.gioKT THEN N'Đã kết thúc'
                    ELSE N'Sắp diễn ra'
                END AS trangThaiThucTe
            FROM KhungGioFlashSale kgfs
            JOIN SanPhamFlashSale spfs ON kgfs.maKhungGio = spfs.maKhungGio
            JOIN SanPham sp ON spfs.maSP = sp.maSP
            -- Chỉ lấy Flash Sale của ngày hôm nay
            WHERE CAST(kgfs.ngayApDung AS DATE) = CAST(GETDATE() AS DATE)
        `;
        let result = await pool.request().query(queryStr);
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi API Flash Sale:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// =============================== LẤY SẢN PHẨM THEO LOẠI (USER) ==========================
app.get('/api/sanpham/loai-san-pham/:maLSP', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let maLSP = req.params.maLSP;
        // Dùng WHERE maLSP để lọc sản phẩm
        let queryStr = `SELECT * FROM SanPham WHERE maLSP = @maLSP AND trangThai = 1`;

        let result = await pool.request()
            .input('maLSP', sql.VarChar, maLSP)
            .query(queryStr);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy sản phẩm theo loại:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});



// =============================== SAN PHAM ==========================
app.get('/api/sanpham', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let queryStr = `
            SELECT sp.*,lsp.tenLSP
            FROM SanPham sp
            left join LoaiSanPham lsp on sp.maLSP = lsp.maLSP
        `;

        let result = await pool.request().query(queryStr);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm flash sale:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// ======================= TÌM KIẾM SẢN PHẨM ===========================
app.get('/api/sanpham/tim-kiem', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { tuKhoa } = req.query; // Lấy từ khóa truyền lên từ Frontend

        if (!tuKhoa) {
            return res.json([]);
        }

        // Sử dụng câu lệnh LIKE để tìm kiếm gần đúng theo tên sản phẩm trong SQL Server
        let result = await pool.request()
            .input('tuKhoa', sql.VarChar, `%${tuKhoa}%`)
            .query(`
                SELECT maSP, tenSP, giaBan, hinhAnh 
                FROM SanPham 
                WHERE tenSP LIKE @tuKhoa
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi khi tìm kiếm sản phẩm:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// ============== DANH SÁCH THƯƠNG HIỆU (cho bộ lọc "Hãng sản xuất") ==============
app.get('/api/thuonghieu', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT maThuongHieu, tenThuongHieu, hinhAnh
            FROM ThuongHieu
            WHERE trangThai = 1
        `);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách thương hiệu:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});

// ============== SẢN PHẨM THEO TÊN THƯƠNG HIỆU (trang "Sản phẩm các hãng") ==============
app.get('/api/sanpham/thuonghieu/:tenHang', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        // Lấy tên hãng từ URL (Ví dụ: "Apple", "Samsung")
        const { tenHang } = req.params;

        let result = await pool.request()
            // Dùng NVarChar để lỡ sau này tên hãng có dấu tiếng Việt (VD: "Thiện Store") vẫn chạy tốt
            .input('tenHang', sql.NVarChar(50), tenHang)
            .query(`
                SELECT sp.*, lsp.tenLSP
                FROM SanPham sp
                LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
                /* SỬA QUAN TRỌNG: Lọc theo cột 'hang' thay vì 'maThuongHieu' */
                WHERE sp.hang = @tenHang AND sp.trangThai = 1
                ORDER BY sp.maSP DESC
            `);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy sản phẩm theo thương hiệu:", err);
        res.status(500).send("Lỗi server chi tiết: " + err.message);
    }
});


// ============== CHI TIẾT 1 SẢN PHẨM (trang "Chi tiết sản phẩm") ==============
// Trả về thông tin sản phẩm + tên hãng + tên loại + biến thể (tách sẵn dung lượng /
// màu sắc) + thông số kỹ thuật (đã sắp theo thuTu) trong 1 lần gọi.
 
app.get('/api/sanpham/chitiet/:maSP', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maSP } = req.params;

        const ketQuaSP = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT sp.*, spfs.giaFlashSale, kgfs.trangThai AS trangThaiFlashSale
                FROM SanPham sp
                LEFT JOIN SanPhamFlashSale spfs ON sp.maSP = spfs.maSP
                LEFT JOIN KhungGioFlashSale kgfs ON spfs.maKhungGio = kgfs.maKhungGio AND kgfs.trangThai = 'dang_dien_ra'
                WHERE sp.maSP = @maSP
            `);

        if (ketQuaSP.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }

        const ketQuaBienThe = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT maBienThe, loaiBienThe, giaTri, giaChenhLech, hinhAnh
                FROM BienTheSanPham
                WHERE maSP = @maSP
            `);

        const ketQuaThongSo = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT nhan, giaTri
                FROM ThongSoKyThuat
                WHERE maSP = @maSP
                ORDER BY thuTu
            `);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
            ...ketQuaSP.recordset[0],
            bienTheDungLuong: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'dungluong'),
            bienTheMauSac: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'mausac'),
            thongSoKyThuat: ketQuaThongSo.recordset,
        });
    } catch (err) {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});


// =============================== THÊM SẢN PHẨM ==========================
app.post('/api/sanpham/them', upload.array('anhSanPham', 10), async (req, res) => {
    let pool;
    let transaction;
    try {
        pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const { tenSP, hang, tenLSP, giaBan, tonKho, badge, tag, donVi } = req.body;

        // 1. TỰ ĐỘNG TÌM HOẶC TẠO MÃ LOẠI SẢN PHẨM (maLSP) TỪ tenLSP
        let maLSP_DB = null;
        if (tenLSP) {
            const reqLoai = new sql.Request(transaction);
            reqLoai.input('tenLSP', sql.NVarChar(100), tenLSP);
            let checkLoai = await reqLoai.query(`SELECT maLSP FROM LoaiSanPham WHERE tenLSP = @tenLSP`);
            
            if (checkLoai.recordset.length > 0) {
                maLSP_DB = checkLoai.recordset[0].maLSP; // Đã có loại này trong DB
            } else {
                // Chưa có -> Tự động thêm danh mục loại sản phẩm mới
                maLSP_DB = 'LSP' + Date.now().toString().slice(-4);
                const reqThemLoai = new sql.Request(transaction);
                await reqThemLoai
                    .input('maLSP', sql.VarChar(20), maLSP_DB)
                    .input('tenLSP', sql.NVarChar(100), tenLSP)
                    .query(`INSERT INTO LoaiSanPham (maLSP, tenLSP) VALUES (@maLSP, @tenLSP)`);
            }
        }

        // 2. TỰ ĐỘNG TẠO MÃ SẢN PHẨM
        let maSPMoi = 'SP' + Date.now().toString().slice(-6);

        // 3. XỬ LÝ ẢNH ĐẠI DIỆN
        const danhSachFile = req.files || [];
        let danhSachLinkAnh = [];
        if (req.body.anhLinks) {
            danhSachLinkAnh = JSON.parse(req.body.anhLinks);
        }

        let anhDaiDien = null;
        if (danhSachFile.length > 0) {
            anhDaiDien = layUrlAnh(danhSachFile[0].filename);
        } else if (danhSachLinkAnh.length > 0) {
            anhDaiDien = danhSachLinkAnh[0];
        }

        // 4. THÊM VÀO BẢNG SanPham (CHÚ Ý: Ở ĐÂY SỬ DỤNG maLSP CHỨ KHÔNG DÙNG tenLSP)
       const queryInsertSP = `
            INSERT INTO SanPham (maSP, tenSP, hang, maLSP, giaBan, tonKho, hinhAnh, trangThai, badge, tag, donVi)
            VALUES (@maSP, @tenSP, @hang, @maLSP, @giaBan, @tonKho, @hinhAnh, 1, @badge, @tag, @donVi)
        `;
        const request = new sql.Request(transaction);
        await request
            .input('maSP', sql.VarChar(20), maSPMoi)
            .input('tenSP', sql.NVarChar(255), tenSP)
            .input('hang', sql.NVarChar(100), hang)
            .input('maLSP', sql.VarChar(20), maLSP_DB)
            .input('giaBan', sql.Float, Number(giaBan))
            .input('tonKho', sql.Int, Number(tonKho))
            .input('hinhAnh', sql.VarChar(sql.MAX), anhDaiDien)
            .input('badge', sql.NVarChar(50), badge || null)
            .input('tag', sql.NVarChar(50), tag || null)
            .input('donVi', sql.NVarChar(50), donVi || 'Chiếc')
            .query(queryInsertSP);

        // 5. LƯU ẢNH UPLOAD (File)
        for (let i = 0; i < danhSachFile.length; i++) {
            const requestAnh = new sql.Request(transaction);
            await requestAnh
                .input('maSP', sql.VarChar(20), maSPMoi) 
                .input('duongDan', sql.VarChar(sql.MAX), layUrlAnh(danhSachFile[i].filename))
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        // 6. LƯU ẢNH LINK (URL)
        for (let link of danhSachLinkAnh) {
            const requestAnhLink = new sql.Request(transaction);
            await requestAnhLink
                .input('maSP', sql.VarChar(20), maSPMoi)
                .input('duongDan', sql.VarChar(sql.MAX), link)
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        // 7. LƯU THÔNG SỐ KỸ THUẬT
        if (req.body.thongSoKyThuat) {
            const thongSo = JSON.parse(req.body.thongSoKyThuat);
            for (let i = 0; i < thongSo.length; i++) {
                if (thongSo[i].ten && thongSo[i].giaTri) {
                    const reqTS = new sql.Request(transaction);
                    await reqTS
                        .input('maSP', sql.VarChar(20), maSPMoi)
                        .input('nhan', sql.NVarChar(255), thongSo[i].ten)
                        .input('giaTri', sql.NVarChar(sql.MAX), thongSo[i].giaTri)
                        .input('thuTu', sql.Int, i + 1)
                        .query(`INSERT INTO ThongSoKyThuat (maSP, nhan, giaTri, thuTu) VALUES (@maSP, @nhan, @giaTri, @thuTu)`);
                }
            }
        }

        // 8. LƯU BIẾN THỂ SẢN PHẨM (Dung lượng & Màu sắc)
        if (req.body.bienTheDungLuong) {
            const dungLuong = JSON.parse(req.body.bienTheDungLuong);
            for (let bt of dungLuong) {
                if (bt.ten) {
                    const maBT = 'BT' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
                    const reqBT = new sql.Request(transaction);
                    await reqBT
                        .input('maBienThe', sql.VarChar(20), maBT)
                        .input('maSP', sql.VarChar(20), maSPMoi)
                        .input('loaiBienThe', sql.VarChar(20), 'dungluong')
                        .input('giaTri', sql.NVarChar(255), bt.ten)
                        .input('giaChenhLech', sql.Float, Number(bt.giaChenhLech) || 0)
                        .input('hinhAnh', sql.VarChar(sql.MAX), null)
                        .query(`INSERT INTO BienTheSanPham (maBienThe, maSP, loaiBienThe, giaTri, giaChenhLech, hinhAnh) VALUES (@maBienThe, @maSP, @loaiBienThe, @giaTri, @giaChenhLech, @hinhAnh)`);
                }
            }
        }

        if (req.body.bienTheMauSac) {
            const mauSac = JSON.parse(req.body.bienTheMauSac);
            for (let bt of mauSac) {
                if (bt.ten) {
                    const maBT = 'BT' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
                    const reqBT = new sql.Request(transaction);
                    await reqBT
                        .input('maBienThe', sql.VarChar(20), maBT)
                        .input('maSP', sql.VarChar(20), maSPMoi)
                        .input('loaiBienThe', sql.VarChar(20), 'mausac')
                        .input('giaTri', sql.NVarChar(255), bt.ten)
                        .input('giaChenhLech', sql.Float, Number(bt.giaChenhLech) || 0)
                        .input('hinhAnh', sql.VarChar(sql.MAX), bt.hinhAnh || null)
                        .query(`INSERT INTO BienTheSanPham (maBienThe, maSP, loaiBienThe, giaTri, giaChenhLech, hinhAnh) VALUES (@maBienThe, @maSP, @loaiBienThe, @giaTri, @giaChenhLech, @hinhAnh)`);
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "Thêm sản phẩm thành công", newProductId: maSPMoi });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("LỖI SQL KHI THÊM SẢN PHẨM:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// =============================== SỬA SẢN PHẨM ==========================
app.put('/api/sanpham/sua/:maSP', upload.array('anhSanPham', 10), async (req, res) => {
    let pool;
    let transaction;
    try {
        pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

       const { maSP } = req.params;
        const { tenSP, hang, tenLSP, giaBan, tonKho, trangThai, badge, tag, donVi } = req.body;
        
        // SỬA LỖI TẠI ĐÂY: Nhận diện chính xác chữ "dang_ban" từ Frontend
        const isDangBan = trangThai == 1 || trangThai === "true" || trangThai === true || trangThai === "dang_ban";
        const trangThaiBit = isDangBan ? 1 : 0;

        // 1. TÌM HOẶC TẠO LẠI maLSP TỪ tenLSP
        let maLSP_DB = null;
        if (tenLSP) {
            const reqLoai = new sql.Request(transaction);
            reqLoai.input('tenLSP', sql.NVarChar(100), tenLSP);
            let checkLoai = await reqLoai.query(`SELECT maLSP FROM LoaiSanPham WHERE tenLSP = @tenLSP`);
            
            if (checkLoai.recordset.length > 0) {
                maLSP_DB = checkLoai.recordset[0].maLSP;
            } else {
                maLSP_DB = 'LSP' + Date.now().toString().slice(-4);
                const reqThemLoai = new sql.Request(transaction);
                await reqThemLoai
                    .input('maLSP', sql.VarChar(20), maLSP_DB)
                    .input('tenLSP', sql.NVarChar(100), tenLSP)
                    .query(`INSERT INTO LoaiSanPham (maLSP, tenLSP) VALUES (@maLSP, @tenLSP)`);
            }
        }

        // 2. CẬP NHẬT BẢNG SanPham
        const request = new sql.Request(transaction);
        await request
            .input('maSP', sql.VarChar(20), maSP)
            .input('tenSP', sql.NVarChar(255), tenSP)
            .input('hang', sql.NVarChar(100), hang)
            .input('maLSP', sql.VarChar(20), maLSP_DB)
            .input('giaBan', sql.Float, Number(giaBan))
            .input('tonKho', sql.Int, Number(tonKho))
            .input('trangThai', sql.Bit, trangThaiBit)
            .input('badge', sql.NVarChar(50), badge || null)
            .input('tag', sql.NVarChar(50), tag || null)
            .input('donVi', sql.NVarChar(50), donVi || 'Chiếc')
            .query(`
                UPDATE SanPham
                SET tenSP = @tenSP, hang = @hang, maLSP = @maLSP,
                    giaBan = @giaBan, tonKho = @tonKho, trangThai = @trangThai,
                    badge = @badge, tag = @tag, donVi = @donVi
                WHERE maSP = @maSP
            `);

        // 3. XỬ LÝ ẢNH
        const reqXoaAnh = new sql.Request(transaction);
        await reqXoaAnh.input('maSP', sql.VarChar(20), maSP).query(`DELETE FROM HinhAnhSanPham WHERE maSP = @maSP`);

        if (req.body.anhCu) {
            let danhSachAnhCu = JSON.parse(req.body.anhCu);
            for (let link of danhSachAnhCu) {
                const reqAnhCu = new sql.Request(transaction);
                await reqAnhCu
                    .input('maSP', sql.VarChar(20), maSP)
                    .input('duongDan', sql.VarChar(sql.MAX), link)
                    .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
            }
        }

        if (req.body.anhLinks) {
            let danhSachLinkAnh = JSON.parse(req.body.anhLinks);
            for (let link of danhSachLinkAnh) {
                const reqAnhLink = new sql.Request(transaction);
                await reqAnhLink
                    .input('maSP', sql.VarChar(20), maSP)
                    .input('duongDan', sql.VarChar(sql.MAX), link)
                    .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
            }
        }

        const danhSachFile = req.files || [];
        for (let i = 0; i < danhSachFile.length; i++) {
            const reqAnhFile = new sql.Request(transaction);
            await reqAnhFile
                .input('maSP', sql.VarChar(20), maSP)
                .input('duongDan', sql.VarChar(sql.MAX), layUrlAnh(danhSachFile[i].filename))
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        // 4. XỬ LÝ BIẾN THỂ (Xóa cũ, Thêm mới)
        const reqXoaBT = new sql.Request(transaction);
        await reqXoaBT.input('maSP', sql.VarChar(20), maSP).query(`DELETE FROM BienTheSanPham WHERE maSP = @maSP`);

        if (req.body.bienTheDungLuong) {
            const dungLuong = JSON.parse(req.body.bienTheDungLuong);
            for (let bt of dungLuong) {
                if (bt.ten) {
                    const maBT = 'BT' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
                    const reqBT = new sql.Request(transaction);
                    await reqBT
                        .input('maBienThe', sql.VarChar(20), maBT)
                        .input('maSP', sql.VarChar(20), maSP)
                        .input('loaiBienThe', sql.VarChar(20), 'dungluong')
                        .input('giaTri', sql.NVarChar(255), bt.ten)
                        .input('giaChenhLech', sql.Float, Number(bt.giaChenhLech) || 0)
                        .input('hinhAnh', sql.VarChar(sql.MAX), null)
                        .query(`INSERT INTO BienTheSanPham (maBienThe, maSP, loaiBienThe, giaTri, giaChenhLech, hinhAnh) VALUES (@maBienThe, @maSP, @loaiBienThe, @giaTri, @giaChenhLech, @hinhAnh)`);
                }
            }
        }

        if (req.body.bienTheMauSac) {
            const mauSac = JSON.parse(req.body.bienTheMauSac);
            for (let bt of mauSac) {
                if (bt.ten) {
                    const maBT = 'BT' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
                    const reqBT = new sql.Request(transaction);
                    await reqBT
                        .input('maBienThe', sql.VarChar(20), maBT)
                        .input('maSP', sql.VarChar(20), maSP)
                        .input('loaiBienThe', sql.VarChar(20), 'mausac')
                        .input('giaTri', sql.NVarChar(255), bt.ten)
                        .input('giaChenhLech', sql.Float, Number(bt.giaChenhLech) || 0)
                        .input('hinhAnh', sql.VarChar(sql.MAX), bt.hinhAnh || null)
                        .query(`INSERT INTO BienTheSanPham (maBienThe, maSP, loaiBienThe, giaTri, giaChenhLech, hinhAnh) VALUES (@maBienThe, @maSP, @loaiBienThe, @giaTri, @giaChenhLech, @hinhAnh)`);
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("LỖI CẬP NHẬT SẢN PHẨM:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// ============================================================
// =============== GIỎ HÀNG (USER) =============================
// GIẢ ĐỊNH: bảng GioHang đã đổi sang dùng khóa chính phụ
// "maGioHang INT IDENTITY(1,1) PRIMARY KEY" thay vì composite key
// (maKH, maSP, maBienThe) - xem SQL migrate đã gửi kèm hướng dẫn.
// ============================================================

// Xem giỏ hàng của 1 khách hàng
app.get('/api/giohang/:maKH', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maKH } = req.params;

        const result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT 
                    gh.maGioHang, gh.maKH, gh.maSP, gh.maBienThe, gh.soLuong,
                    sp.tenSP, sp.hinhAnh, sp.giaBan,
                    bt.giaTri AS bienTheGiaTri, bt.giaChenhLech
                FROM GioHang gh
                JOIN SanPham sp ON gh.maSP = sp.maSP
                LEFT JOIN BienTheSanPham bt ON gh.maBienThe = bt.maBienThe
                WHERE gh.maKH = @maKH
                ORDER BY gh.ngayThem DESC
            `);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy giỏ hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// Thêm sản phẩm vào giỏ (dùng ở nút "Thêm vào giỏ hàng" tại trang chi tiết sản phẩm)
// Nếu sản phẩm (+ biến thể) đã có sẵn trong giỏ -> cộng dồn số lượng thay vì tạo dòng mới
app.post('/api/giohang/them', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maKH, maSP, maBienThe, tenPhanLoai, soLuong, giaTaiThoiDiemThem } = req.body;

        // ================= THUẬT TOÁN XỬ LÝ GIÁ THÔNG MINH =================
        // 1. Lấy giá gốc của sản phẩm từ Database
        const spResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`SELECT giaBan FROM SanPham WHERE maSP = @maSP`);
        
        const giaGoc = spResult.recordset.length > 0 ? Number(spResult.recordset[0].giaBan) : 0;
        const giaTruyenLen = Number(giaTaiThoiDiemThem) || 0;

        // 2. Tự động nhận diện thói quen nhập liệu của bạn:
        // - Nếu giá truyền lên nhỏ hơn giá gốc (VD: 0đ hoặc 4.000.000đ) 
        //   => Đây là cách nhập mới -> Lấy Giá Gốc + Giá Phụ Thu.
        // - Nếu giá truyền lên lớn hơn hoặc bằng giá gốc (VD: 6.490.000đ) 
        //   => Đây là sản phẩm cũ (đã nhập tổng giá) -> Giữ nguyên để không bị cộng dồn gấp đôi.
        let giaThucTe = giaTruyenLen;
        if (giaTruyenLen < giaGoc) {
            giaThucTe = giaGoc + giaTruyenLen;
        }
        // ===================================================================

        const kiemTraQuery = `
            SELECT * FROM GioHang 
            WHERE maKH = @maKH AND maSP = @maSP AND ISNULL(tenPhanLoai, '') = ISNULL(@tenPhanLoai, '')
        `;
        const checkResult = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('maSP', sql.VarChar, maSP)
            .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
            .query(kiemTraQuery);

        if (checkResult.recordset.length > 0) {
            // Nếu đã có sẵn phiên bản màu/dung lượng này -> Chỉ cộng dồn số lượng
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                .input('soLuongThem', sql.Int, soLuong)
                .query(`
                    UPDATE GioHang 
                    SET soLuong = soLuong + @soLuongThem 
                    WHERE maKH = @maKH AND maSP = @maSP AND ISNULL(tenPhanLoai, '') = ISNULL(@tenPhanLoai, '')
                `);
        } else {
            // Nếu là phiên bản mới -> Thêm dòng mới vào giỏ hàng với giá thực tế đã tính
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .input('maBienThe', sql.VarChar, maBienThe)
                .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                .input('soLuong', sql.Int, soLuong)
                .input('gia', sql.Int, giaThucTe) // ĐÃ SỬA: Lưu giá đã tính toán thay vì giá cũ
                .query(`
                    INSERT INTO GioHang (maKH, maSP, maBienThe, tenPhanLoai, soLuong, gia) 
                    VALUES (@maKH, @maSP, @maBienThe, @tenPhanLoai, @soLuong, @gia)
                `);
        }

        res.status(200).json({ success: true, message: "Đã thêm vào giỏ hàng" });
    } catch (error) {
        console.error("Lỗi API thêm giỏ hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// Cập nhật số lượng 1 dòng trong giỏ (dùng cho nút + / -)
// Nếu số lượng gửi lên <= 0 thì tự xóa luôn dòng đó khỏi giỏ
app.put('/api/giohang/capnhat-soluong/:maGioHang', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maGioHang } = req.params;
        const { soLuong } = req.body;

        if (Number(soLuong) <= 0) {
            await pool.request()
                .input('maGioHang', sql.Int, maGioHang)
                .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);
            return res.status(200).json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ" });
        }

        await pool.request()
            .input('maGioHang', sql.Int, maGioHang)
            .input('soLuong', sql.Int, soLuong)
            .query(`UPDATE GioHang SET soLuong = @soLuong WHERE maGioHang = @maGioHang`);

        res.status(200).json({ success: true, message: "Đã cập nhật số lượng" });
    } catch (err) {
        console.error("Lỗi cập nhật số lượng giỏ hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// Xóa hẳn 1 dòng khỏi giỏ (nút "Xóa khỏi giỏ")
app.delete('/api/giohang/:maGioHang', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maGioHang } = req.params;

        await pool.request()
            .input('maGioHang', sql.Int, maGioHang)
            .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);

        res.status(200).json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ" });
    } catch (err) {
        console.error("Lỗi xóa giỏ hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// =============== ÁP DỤNG MÃ GIẢM GIÁ =============================
// GIẢ ĐỊNH: bảng KhuyenMai không có cột "mã code" riêng để khách nhập,
// nên tạm dùng "tenKM" làm mã nhập (khách phải gõ đúng tên chương trình).
// Nếu muốn có mã code thật (VD "SALE50"), cần ALTER TABLE KhuyenMai
// ADD maCode VARCHAR(30) và đổi điều kiện WHERE bên dưới từ tenKM -> maCode.
app.post('/api/khuyenmai/ap-dung', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maNhap } = req.body;

        const result = await pool.request()
            .input('maNhap', sql.NVarChar, maNhap)
            .query(`
                SELECT maKM, tenKM, phanTram FROM KhuyenMai
                WHERE tenKM = @maNhap AND trangThai = 1
                AND GETDATE() BETWEEN ngayBD AND ngayKT
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
        }

        res.status(200).json({ success: true, khuyenMai: result.recordset[0] });
    } catch (err) {
        console.error("Lỗi áp dụng mã giảm giá:", err);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});




// ============================================================
// =============== ĐẶT HÀNG (checkout) =========================
// Tạo địa chỉ giao hàng -> hóa đơn -> chi tiết hóa đơn -> thanh toán
// -> vận chuyển, tất cả trong 1 transaction, rồi xóa giỏ hàng.
// GIẢ ĐỊNH: đã sửa bảng DiaChiGiaoHang thêm cột "diaChiChiTiet" (xem
// ghi chú SQL kèm theo). "Email nhận thông tin đơn hàng" không có chỗ
// lưu trong schema hiện tại nên KHÔNG được lưu vào DB.
// ============================================================
// =============== ĐẶT HÀNG (checkout) =========================
app.post('/api/hoadon/dat-hang', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const { maKH, hoTen, sdt, diaChi, phuongThuc, maKM, danhSachSanPham } = req.body;

        if (!maKH || !hoTen || !sdt || !diaChi || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc để đặt hàng." });
        }

        // 1. Tạo địa chỉ giao hàng
        const reqKiemTraDiaChi = new sql.Request(transaction);
        const kiemTraKetQua = await reqKiemTraDiaChi
            .input('maKH', sql.VarChar(20), maKH)
            .input('hoTenNguoiNhan', sql.NVarChar(50), hoTen)
            .input('SDT', sql.VarChar(15), sdt)
            .input('diaChiChiTiet', sql.NVarChar(sql.MAX), diaChi)
            .query(`
                SELECT maDiaChi FROM DiaChiGiaoHang 
                WHERE maKH = @maKH 
                  AND hoTenNguoiNhan = @hoTenNguoiNhan 
                  AND SDT = @SDT 
                  AND diaChiChiTiet = @diaChiChiTiet
            `);

        let maDiaChi;
        if (kiemTraKetQua.recordset.length > 0) {
            maDiaChi = kiemTraKetQua.recordset[0].maDiaChi;
        } else {
            const reqThemDiaChi = new sql.Request(transaction);
            const ketQuaThem = await reqThemDiaChi
                .input('maKH', sql.VarChar(20), maKH)
                .input('hoTenNguoiNhan', sql.NVarChar(50), hoTen)
                .input('SDT', sql.VarChar(15), sdt)
                .input('diaChiChiTiet', sql.NVarChar(sql.MAX), diaChi)
                .query(`
                    INSERT INTO DiaChiGiaoHang (maKH, hoTenNguoiNhan, SDT, diaChiChiTiet, macDinh)
                    OUTPUT INSERTED.maDiaChi
                    VALUES (@maKH, @hoTenNguoiNhan, @SDT, @diaChiChiTiet, 0)
                `);
            maDiaChi = ketQuaThem.recordset[0].maDiaChi;
        }

        // ================= TÍNH TIỀN ĐỒNG BỘ VỚI FRONTEND =================
        // 2. Tính tổng tiền
        let tongTienHang = 0;
        for (let sp of danhSachSanPham) {
            // Lấy chính xác biến sp.gia (từ Giỏ hàng) hoặc sp.giaBan (từ Mua ngay) mà React gửi xuống
            sp.giaThucTe = Number(sp.gia) || Number(sp.giaBan) || 0; 
            
            tongTienHang += sp.giaThucTe * (Number(sp.soLuong) || 0);
        }
        let tongTienCuoi = tongTienHang;
        // =================================================================

        // 3. Tạo hóa đơn
        const maHoaDon = 'HD' + Date.now();
        const reqHoaDon = new sql.Request(transaction);
        await reqHoaDon
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .input('tongTien', sql.Float, tongTienCuoi)
            .input('maKH', sql.VarChar(20), maKH)
            .input('maKM', sql.VarChar(20), maKM || null)
            .input('maDiaChi', sql.Int, maDiaChi)
            .query(`
                INSERT INTO HoaDon (maHoaDon, tongTien, maKH, maNV, maKM, maDiaChi, thoiGianLap, trangThai)
                VALUES (@maHoaDon, @tongTien, @maKH, NULL, @maKM, @maDiaChi, GETDATE(), 'cho_xac_nhan')
            `);

        // 4. Chi tiết hóa đơn
        for (const sp of danhSachSanPham) {
            const reqCT = new sql.Request(transaction);
            await reqCT
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .input('maSP', sql.VarChar(20), sp.maSP)
                .input('maBienThe', sql.VarChar(20), sp.maBienThe || null)
                .input('soLuong', sql.Int, sp.soLuong)
                .input('giaBan', sql.Float, sp.giaThucTe) // Đã lưu đúng giá thực tế
                .query(`
                    INSERT INTO ChiTietHoaDon (maHoaDon, maSP, maBienThe, soLuong, giaBan)
                    VALUES (@maHoaDon, @maSP, @maBienThe, @soLuong, @giaBan)
                `);
        }

        // 5. Thanh toán
        const maThanhToan = 'TT' + Date.now();
        const reqTT = new sql.Request(transaction);
        await reqTT
            .input('maThanhToan', sql.VarChar(20), maThanhToan)
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .input('phuongThuc', sql.VarChar(30), phuongThuc || 'cod')
            .input('soTien', sql.Float, tongTienCuoi)
            .query(`
                INSERT INTO ThanhToan (maThanhToan, maHoaDon, phuongThuc, soTien, trangThai, thoiGian)
                VALUES (@maThanhToan, @maHoaDon, @phuongThuc, @soTien, 'cho_thanh_toan', GETDATE())
            `);

        // 6. Vận chuyển
        const maVanChuyen = 'VC' + Date.now();
        const reqVC = new sql.Request(transaction);
        await reqVC
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .query(`
                INSERT INTO VanChuyen (maVanChuyen, maHoaDon, donViVanChuyen, maVanDon, phiVanChuyen, trangThai, ngayGiaoDuKien)
                VALUES (@maVanChuyen, @maHoaDon, NULL, NULL, 0, 'cho_lay_hang', DATEADD(day, 3, GETDATE()))
            `);

        // 7. Xóa giỏ hàng
        const reqXoaGio = new sql.Request(transaction);
        await reqXoaGio
            .input('maKH', sql.VarChar(20), maKH)
            .query(`DELETE FROM GioHang WHERE maKH = @maKH`);

        await transaction.commit();
        res.status(200).json({ success: true, message: "Đặt hàng thành công", maHoaDon, tongTien: tongTienCuoi });

    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
});

// ================= API HỦY ĐƠN HÀNG (USER  ) =================
app.put('/api/hoadon/huy-don/:maHoaDon', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let maHoaDon = req.params.maHoaDon;


        let result = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                UPDATE HoaDon 
                SET trangThai = 'da_huy' 
                WHERE maHoaDon = @maHoaDon AND trangThai = 'cho_xac_nhan'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ success: false, message: "Không thể hủy đơn hàng này (có thể đã được xử lý)." });
        }

        // 2. TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI VẬN CHUYỂN SANG 'da_huy' ĐỂ ĐỒNG BỘ
        await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                UPDATE VanChuyen 
                SET trangThai = 'da_huy' 
                WHERE maHoaDon = @maHoaDon
            `);

        res.json({ success: true, message: "Hủy đơn hàng và cập nhật vận chuyển thành công!" });
    } catch (err) {
        console.error("Lỗi khi hủy đơn:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// ======================= LỊCH SỬ ĐẶT HÀNG (USER) ===========================
app.get('/api/hoadon/khachhang/:maKH', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH } = req.params;

        let orderResult = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT hd.maHoaDon, hd.tongTien, hd.thoiGianLap, hd.trangThai, 
                       vc.ngayGiaoDuKien, 
                       dc.hoTenNguoiNhan, dc.SDT, dc.diaChiChiTiet,
                       tt.phuongThuc
                FROM HoaDon hd
                LEFT JOIN VanChuyen vc ON hd.maHoaDon = vc.maHoaDon
                LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
                LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
                WHERE hd.maKH = @maKH
                ORDER BY hd.thoiGianLap DESC
            `);

        let danhSachDonHang = orderResult.recordset;

        for (let donHang of danhSachDonHang) {
            let detailResult = await pool.request()
                .input('maHoaDon', sql.VarChar(20), donHang.maHoaDon)
                .query(`
                    SELECT ct.soLuong, ct.giaBan, sp.tenSP, sp.hinhAnh, bt.giaTri as mauSac
                    FROM ChiTietHoaDon ct
                    JOIN SanPham sp ON ct.maSP = sp.maSP
                    LEFT JOIN BienTheSanPham bt ON ct.maBienThe = bt.maBienThe
                    WHERE ct.maHoaDon = @maHoaDon
                `);
            donHang.chiTietSanPham = detailResult.recordset;
        }

        res.json(danhSachDonHang);
    } catch (err) {
        console.error("Lỗi lấy đơn hàng:", err);
        res.status(500).send("Lỗi lấy đơn hàng: " + err.message);
    }
});


// =================  YÊU THÍCH SẢN PHẨM (USER) =================

//   API Bật/Tắt Yêu Thích (Toggle)
app.post('/api/yeuthich/toggle', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH, maSP } = req.body;

        if (!maKH || !maSP) {
            return res.status(400).json({ success: false, message: "Thiếu mã khách hàng hoặc mã sản phẩm" });
        }

        // Kiểm tra xem khách hàng đã tym sản phẩm này chưa
        let check = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('maSP', sql.VarChar, maSP)
            .query("SELECT * FROM SanPhamYeuThich WHERE maKH = @maKH AND maSP = @maSP");

        if (check.recordset.length > 0) {
            // Nếu đã có -> Xóa khỏi danh sách yêu thích
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .query("DELETE FROM SanPhamYeuThich WHERE maKH = @maKH AND maSP = @maSP");
            res.json({ success: true, action: 'removed' });
        } else {
            // Nếu chưa có -> Thêm vào danh sách yêu thích
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .query("INSERT INTO SanPhamYeuThich (maKH, maSP) VALUES (@maKH, @maSP)");
            res.json({ success: true, action: 'added' });
        }
    } catch (err) {
        console.error("Lỗi API toggle yêu thích:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

//   API Lấy danh sách sản phẩm yêu thích của 1 khách hàng
app.get('/api/yeuthich/:maKH', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH } = req.params;

        let result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT sp.* 
                FROM SanPham sp
                INNER JOIN SanPhamYeuThich yt ON sp.maSP = yt.maSP
                WHERE yt.maKH = @maKH
                ORDER BY yt.ngayThem DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách yêu thích:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});



// ================= API ĐÁNH GIÁ SẢN PHẨM (USER) =================

// 1. API Lấy danh sách đánh giá (Bao gồm Cả Hình ảnh & Phản hồi)
app.get('/api/danhgia/:maSP', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maSP } = req.params;

        // BƯỚC 1: Lấy thông tin đánh giá gốc + Tên khách hàng + Phản hồi của Shop (nếu có)
        let danhGiaResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`
                SELECT dg.maDanhGia, dg.maSP, dg.maKH, dg.soSao, dg.noiDung, dg.daMuaHang, dg.ngayTao,
                       kh.hoTen AS userName,
                       ph.noiDung AS shopReply, ph.ngayTao AS ngayReply
                FROM DanhGiaSanPham dg
                LEFT JOIN KhachHang kh ON dg.maKH = kh.maKH
                LEFT JOIN PhanHoiDanhGia ph ON dg.maDanhGia = ph.maDanhGia
                WHERE dg.maSP = @maSP
                ORDER BY dg.ngayTao DESC
            `);

        let dsDanhGia = danhGiaResult.recordset;

        // BƯỚC 2: Lấy toàn bộ hình ảnh thuộc các đánh giá của sản phẩm này
        let hinhAnhResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`
                SELECT ha.maDanhGia, ha.duongDanDanhGia 
                FROM HinhAnhDanhGia ha
                INNER JOIN DanhGiaSanPham dg ON ha.maDanhGia = dg.maDanhGia
                WHERE dg.maSP = @maSP
            `);

        let dsHinhAnh = hinhAnhResult.recordset;

        // BƯỚC 3: Gắn mảng hình ảnh vào từng đánh giá tương ứng
        let ketQua = dsDanhGia.map(dg => {
            return {
                ...dg,
                hinhAnh: dsHinhAnh.filter(ha => ha.maDanhGia === dg.maDanhGia).map(ha => ha.duongDanDanhGia)
            };
        });

        res.json(ketQua);
    } catch (err) {
        console.error("Lỗi lấy danh sách đánh giá:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});

// 2. API Thêm đánh giá mới (Hỗ trợ lưu mảng hình ảnh)
app.post('/api/danhgia/them', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        // mảng hinhAnh chứa các chuỗi đường dẫn ảnh (ví dụ: ['/img/a.jpg', '/img/b.jpg'])
        const { maSP, maKH, soSao, noiDung, hinhAnh = [] } = req.body;

        if (!maKH) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

        // Insert đánh giá và lấy ID vừa tạo (SCOPE_IDENTITY)
        let insertResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .input('maKH', sql.VarChar, maKH)
            .input('soSao', sql.Int, soSao)
            .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
            .query(`
                INSERT INTO DanhGiaSanPham (maSP, maKH, soSao, noiDung, daMuaHang, ngayTao)
                VALUES (@maSP, @maKH, @soSao, @noiDung, 1, GETDATE());
                
                SELECT SCOPE_IDENTITY() AS maDanhGiaMoi;
            `);

        let maDanhGiaMoi = insertResult.recordset[0].maDanhGiaMoi;

        // Nếu khách có gửi kèm hình ảnh, insert vào bảng HinhAnhDanhGia
        if (hinhAnh.length > 0) {
            for (let url of hinhAnh) {
                await pool.request()
                    .input('maDanhGia', sql.Int, maDanhGiaMoi)
                    .input('duongDanDanhGia', sql.VarChar(255), url)
                    .query(`
                        INSERT INTO HinhAnhDanhGia (maDanhGia, duongDanDanhGia) 
                        VALUES (@maDanhGia, @duongDanDanhGia)
                    `);
            }
        }

        res.json({ success: true, message: "Đã gửi đánh giá thành công!" });
    } catch (err) {
        console.error("Lỗi thêm đánh giá:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});


// ================= API SỬA/XÓA ĐÁNH GIÁ =================
// 1. API Sửa đánh giá
app.put('/api/danhgia/sua/:maDanhGia', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDanhGia } = req.params;
        const { maKH, soSao, noiDung } = req.body;

        let result = await pool.request()
            .input('maDanhGia', sql.Int, maDanhGia)
            .input('maKH', sql.VarChar, maKH)
            .input('soSao', sql.Int, soSao)
            .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
            .query(`
                UPDATE DanhGiaSanPham 
                SET soSao = @soSao, noiDung = @noiDung 
                WHERE maDanhGia = @maDanhGia AND maKH = @maKH
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(403).json({ success: false, message: "Không thể sửa đánh giá (sai User hoặc không tồn tại)." });
        }
        res.json({ success: true, message: "Cập nhật đánh giá thành công." });
    } catch (err) {
        console.error("Lỗi sửa đánh giá:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// 2. API Xóa đánh giá
app.delete('/api/danhgia/xoa/:maDanhGia', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maDanhGia } = req.params;
        const { maKH } = req.body;

        // Kiểm tra xem đánh giá có phải của khách hàng này không
        let check = await pool.request()
            .input('maDanhGia', sql.Int, maDanhGia)
            .input('maKH', sql.VarChar, maKH)
            .query(`SELECT maDanhGia FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia AND maKH = @maKH`);

        if (check.recordset.length === 0) {
            return res.status(403).json({ success: false, message: "Không có quyền xóa đánh giá này." });
        }

        // Xóa dữ liệu ở các bảng con trước (Hình ảnh, Phản hồi) rồi mới xóa Đánh giá
        await pool.request().input('maDanhGia', sql.Int, maDanhGia).query(`
            DELETE FROM HinhAnhDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia;
        `);

        res.json({ success: true, message: "Xóa đánh giá thành công." });
    } catch (err) {
        console.error("Lỗi xóa đánh giá:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// ================= YÊU CẦU ĐỔI TRẢ (USER) =================
app.post('/api/user/doitrahang/tao', upload.single('hinhAnh'), async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maHoaDon, lyDo, loaiYeuCau } = req.body;

        // 1. TỰ ĐỘNG TÌM MÃ SẢN PHẨM TỪ MÃ HÓA ĐƠN
        let checkHD = await pool.request()
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .query('SELECT TOP 1 maSP FROM ChiTietHoaDon WHERE maHoaDon = @maHoaDon');

        // Nếu mã hóa đơn không tồn tại trong DB, chặn lại ngay
        if (checkHD.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Mã hóa đơn không tồn tại. Vui lòng kiểm tra lại!"
            });
        }

        // Lấy mã sản phẩm có thật để truyền vào DoiTraHang
        let maSP_TimDuoc = checkHD.recordset[0].maSP;

        // 2. LƯU VÀO DATABASE
        const hinhAnhUrl = req.file ? layUrlAnh(req.file.filename) : null;
        const maDoiTra = 'DT' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .input('maSP', sql.VarChar(20), maSP_TimDuoc) // ĐÃ SỬA: Truyền mã SP có thật thay vì null
            .input('lyDo', sql.NVarChar(sql.MAX), lyDo)
            .input('loaiYeuCau', sql.VarChar(50), loaiYeuCau || 'doi_hang')
            .input('trangThai', sql.VarChar(20), 'cho_duyet')
            .input('hinhAnh', sql.NVarChar(sql.MAX), hinhAnhUrl)
            .query(`
                INSERT INTO DoiTraHang (maDoiTra, maHoaDon, maSP, lyDo, loaiYeuCau, trangThai, ngayTao, hinhAnh)
                VALUES (@maDoiTra, @maHoaDon, @maSP, @lyDo, @loaiYeuCau, @trangThai, GETDATE(), @hinhAnh)
            `);

        res.json({ success: true, message: "Gửi yêu cầu đổi trả thành công!" });
    } catch (err) {
        console.error("Lỗi tạo đổi trả (Chi tiết để debug):", err);
        // Trả lỗi từ CSDL về React để bạn dễ nhìn thấy nguyên nhân
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});

// ========================= API LẤY LỊCH SỬ ĐỔI TRẢ HÀNG ==================== 
app.get('/api/user/doitrahang/:maKH', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH } = req.params;

        // Kết nối bảng DoiTraHang với HoaDon để xác định yêu cầu của khách hàng nào
        let result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT dtr.*, sp.tenSP 
                FROM DoiTraHang dtr
                JOIN HoaDon hd ON dtr.maHoaDon = hd.maHoaDon
                LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
                WHERE hd.maKH = @maKH
                ORDER BY dtr.ngayTao DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy lịch sử đổi trả user:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});


// ================= API LẤY DANH SÁCH FAQ (USER) =================
app.get('/api/faq', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let resultDanhMuc = await pool.request().query("SELECT * FROM DanhMucFAQ WHERE trangThai = 1 ORDER BY thuTu ASC");
        let resultCauHoi = await pool.request().query("SELECT * FROM CauHoiFAQ WHERE trangThai = 1 ORDER BY thuTu ASC");
        let danhSachFAQ = resultDanhMuc.recordset.map(dm => {
            return {
                ...dm,
                cauHoiList: resultCauHoi.recordset.filter(ch => ch.maDanhMuc === dm.maDanhMuc)
            };
        });

        res.json(danhSachFAQ);
    } catch (err) {
        console.error("Lỗi lấy danh sách FAQ:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});



// ========================== DANH SACH DIA CHI GIAO HANG ========================
app.get('/api/diachi/:maKH', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maKH } = req.params;
        
        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT * FROM DiaChiGiaoHang 
                WHERE maKH = @maKH AND (daXoa = 0 OR daXoa IS NULL) 
                ORDER BY macDinh DESC
            `);
            
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ====================== THEM DIA CHI GIAO HANG ======================= 
app.post('/api/diachi/them', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maKH, hoTenNguoiNhan, SDT, diaChiChiTiet } = req.body;

        // Kiểm tra xem khách hàng này đã có địa chỉ nào chưa
        const checkResult = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`SELECT COUNT(*) as SoLuong FROM DiaChiGiaoHang WHERE maKH = @maKH`);
        
        // Nếu chưa có địa chỉ nào -> Tự động đánh dấu đây là địa chỉ Mặc định (1)
        const isMacDinh = checkResult.recordset[0].SoLuong === 0 ? 1 : 0;

        await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('hoTenNguoiNhan', sql.NVarChar, hoTenNguoiNhan)
            .input('SDT', sql.VarChar, SDT)
            .input('diaChiChiTiet', sql.NVarChar, diaChiChiTiet)
            .input('macDinh', sql.Bit, isMacDinh)
            .query(`
                INSERT INTO DiaChiGiaoHang (maKH, hoTenNguoiNhan, SDT, diaChiChiTiet, macDinh)
                VALUES (@maKH, @hoTenNguoiNhan, @SDT, @diaChiChiTiet, @macDinh)
            `);
            
        res.status(200).json({ success: true, message: "Thêm địa chỉ thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================== DIA CHI GIAO HANG MAC DINH ======================== 
app.put('/api/diachi/sua/:maDiaChi', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maDiaChi } = req.params;
        const { hoTenNguoiNhan, SDT, diaChiChiTiet } = req.body;

        await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .input('hoTenNguoiNhan', sql.NVarChar, hoTenNguoiNhan)
            .input('SDT', sql.VarChar, SDT)
            .input('diaChiChiTiet', sql.NVarChar, diaChiChiTiet)
            .query(`
                UPDATE DiaChiGiaoHang 
                SET hoTenNguoiNhan = @hoTenNguoiNhan, 
                    SDT = @SDT, 
                    diaChiChiTiet = @diaChiChiTiet
                WHERE maDiaChi = @maDiaChi
            `);
            
        res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ======================= XOA DIA CHI GIAO HANG =====================
app.delete('/api/diachi/xoa/:maDiaChi', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maDiaChi } = req.params;

        // Chặn xóa nếu địa chỉ này đang là Mặc định
        const checkResult = await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .query(`SELECT macDinh FROM DiaChiGiaoHang WHERE maDiaChi = @maDiaChi`);
            
        if (checkResult.recordset.length > 0 && checkResult.recordset[0].macDinh) {
            return res.status(400).json({ success: false, message: "Không thể xóa địa chỉ mặc định! Hãy chọn địa chỉ khác làm mặc định trước." });
        }

        // Dùng UPDATE thay vì DELETE để ẩn địa chỉ
        await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .query(`UPDATE DiaChiGiaoHang SET daXoa = 1 WHERE maDiaChi = @maDiaChi`);

        res.status(200).json({ success: true, message: "Đã xóa địa chỉ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

 
// ================= LICH SU MUA HANG ==========================
app.get('/api/hoadon/lich-su/:maKH', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maKH } = req.params;

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT 
                    hd.maHoaDon, 
                    hd.tongTien, 
                    hd.maKH, 
                    hd.maNV, 
                    hd.maKM, 
                    hd.maDiaChi, 
                    hd.thoiGianLap, 
                    hd.trangThai,
                    kh.hoTen as hoTenKhachHang,
                    dcgh.hoTenNguoiNhan,
                    dcgh.SDT,
                    dcgh.diaChiChiTiet
                FROM HoaDon hd
                JOIN KhachHang kh ON hd.maKH = kh.maKH
                LEFT JOIN DiaChiGiaoHang dcgh ON hd.maDiaChi = dcgh.maDiaChi
                WHERE hd.maKH = @maKH
                ORDER BY hd.thoiGianLap DESC
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error("Lỗi lấy lịch sử đơn hàng:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});


// ================= LẤY CHI TIẾT HÓA ĐƠN ĐỂ ĐẶT LẠI ==========================
app.get('/api/hoadon/chi-tiet/:maHoaDon', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { maHoaDon } = req.params;

        const result = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                SELECT 
                    cthd.maHoaDon, 
                    cthd.maSP, 
                    cthd.soLuong, 
                    cthd.giaBan AS donGia, 
                    sp.tenSP, 
                    sp.hinhAnh
                FROM ChiTietHoaDon cthd
                JOIN SanPham sp ON cthd.maSP = sp.maSP
                WHERE cthd.maHoaDon = @maHoaDon
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error("Lỗi lấy chi tiết hóa đơn:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============== THONG TIN KHACH HANG (USER) ====================
app.get('/api/khachhang/:maKH', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { maKH } = req.params;
        let result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query("SELECT * FROM KhachHang WHERE maKH = @maKH");

        if (result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }
    } catch (err) {
        console.error("Lỗi lấy 1 khách hàng:", err);
        res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
    }
});




// ======================================= THANH TOAN MOMO ==================================
const MOMO_CONFIG = {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/thanh-toan-thanh-cong',
    // Phai la URL public (ngrok...) thi MoMo moi goi duoc, localhost thi MoMo khong goi vao may ban
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:8080/api/payment/momo-ipn',
};

// Kiem tra chu ky MoMo gui ve (dung chung cho IPN va trang redirect)
function kiemTraChuKyMoMo(p) {
    const raw = `accessKey=${MOMO_CONFIG.accessKey}&amount=${p.amount}&extraData=${p.extraData ?? ''}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
    const expected = crypto.createHmac('sha256', MOMO_CONFIG.secretKey).update(raw).digest('hex');
    return expected === p.signature;
}

// Xu ly ket qua MoMo: kiem tra chu ky + so tien, neu thanh cong thi cap nhat bang ThanhToan
async function xuLyKetQuaMoMo(p) {
    if (!p || !p.signature || !MOMO_CONFIG.secretKey || !kiemTraChuKyMoMo(p)) {
        return { hopLe: false, message: 'Chu ky khong hop le' };
    }
    const maHoaDon = String(p.orderId).split('_')[0];
    const pool = await sql.connect(dbConfig);
    const tt = await pool.request()
        .input('maHoaDon', sql.VarChar(20), maHoaDon)
        .query('SELECT soTien, trangThai FROM ThanhToan WHERE maHoaDon = @maHoaDon');
    if (tt.recordset.length === 0) return { hopLe: false, message: 'Khong tim thay giao dich' };
    if (Math.round(tt.recordset[0].soTien) !== Number(p.amount)) {
        return { hopLe: false, message: 'So tien khong khop' };
    }
    const thanhCong = Number(p.resultCode) === 0;
    if (thanhCong) {
        await pool.request()
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .query("UPDATE ThanhToan SET trangThai = 'da_thanh_toan', thoiGian = GETDATE() WHERE maHoaDon = @maHoaDon AND trangThai = 'cho_thanh_toan'");
    }
    return { hopLe: true, thanhCong, maHoaDon, message: p.message };
}

// MoMo goi ve server (server-to-server) khi giao dich xong
app.post('/api/payment/momo-ipn', async (req, res) => {
    try {
        const kq = await xuLyKetQuaMoMo(req.body);
        if (!kq.hopLe) console.warn('MoMo IPN khong hop le:', kq.message);
        res.status(204).end();
    } catch (err) {
        console.error('Loi xu ly MoMo IPN:', err);
        res.status(500).end();
    }
});

// Trang redirect cua frontend goi len de xac nhan ket qua (dung khi chay localhost, IPN chua toi duoc)
app.post('/api/payment/momo-xacnhan', async (req, res) => {
    try {
        const kq = await xuLyKetQuaMoMo(req.body);
        if (!kq.hopLe) return res.status(400).json({ success: false, message: kq.message });
        res.json({ success: true, thanhCong: kq.thanhCong, maHoaDon: kq.maHoaDon, message: kq.message });
    } catch (err) {
        console.error('Loi xac nhan MoMo:', err);
        res.status(500).json({ success: false, message: 'Loi server: ' + err.message });
    }
});

// Tao giao dich MoMo, tra ve payUrl de frontend chuyen khach sang trang thanh toan
app.post('/api/payment/momo', async (req, res) => {
   
    const { amount: amountRaw, orderId: maHoaDon } = req.body;
    if (!maHoaDon || !amountRaw) {
        return res.status(400).json({ message: 'Thieu orderId hoac amount' });
    }
    if (!MOMO_CONFIG.partnerCode || !MOMO_CONFIG.accessKey || !MOMO_CONFIG.secretKey) {
        return res.status(500).json({ message: 'Chua cau hinh MoMo trong file .env' });
    }
    const amount = Math.round(Number(amountRaw)); // MoMo yeu cau so nguyen
    const orderId = `${maHoaDon}_${Date.now()}`;   // moi lan tao giao dich phai co orderId rieng

    // 2. Cấu hình tài khoản Sandbox
    const { partnerCode, accessKey, secretKey } = MOMO_CONFIG; 
            
            
    
    const redirectUrl = MOMO_CONFIG.redirectUrl;
    const ipnUrl = MOMO_CONFIG.ipnUrl; 
    
    const requestType = "captureWallet";
    const extraData = ""; 
    const orderInfo = `Thanh toan don hang ${maHoaDon}`;
    const requestId = partnerCode + new Date().getTime();

    // 3. Tạo chữ ký số
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto.createHmac('sha256', secretKey)
                            .update(rawSignature)
                            .digest('hex');

    // 4. Đóng gói dữ liệu gửi sang MoMo
    const requestBody = {
        partnerCode, accessKey, requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl, extraData, requestType, signature, lang: 'vi'
    };

    try {
        const result = await axios.post(MOMO_CONFIG.endpoint, requestBody).catch((e) => {
            console.error('Loi goi MoMo:', e.response?.data || e.message);
            throw e;
        });
        res.status(200).json(result.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



















// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Dán API key chính xác của bạn vào đây
// const genAI = new GoogleGenerativeAI("AIzaSyAQ.Ab8RN6KUPWl86XNla9IwK-KaCMFf6cGHPfUzDcSFVuI1GFpwzQ");

// app.post('/api/ai-chat', async (req, res) => {
//     try {
//         const { tinNhan } = req.body;
//         let pool = await sql.connect(dbConfig);
        
//         // 1. Kéo dữ liệu FAQ từ DB
//         const faqResult = await pool.request().query("SELECT cauHoi, traLoi FROM CauHoiFAQ WHERE trangThai = 1");
        
//         let kienThuc = "Bạn là trợ lý ảo AI thông minh, nhiệt tình của ThiệnStore. Dưới đây là kiến thức của bạn:\n";
//         faqResult.recordset.forEach(faq => {
//             kienThuc += `- Hỏi: ${faq.cauHoi} | Đáp: ${faq.traLoi}\n`;
//         });
        
//         kienThuc += `
//         Quy tắc:
//         1. Chỉ trả lời dựa trên kiến thức được cung cấp ở trên.
//         2. Trả lời ngắn gọn, thân thiện, xưng "em" và gọi khách là "bạn" hoặc "quý khách".
//         3. Nếu khách hỏi ngoài lề hoặc không có thông tin, hãy khuyên khách liên hệ Hotline: 0981918724.
        
//         Khách hàng vừa nhắn: "${tinNhan}"
//         `;

//         // Gọi model chuẩn của Google
//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//         const result = await model.generateContent(kienThuc);
//         const responseText = await result.response.text();

//         res.json({ success: true, reply: responseText });
//     } catch (error) {
//         console.error("Lỗi AI Agent:", error); // Dòng này sẽ in ra Terminal nếu lỗi
//         res.status(500).json({ success: false, reply: "Xin lỗi, hệ thống AI đang bảo trì. Vui lòng thử lại sau!" });
//     }
// });
//  
app.listen(8080, () => {
    console.log("Server đang chạy ở cổng 8080...");
});