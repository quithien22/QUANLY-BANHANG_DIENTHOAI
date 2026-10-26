// file: services/admin/DoiTraHangService.js
// Xử lý yêu cầu đổi trả phía admin (phía user nằm ở ReturnService).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class DoiTraHangService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT dtr.maDoiTra, dtr.maHoaDon, dtr.maSP, dtr.lyDo, dtr.loaiYeuCau,
                   dtr.trangThai, dtr.ngayTao, dtr.hinhAnh, sp.tenSP
            FROM DoiTraHang dtr
            LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
            ORDER BY dtr.ngayTao DESC
        `);
        return ketQua.recordset;
    }

    // Chi tiết 1 yêu cầu (đơn gốc, khách hàng, thanh toán, ảnh minh chứng)
    async layChiTiet(maDoiTra) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .query(`
                SELECT dtr.*, sp.tenSP, tt.phuongThuc,
                       ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS tenKhachHang,
                       ISNULL(kh.SDT, dc.SDT) AS sdtKhachHang,
                       dc.diaChiChiTiet
                FROM DoiTraHang dtr
                LEFT JOIN SanPham sp ON dtr.maSP = sp.maSP
                LEFT JOIN HoaDon hd ON dtr.maHoaDon = hd.maHoaDon
                LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
                LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
                LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
                WHERE dtr.maDoiTra = @maDoiTra
            `);

        if (ketQua.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy yêu cầu");
        }

        const du_lieu = ketQua.recordset[0];
        // Tách chuỗi hinhAnh thành mảng (có thể lưu nhiều URL cách nhau bằng dấu phẩy)
        return { ...du_lieu, hinhAnh: du_lieu.hinhAnh ? du_lieu.hinhAnh.split(',') : [] };
    }

    async xuLy(maDoiTra, { trangThai, hinhThucGiaiQuyet, ghiChuNoiBo, maNV }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maDoiTra', sql.VarChar(20), maDoiTra)
            .input('trangThai', sql.VarChar(20), trangThai)
            .input('hinhThucGiaiQuyet', sql.VarChar(30), hinhThucGiaiQuyet || null)
            .input('ghiChuNoiBo', sql.NVarChar(sql.MAX), ghiChuNoiBo || null)
            .input('maNV', sql.VarChar(20), maNV || null)
            .query(`
                UPDATE DoiTraHang
                SET trangThai = @trangThai, 
                    hinhThucGiaiQuyet = @hinhThucGiaiQuyet,
                    ghiChuNoiBo = @ghiChuNoiBo, 
                    maNV = @maNV
                WHERE maDoiTra = @maDoiTra
            `);

        return { message: "Đã cập nhật yêu cầu đổi trả thành công!" };
    }
}

module.exports = DoiTraHangService;
