// file: services/admin/NhanVienService.js
// Quản lý nhân viên: danh sách (kèm quyền), thêm, sửa, xóa, cấp tài khoản.
const bcrypt = require('bcrypt');
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

// Giám đốc (CV01) và Quản lý (CV02): chỉ Giám đốc được tạo / gán / sửa / xóa 2 chức vụ này.
// Nếu không chặn, Quản lý có thể tự cấp tài khoản Giám đốc cho mình để nâng quyền.
const CHUC_VU_QUAN_TRI = ['CV01', 'CV02'];
const GIAM_DOC = 'CV01';

class NhanVienService extends BaseService {
    // maCVNguoiThaoTac luôn lấy từ token (req.auth.maCV), không bao giờ từ body
    kiemTraDuocGanChucVu(maCVNguoiThaoTac, maCVMuc) {
        if (CHUC_VU_QUAN_TRI.includes(maCVMuc) && maCVNguoiThaoTac !== GIAM_DOC) {
            throw new HttpError(403, "Chỉ Giám đốc mới được tạo hoặc gán chức vụ Giám đốc / Quản lý!");
        }
    }

    // Tài khoản Giám đốc / Quản lý hiện có chỉ Giám đốc mới được sửa hoặc xóa
    async kiemTraDuocSuaNhanVien(maCVNguoiThaoTac, maNV) {
        const sql = this.sql;
        const pool = await this.getPool();
        const kq = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query("SELECT maCV FROM NhanVien WHERE maNV = @maNV");
        if (kq.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy nhân viên!");
        }
        this.kiemTraDuocGanChucVu(maCVNguoiThaoTac, kq.recordset[0].maCV);
    }

    // Danh sách nhân viên kèm chức vụ và các quyền của chức vụ đó
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
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
        `);
        return ketQua.recordset;
    }

    // Thêm nhân viên mới. Mã NV tự sinh: NV + số thứ tự
    async them({ hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai }, maCVNguoiThaoTac) {
        const sql = this.sql;
        this.kiemTraDuocGanChucVu(maCVNguoiThaoTac, maCV);
        const pool = await this.getPool();

        // Lấy số lớn nhất theo GIÁ TRỊ SỐ (so sánh chuỗi 'NV99' > 'NV100' sẽ sinh trùng mã khi quá 99 nhân viên)
        const ketQuaMa = await pool.request().query(
            "SELECT MAX(TRY_CAST(SUBSTRING(maNV, 3, 20) AS INT)) AS maxSo FROM NhanVien WHERE maNV LIKE 'NV[0-9]%'"
        );
        const soMoi = (ketQuaMa.recordset[0].maxSo || 0) + 1;       // Ví dụ: 10 + 1 = 11
        const maNVMoi = 'NV' + String(soMoi).padStart(2, '0');       // 'NV11'

        // Mật khẩu phải được băm bcrypt như các nơi khác (trước đây lưu chữ thường)
        const matKhauDaBam = matKhau ? await bcrypt.hash(String(matKhau), 10) : null;

        await pool.request()
            .input('maNV', sql.VarChar, maNVMoi)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('ngaySinh', sql.Date, ngaySinh)
            .input('gioiTinh', sql.NVarChar, gioiTinh)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('SDT', sql.VarChar, SDT)
            .input('email', sql.VarChar, email)
            .input('maCV', sql.VarChar, maCV)
            .input('matKhau', sql.VarChar, matKhauDaBam)
            .input('trangThai', sql.Int, trangThai)
            .input('avatar', sql.NVarChar, 'https://placehold.co/150') // Avatar mặc định
            .query(`
                INSERT INTO NhanVien (maNV, hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai, avatar)
                VALUES (@maNV, @hoTen, @ngaySinh, @gioiTinh, @diaChi, @SDT, @email, @maCV, @matKhau, @trangThai, @avatar)
            `);

        return { message: "Thêm nhân viên thành công!", maNV: maNVMoi };
    }

    async sua(maNV, { hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, trangThai }, maCVNguoiThaoTac) {
        const sql = this.sql;
        this.kiemTraDuocGanChucVu(maCVNguoiThaoTac, maCV);                  // không được nâng ai lên CV01/CV02
        await this.kiemTraDuocSuaNhanVien(maCVNguoiThaoTac, maNV);          // không được sửa tài khoản CV01/CV02 hiện có
        const pool = await this.getPool();

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

        return { message: "Cập nhật nhân viên thành công!" };
    }

    async xoa(maNV, maCVNguoiThaoTac) {
        const sql = this.sql;
        await this.kiemTraDuocSuaNhanVien(maCVNguoiThaoTac, maNV);
        const pool = await this.getPool();

        try {
            await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query("DELETE FROM NhanVien WHERE maNV = @maNV");
        } catch (loi) {
            console.error("Lỗi xóa nhân viên:", loi);
            throw new HttpError(500, "Không thể xóa nhân viên do ràng buộc dữ liệu!");
        }

        return { message: "Đã xóa nhân viên thành công!" };
    }

    // Cấp tài khoản nhanh (mật khẩu mặc định '123456', được băm bằng bcrypt).
    // Chỉ Giám đốc (CV01) và Quản lý (CV02) mới được cấp, và chỉ Giám đốc được cấp tài khoản CV01 / CV02.
    // maChucVuNguoiThaoTac do controller lấy từ token.
    async taoTaiKhoan({ thongTinMoi, maChucVuNguoiThaoTac }) {
        const sql = this.sql;

        if (!CHUC_VU_QUAN_TRI.includes(maChucVuNguoiThaoTac)) {
            throw new HttpError(403, "Bạn không có quyền cấp tài khoản!");
        }
        if (!thongTinMoi || !thongTinMoi.maNV || !thongTinMoi.maCV) {
            throw new HttpError(400, "Thiếu thông tin nhân viên mới!");
        }
        this.kiemTraDuocGanChucVu(maChucVuNguoiThaoTac, thongTinMoi.maCV);

        const pool = await this.getPool();
        const salt = await bcrypt.genSalt(10);
        const matKhauDaBam = await bcrypt.hash('123456', salt);

        await pool.request()
            .input('maNV', sql.VarChar, thongTinMoi.maNV)
            .input('hoTen', sql.NVarChar, thongTinMoi.hoTen)
            .input('SDT', sql.VarChar, thongTinMoi.sdt)
            .input('matKhau', sql.VarChar, matKhauDaBam)
            .input('maCV', sql.VarChar, thongTinMoi.maCV)
            .query(`
                INSERT INTO NhanVien (maNV, hoTen, SDT, matKhau, maCV, trangThai)
                VALUES (@maNV, @hoTen, @SDT, @matKhau, @maCV, 1)
            `);

        return { message: "Cấp tài khoản thành công!" };
    }
}

module.exports = NhanVienService;
