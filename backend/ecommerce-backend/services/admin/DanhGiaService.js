// file: services/admin/DanhGiaService.js
// Quản lý đánh giá sản phẩm phía admin: xem, phản hồi, xóa.
const BaseService = require('../BaseService');

// Tên cột lưu đường dẫn ảnh trong HinhAnhDanhGia có thể khác nhau giữa các DB -> lấy cột chuỗi đầu tiên (không phải mã)
const layDuongDan = (dong) => {
    for (const [khoa, giaTri] of Object.entries(dong)) {
        if (/^(ma|id)/i.test(khoa)) continue;
        if (typeof giaTri === 'string' && giaTri) return giaTri;
    }
    return null;
};

class DanhGiaService extends BaseService {
    // Toàn bộ đánh giá kèm tên sản phẩm, khách hàng, phản hồi của shop và danh sách ảnh
    async layDanhSach() {
        const pool = await this.getPool();

        const ketQua = await pool.request().query(`
            SELECT dg.maDanhGia, dg.maSP, dg.maKH, dg.soSao, dg.noiDung, dg.daMuaHang, dg.ngayTao,
                   sp.tenSP, sp.hinhAnh, kh.hoTen,
                   ph.noiDung AS shopReply, ph.ngayTao AS ngayReply
            FROM DanhGiaSanPham dg
            LEFT JOIN SanPham sp ON dg.maSP = sp.maSP
            LEFT JOIN KhachHang kh ON dg.maKH = kh.maKH
            LEFT JOIN PhanHoiDanhGia ph ON dg.maDanhGia = ph.maDanhGia
            ORDER BY dg.ngayTao DESC
        `);

        // Bảng ảnh lỗi thì vẫn hiện danh sách đánh giá, chỉ thiếu ảnh
        let anh = { recordset: [] };
        try {
            anh = await pool.request().query(`SELECT * FROM HinhAnhDanhGia`);
        } catch (err) {
            console.error('[Đánh giá admin] Không đọc được HinhAnhDanhGia:', err.message);
        }

        return ketQua.recordset.map(dg => ({
            ...dg,
            danhSachAnh: anh.recordset.filter(a => a.maDanhGia === dg.maDanhGia).map(layDuongDan).filter(Boolean)
        }));
    }

    // Đã có phản hồi thì cập nhật, chưa có thì thêm mới
    async guiPhanHoi({ maDanhGia, maNV = 'NV01', noiDung }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const daCo = await pool.request()
            .input('maDanhGia', sql.Int, maDanhGia)
            .query("SELECT * FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia");

        if (daCo.recordset.length > 0) {
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGia)
                .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
                .query("UPDATE PhanHoiDanhGia SET noiDung = @noiDung, ngayTao = GETDATE() WHERE maDanhGia = @maDanhGia");
        } else {
            await pool.request()
                .input('maDanhGia', sql.Int, maDanhGia)
                .input('maNV', sql.VarChar, maNV)
                .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
                .query("INSERT INTO PhanHoiDanhGia (maDanhGia, maNV, noiDung, ngayTao) VALUES (@maDanhGia, @maNV, @noiDung, GETDATE())");
        }

        return { message: "Phản hồi thành công!" };
    }

    // Xóa các bảng liên quan (khóa ngoại) trước rồi mới xóa đánh giá
    async xoa(maDanhGia) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request().input('maDanhGia', sql.Int, maDanhGia).query(`
            DELETE FROM HinhAnhDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM PhanHoiDanhGia WHERE maDanhGia = @maDanhGia;
            DELETE FROM DanhGiaSanPham WHERE maDanhGia = @maDanhGia;
        `);

        return { message: "Xóa đánh giá thành công." };
    }
}

module.exports = DanhGiaService;
