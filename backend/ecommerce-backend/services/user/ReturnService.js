// file: services/ReturnService.js
// Yêu cầu đổi trả / bảo hành của khách hàng.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');
const { layUrlAnh } = require('../../utils/imageUrl');

class ReturnService extends BaseService {
    // file: đối tượng multer (req.file) hoặc undefined nếu không có ảnh
    async create({ maHoaDon, lyDo, loaiYeuCau, file }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const checkHD = await pool.request()
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .query('SELECT TOP 1 maSP FROM ChiTietHoaDon WHERE maHoaDon = @maHoaDon');

        if (checkHD.recordset.length === 0) {
            throw new HttpError(400, "Mã hóa đơn không tồn tại. Vui lòng kiểm tra lại!");
        }

        const maSP = checkHD.recordset[0].maSP;
        const hinhAnhUrl = file ? layUrlAnh(file.filename) : null;
        const maDoiTra = 'DT' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .input('maSP', sql.VarChar(20), maSP)
            .input('lyDo', sql.NVarChar(sql.MAX), lyDo)
            .input('loaiYeuCau', sql.VarChar(50), loaiYeuCau || 'doi_hang')
            .input('trangThai', sql.VarChar(20), 'cho_duyet')
            .input('hinhAnh', sql.NVarChar(sql.MAX), hinhAnhUrl)
            .query(`
                INSERT INTO DoiTraHang (maDoiTra, maHoaDon, maSP, lyDo, loaiYeuCau, trangThai, ngayTao, hinhAnh)
                VALUES (@maDoiTra, @maHoaDon, @maSP, @lyDo, @loaiYeuCau, @trangThai, GETDATE(), @hinhAnh)
            `);
    }

    async listByCustomer(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT dtr.*, sp.tenSP 
                FROM DoiTraHang dtr
                JOIN HoaDon hd ON dtr.maHoaDon = hd.maHoaDon
                LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
                WHERE hd.maKH = @maKH
                ORDER BY dtr.ngayTao DESC
            `);
        return result.recordset;
    }
}

module.exports = ReturnService;
