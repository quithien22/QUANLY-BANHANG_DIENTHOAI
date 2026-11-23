// file: services/CustomerService.js
// Hồ sơ khách hàng: xem, cập nhật thông tin, đổi mật khẩu.
const bcrypt = require('bcrypt');
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

        // KHÔNG trả mật khẩu (bản băm hoặc chữ thường của tài khoản cũ) về cho trình duyệt
        const { matKhau, ...hoSo } = result.recordset[0];
        return hoSo;
    }

    async updateInfo({ maKH, hoTen, gioiTinh, ngaySinh, diaChi, sdt, email }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const validNgaySinh = (typeof ngaySinh === 'string' && ngaySinh.trim() !== "") ? ngaySinh : null;
        const emailMoi = email ? String(email).trim() : null;
        const sdtMoi = sdt ? String(sdt).trim() : null;

        // Email / SĐT là tên đăng nhập nên không được trùng với khách khác.
        // Chỉ kiểm tra khi giá trị thật sự thay đổi (tránh chặn nhầm tài khoản cũ đã bị trùng từ trước).
        const hienTai = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query("SELECT email, SDT FROM KhachHang WHERE maKH = @maKH");

        if (hienTai.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy khách hàng");
        }
        const cu = hienTai.recordset[0];

        if (emailMoi && emailMoi.toLowerCase() !== String(cu.email || '').toLowerCase()) {
            const trung = await pool.request()
                .input('maKH', sql.VarChar(20), maKH)
                .input('email', sql.VarChar(255), emailMoi)
                .query("SELECT TOP 1 maKH FROM KhachHang WHERE email = @email AND maKH <> @maKH");
            if (trung.recordset.length > 0) {
                throw new HttpError(409, "Email này đã được dùng cho tài khoản khác!");
            }
        }
        if (sdtMoi && sdtMoi !== String(cu.SDT || '')) {
            const trung = await pool.request()
                .input('maKH', sql.VarChar(20), maKH)
                .input('sdt', sql.VarChar(15), sdtMoi)
                .query("SELECT TOP 1 maKH FROM KhachHang WHERE SDT = @sdt AND maKH <> @maKH");
            if (trung.recordset.length > 0) {
                throw new HttpError(409, "Số điện thoại này đã được dùng cho tài khoản khác!");
            }
        }

        await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .input('hoTen', sql.NVarChar(50), hoTen || '')
            .input('gioiTinh', sql.NVarChar(10), gioiTinh || '')
            .input('ngaySinh', sql.Date, validNgaySinh)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi || '')
            .input('sdt', sql.VarChar(15), sdtMoi)
            .input('email', sql.VarChar(255), emailMoi)
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

    // Mật khẩu trong DB là bcrypt (đăng ký / đăng nhập đều băm), nên phải so khớp bằng bcrypt
    // rồi lưu bản băm của mật khẩu mới. Tài khoản cũ chưa băm (chữ thường) vẫn đổi được.
    async changePassword({ maKH, matKhauCu, matKhauMoi }) {
        const sql = this.sql;

        if (!maKH || typeof matKhauCu !== 'string' || typeof matKhauMoi !== 'string' || !matKhauCu || !matKhauMoi) {
            throw new HttpError(400, "Vui lòng nhập đầy đủ thông tin!");
        }
        if (matKhauMoi.length < 6) {
            throw new HttpError(400, "Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query("SELECT matKhau FROM KhachHang WHERE maKH = @maKH");

        if (result.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy khách hàng");
        }

        const daLuu = result.recordset[0].matKhau;
        const daBam = !!daLuu && /^\$2[aby]\$/.test(daLuu);
        const khop = daBam ? await bcrypt.compare(matKhauCu, daLuu) : (!!daLuu && daLuu === matKhauCu);

        if (!khop) {
            throw new HttpError(400, "Mật khẩu cũ không chính xác!");
        }

        const matKhauDaBam = await bcrypt.hash(matKhauMoi, 10);
        await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .input('matKhauMoi', sql.VarChar(255), matKhauDaBam)
            .query("UPDATE KhachHang SET matKhau = @matKhauMoi WHERE maKH = @maKH");
    }
}

module.exports = CustomerService;
