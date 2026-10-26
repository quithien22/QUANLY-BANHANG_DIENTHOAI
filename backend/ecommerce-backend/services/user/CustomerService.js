// file: services/CustomerService.js
// Hồ sơ khách hàng: xem, cập nhật thông tin, đổi mật khẩu.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class CustomerService extends BaseService {
    async getProfile(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query("SELECT * FROM KhachHang WHERE maKH = @maKH");

        if (result.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy khách hàng");
        }
        return result.recordset[0];
    }

    async updateInfo({ maKH, hoTen, gioiTinh, ngaySinh, diaChi, sdt, email }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const validNgaySinh = (ngaySinh && ngaySinh.trim() !== "") ? ngaySinh : null;

        await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .input('hoTen', sql.NVarChar(50), hoTen || '')
            .input('gioiTinh', sql.NVarChar(10), gioiTinh || '')
            .input('ngaySinh', sql.Date, validNgaySinh)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi || '')
            .input('sdt', sql.VarChar(15), sdt || null)
            .input('email', sql.VarChar(255), email || null)
            .query(`
                UPDATE KhachHang 
                SET hoTen = @hoTen, 
                    gioiTinh = @gioiTinh, 
                    ngaySinh = @ngaySinh, 
                    diaChi = @diaChi,
                    SDT = @sdt,
                    email = @email
                WHERE maKH = @maKH
            `);
    }

    // Giữ nguyên logic hiện tại: so khớp mật khẩu cũ trực tiếp trong câu UPDATE
    async changePassword({ maKH, matKhauCu, matKhauMoi }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('matKhauCu', sql.VarChar, matKhauCu)
            .input('matKhauMoi', sql.VarChar, matKhauMoi)
            .query(`
                UPDATE KhachHang 
                SET matKhau = @matKhauMoi
                WHERE maKH = @maKH AND matKhau = @matKhauCu
            `);

        // rowsAffected = 0 nghĩa là không khớp mật khẩu cũ
        if (result.rowsAffected[0] === 0) {
            throw new HttpError(400, "Mật khẩu cũ không chính xác!");
        }
    }
}

module.exports = CustomerService;
