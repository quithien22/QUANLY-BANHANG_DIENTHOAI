// file: services/ReturnService.js
// Yêu cầu đổi trả / bảo hành của khách hàng.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');
const { layUrlAnh } = require('../../utils/imageUrl');
const { chayVoiMaMoi } = require('../../utils/id');

class ReturnService extends BaseService {
    // file: đối tượng multer (req.file) hoặc undefined nếu không có ảnh
    // maKH (lấy từ token): chỉ tạo yêu cầu đổi trả cho đơn của CHÍNH khách đó
    async create({ maHoaDon, lyDo, loaiYeuCau, file, maKH }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const checkHD = await pool.request()
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT TOP 1 ct.maSP
                FROM ChiTietHoaDon ct
                JOIN HoaDon hd ON ct.maHoaDon = hd.maHoaDon
                WHERE ct.maHoaDon = @maHoaDon AND hd.maKH = @maKH
            `);

        // Đơn của người khác cũng báo "không tồn tại" để không lộ mã hóa đơn nào có thật
        if (checkHD.recordset.length === 0) {
            throw new HttpError(400, "Mã hóa đơn không tồn tại. Vui lòng kiểm tra lại!");
        }

        const maSP = checkHD.recordset[0].maSP;
        const hinhAnhUrl = file ? layUrlAnh(file.filename) : null;

        // Mã mới không trùng (trước đây 'DT' + 6 số cuối của Date.now() lặp lại sau ~17 phút)
        await chayVoiMaMoi('DT', (maDoiTra) => pool.request()
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
            `));
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
