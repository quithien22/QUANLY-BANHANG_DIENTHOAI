// file: services/ReviewService.js
// Đánh giá sản phẩm: xem, thêm, sửa, xóa (chỉ chủ đánh giá mới sửa/xóa được).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

// Tên cột lưu đường dẫn ảnh trong HinhAnhDanhGia có thể khác nhau giữa các DB -> lấy cột chuỗi đầu tiên (không phải mã)
const layDuongDan = (dong) => {
    for (const [khoa, giaTri] of Object.entries(dong)) {
        if (/^(ma|id)/i.test(khoa)) continue;
        if (typeof giaTri === 'string' && giaTri) return giaTri;
    }
    return null;
};

class ReviewService extends BaseService {
    // Đánh giá của 1 sản phẩm, kèm hình ảnh và phản hồi của shop.
    // Truy vấn chính chỉ cần DanhGiaSanPham + KhachHang. Phản hồi và ảnh lấy riêng, lỗi ở bảng phụ
    // thì chỉ ghi log chứ không làm mất cả danh sách đánh giá.
    async listByProduct(maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        const danhGiaResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`
                SELECT dg.maDanhGia, dg.maSP, dg.maKH, dg.soSao, dg.noiDung, dg.daMuaHang, dg.ngayTao,
                       kh.hoTen AS userName
                FROM DanhGiaSanPham dg
                LEFT JOIN KhachHang kh ON dg.maKH = kh.maKH
                WHERE dg.maSP = @maSP
                ORDER BY dg.ngayTao DESC
            `);

        let dsHinhAnh = [];
        try {
            const hinhAnhResult = await pool.request()
                .input('maSP', sql.VarChar, maSP)
                .query(`
                    SELECT ha.* 
                    FROM HinhAnhDanhGia ha
                    INNER JOIN DanhGiaSanPham dg ON ha.maDanhGia = dg.maDanhGia
                    WHERE dg.maSP = @maSP
                `);
            dsHinhAnh = hinhAnhResult.recordset;
        } catch (err) {
            console.error('[Đánh giá] Không đọc được HinhAnhDanhGia:', err.message);
        }

        const phanHoi = new Map();
        try {
            const phanHoiResult = await pool.request()
                .input('maSP', sql.VarChar, maSP)
                .query(`
                    SELECT ph.maDanhGia, ph.noiDung, ph.ngayTao
                    FROM PhanHoiDanhGia ph
                    INNER JOIN DanhGiaSanPham dg ON ph.maDanhGia = dg.maDanhGia
                    WHERE dg.maSP = @maSP
                    ORDER BY ph.ngayTao ASC
                `);
            // Nhiều phản hồi cho 1 đánh giá thì lấy cái mới nhất
            phanHoiResult.recordset.forEach((ph) => phanHoi.set(ph.maDanhGia, ph));
        } catch (err) {
            console.error('[Đánh giá] Không đọc được PhanHoiDanhGia:', err.message);
        }

        return danhGiaResult.recordset.map(dg => ({
            ...dg,
            shopReply: phanHoi.get(dg.maDanhGia)?.noiDung || null,
            ngayReply: phanHoi.get(dg.maDanhGia)?.ngayTao || null,
            hinhAnh: dsHinhAnh.filter(ha => ha.maDanhGia === dg.maDanhGia).map(layDuongDan).filter(Boolean)
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

        let cotAnh = null;
        if (hinhAnh.length > 0) {
            const cot = await pool.request().query(`
                SELECT TOP 1 COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'HinhAnhDanhGia' AND DATA_TYPE IN ('varchar', 'nvarchar')
                ORDER BY ORDINAL_POSITION
            `);
            cotAnh = cot.recordset[0]?.COLUMN_NAME;
            if (!cotAnh) throw new HttpError(500, "Bảng HinhAnhDanhGia không có cột lưu đường dẫn ảnh.");
        }
        for (const url of hinhAnh) {
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGiaMoi)
                .input('duongDanDanhGia', sql.VarChar(255), url)
                .query(`
                    INSERT INTO HinhAnhDanhGia (maDanhGia, [${cotAnh}]) 
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
