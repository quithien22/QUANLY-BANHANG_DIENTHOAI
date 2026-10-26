// file: services/admin/AuthAdminService.js
// Đăng nhập cho nhân viên / quản trị (bảng NhanVien).
const bcrypt = require('bcrypt');
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class AuthAdminService extends BaseService {

    // Dạng thông tin trả về cho frontend admin (không bao giờ có mật khẩu)
    toAdminInfo(admin) {
        return { maNV: admin.maNV, hoTen: admin.hoTen, maCV: admin.maCV, trangThai: admin.trangThai };
    }

    // LOGIN: taiKhoan có thể là SĐT, email hoặc mã nhân viên
    async login({ taiKhoan, matKhau }) {
        const sql = this.sql;

        if (!taiKhoan || !matKhau) {
            throw new HttpError(400, "Vui lòng nhập đầy đủ thông tin đăng nhập!");
        }

        const pool = await this.getPool();

        const result = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query(`
                SELECT maNV, hoTen, maCV, trangThai, matKhau
                FROM NhanVien
                WHERE SDT = @taiKhoan OR email = @taiKhoan OR maNV = @taiKhoan
            `);

        if (result.recordset.length === 0) {
            throw new HttpError(401, "Tài khoản không chính xác!");
        }

        const admin = result.recordset[0];
        let isMatch = false;

        // Hỗ trợ cả mật khẩu đã băm (bcrypt) và mật khẩu cũ chưa băm
        if (admin.matKhau && (admin.matKhau.startsWith('$2a$') || admin.matKhau.startsWith('$2b$'))) {
            isMatch = await bcrypt.compare(matKhau, admin.matKhau);
        } else {
            isMatch = (matKhau === admin.matKhau);

            // Đăng nhập đúng với mật khẩu cũ -> tự động băm và lưu đè để nâng cấp bảo mật
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedMatKhau = await bcrypt.hash(matKhau, salt);
                await pool.request()
                    .input('maNV', sql.VarChar, admin.maNV)
                    .input('matKhauMoi', sql.VarChar, hashedMatKhau)
                    .query(`UPDATE NhanVien SET matKhau = @matKhauMoi WHERE maNV = @maNV`);
            }
        }

        if (!isMatch) {
            throw new HttpError(401, "Mật khẩu không chính xác!");
        }

        if (admin.trangThai == 0) {
            throw new HttpError(403, "Tài khoản bị khóa!");
        }

        return this.toAdminInfo(admin);
    }
}

module.exports = AuthAdminService;
