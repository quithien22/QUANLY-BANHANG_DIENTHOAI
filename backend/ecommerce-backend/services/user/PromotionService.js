// file: services/PromotionService.js
// Flash sale hôm nay + áp dụng mã giảm giá.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class PromotionService extends BaseService {
    // Sản phẩm flash sale của ngày hôm nay, kèm trạng thái khung giờ tính theo giờ thực
    async getTodayFlashSale() {
        const pool = await this.getPool();
        const result = await pool.request().query(`
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
        `);
        return result.recordset;
    }

    // GIẢ ĐỊNH (giữ nguyên từ code cũ): bảng KhuyenMai chưa có cột "mã code" riêng,
    // nên dùng "tenKM" làm mã nhập. Muốn có mã thật (VD "SALE50"): ALTER TABLE KhuyenMai
    // ADD maCode VARCHAR(30) rồi đổi điều kiện WHERE từ tenKM -> maCode.
    async applyCoupon(maNhap) {
        const sql = this.sql;
        if (typeof maNhap !== 'string' || !maNhap.trim()) {
            throw new HttpError(400, "Vui lòng nhập mã giảm giá");
        }
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maNhap', sql.NVarChar, maNhap)
            .query(`
                SELECT maKM, tenKM, phanTram FROM KhuyenMai
                WHERE tenKM = @maNhap AND trangThai = 1
                AND CAST(GETDATE() AS DATE) BETWEEN ngayBD AND ngayKT
            `);

        if (result.recordset.length === 0) {
            throw new HttpError(404, "Mã giảm giá không hợp lệ hoặc đã hết hạn");
        }
        return result.recordset[0];
    }
}

module.exports = PromotionService;
