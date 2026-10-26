// file: services/ReviewService.js
// Đánh giá sản phẩm: xem, thêm, sửa, xóa (chỉ chủ đánh giá mới sửa/xóa được).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class ReviewService extends BaseService {
    // Đánh giá của 1 sản phẩm, kèm hình ảnh và phản hồi của shop
    async listByProduct(maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        const danhGiaResult = await pool.request()
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

        const hinhAnhResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`
                SELECT ha.maDanhGia, ha.duongDanDanhGia 
                FROM HinhAnhDanhGia ha
                INNER JOIN DanhGiaSanPham dg ON ha.maDanhGia = dg.maDanhGia
                WHERE dg.maSP = @maSP
            `);

        const dsHinhAnh = hinhAnhResult.recordset;

        return danhGiaResult.recordset.map(dg => ({
            ...dg,
            hinhAnh: dsHinhAnh.filter(ha => ha.maDanhGia === dg.maDanhGia).map(ha => ha.duongDanDanhGia)
        }));
    }

    async add({ maSP, maKH, soSao, noiDung, hinhAnh = [] }) {
        const sql = this.sql;
        if (!maKH) throw new HttpError(401, "Vui lòng đăng nhập!");

        const pool = await this.getPool();

        const insertResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .input('maKH', sql.VarChar, maKH)
            .input('soSao', sql.Int, soSao)
            .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
            .query(`
                INSERT INTO DanhGiaSanPham (maSP, maKH, soSao, noiDung, daMuaHang, ngayTao)
                VALUES (@maSP, @maKH, @soSao, @noiDung, 1, GETDATE());
                SELECT SCOPE_IDENTITY() AS maDanhGiaMoi;
            `);

        const maDanhGiaMoi = insertResult.recordset[0].maDanhGiaMoi;

        for (const url of hinhAnh) {
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGiaMoi)
                .input('duongDanDanhGia', sql.VarChar(255), url)
                .query(`
                    INSERT INTO HinhAnhDanhGia (maDanhGia, duongDanDanhGia) 
                    VALUES (@maDanhGia, @duongDanDanhGia)
                `);
        }
    }

    async update(maDanhGia, { maKH, soSao, noiDung }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
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
            throw new HttpError(403, "Không thể sửa đánh giá (sai User hoặc không tồn tại).");
        }
    }

    async remove(maDanhGia, maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const check = await pool.request()
            .input('maDanhGia', sql.Int, maDanhGia)
            .input('maKH', sql.VarChar, maKH)
            .query(`SELECT maDanhGia FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia AND maKH = @maKH`);

        if (check.recordset.length === 0) {
            throw new HttpError(403, "Không có quyền xóa đánh giá này.");
        }

        await pool.request().input('maDanhGia', sql.Int, maDanhGia).query(`
            DELETE FROM HinhAnhDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia;
        `);
    }
}

module.exports = ReviewService;
