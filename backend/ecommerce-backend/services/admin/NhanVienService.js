// file: services/admin/NhanVienService.js
// Quản lý nhân viên: danh sách (kèm quyền), thêm, sửa, xóa, cấp tài khoản.
const bcrypt = require('bcrypt');
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class NhanVienService extends BaseService {
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
    async them({ hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQuaMa = await pool.request().query("SELECT TOP 1 maNV FROM NhanVien ORDER BY maNV DESC");
        let maNVMoi = "NV01";
        if (ketQuaMa.recordset.length > 0) {
            const maCuoi = ketQuaMa.recordset[0].maNV;            // Ví dụ: 'NV10'
            const so = parseInt(maCuoi.replace('NV', '')) + 1;    // 10 + 1 = 11
            maNVMoi = 'NV' + so.toString().padStart(2, '0');      // 'NV11'
        }

        await pool.request()
            .input('maNV', sql.VarChar, maNVMoi)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('ngaySinh', sql.Date, ngaySinh)
            .input('gioiTinh', sql.NVarChar, gioiTinh)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('SDT', sql.VarChar, SDT)
            .input('email', sql.VarChar, email)
            .input('maCV', sql.VarChar, maCV)
            .input('matKhau', sql.VarChar, matKhau)
            .input('trangThai', sql.Int, trangThai)
            .input('avatar', sql.NVarChar, 'https://placehold.co/150') // Avatar mặc định
            .query(`
                INSERT INTO NhanVien (maNV, hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, matKhau, trangThai, avatar)
                VALUES (@maNV, @hoTen, @ngaySinh, @gioiTinh, @diaChi, @SDT, @email, @maCV, @matKhau, @trangThai, @avatar)
            `);

        return { message: "Thêm nhân viên thành công!", maNV: maNVMoi };
    }

    async sua(maNV, { hoTen, ngaySinh, gioiTinh, diaChi, SDT, email, maCV, trangThai }) {
        const sql = this.sql;
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

    async xoa(maNV) {
        const sql = this.sql;
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
    // Chỉ Giám đốc (CV01) và Quản lý (CV02) mới được cấp.
    async taoTaiKhoan({ thongTinMoi, maChucVuNguoiThaoTac }) {
        const sql = this.sql;

        if (maChucVuNguoiThaoTac !== 'CV01' && maChucVuNguoiThaoTac !== 'CV02') {
            throw new HttpError(403, "Bạn không có quyền cấp tài khoản!");
        }

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
