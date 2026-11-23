// file: services/admin/VanChuyenService.js
// Quản lý vận chuyển; đổi trạng thái vận chuyển sẽ đồng bộ sang trạng thái hóa đơn.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');
const HoaDonService = require('./HoaDonService');

// Trạng thái vận chuyển -> trạng thái hóa đơn tương ứng.
// Các trạng thái vận chuyển còn lại (vd 'cho_lay_hang') KHÔNG đổi hóa đơn:
// trước đây chúng đặt hóa đơn về 'cho_xac_nhan', nên chỉ cần admin sửa tên đơn vị vận chuyển / ngày giao
// là đơn đã xác nhận bị tụt ngược về "Chờ xác nhận".
const TRANG_THAI_HOA_DON_THEO_VAN_CHUYEN = {
    dang_giao: 'dang_giao',
    da_giao: 'hoan_tat',
    da_huy: 'da_huy',
};

class VanChuyenService extends BaseService {
    constructor(db) {
        super(db);
        // Đổi trạng thái hóa đơn phải đi qua HoaDonService để được cộng điểm / hoàn tồn kho đúng
        this.hoaDonService = new HoaDonService(db);
    }

    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT 
                vc.maVanChuyen, 
                vc.maHoaDon, 
                vc.donViVanChuyen, 
                vc.maVanDon, 
                vc.phiVanChuyen, 
                vc.trangThai, 
                vc.ngayGiaoDuKien,
                ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS hoTen,
                ISNULL(kh.SDT, dc.SDT) AS SDT,
                dc.diaChiChiTiet
            FROM VanChuyen vc
            LEFT JOIN HoaDon hd ON vc.maHoaDon = hd.maHoaDon
            LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
            LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
            ORDER BY vc.maVanChuyen DESC
        `);
        return ketQua.recordset;
    }

    // Lưu ý: trường `maHoaDon` trong body được lưu vào cột maVanDon (giữ nguyên cách frontend đang gửi)
    async capNhat(maVanChuyen, { donViVanChuyen, maHoaDon, ngayGiaoDuKien, trangThai }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const vc = await pool.request()
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .query("SELECT maHoaDon FROM VanChuyen WHERE maVanChuyen = @maVanChuyen");

        if (vc.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy thông tin vận chuyển!");
        }

        const maHoaDonLienQuan = vc.recordset[0].maHoaDon;
        const trangThaiVanChuyen = trangThai || 'cho_lay_hang';

        // Đồng bộ sang hóa đơn TRƯỚC: nếu hóa đơn không đổi được (vd mở lại đơn đã hủy nhưng hết hàng -> 409)
        // thì vận chuyển cũng không bị đổi, hai bên không lệch nhau.
        const trangThaiHoaDon = TRANG_THAI_HOA_DON_THEO_VAN_CHUYEN[trangThaiVanChuyen];
        if (maHoaDonLienQuan && trangThaiHoaDon) {
            await this.hoaDonService.capNhatTrangThai(maHoaDonLienQuan, trangThaiHoaDon, { dongBoVanChuyen: false });
        }

        await pool.request()
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .input('donViVanChuyen', sql.VarChar(50), donViVanChuyen || null)
            .input('maVanDon', sql.VarChar(50), maHoaDon || null)
            .input('ngayGiaoDuKien', sql.Date, ngayGiaoDuKien || null)
            .input('trangThai', sql.VarChar(30), trangThaiVanChuyen)
            .query(`
                UPDATE VanChuyen 
                SET donViVanChuyen = @donViVanChuyen, 
                    maVanDon = @maVanDon, 
                    ngayGiaoDuKien = @ngayGiaoDuKien, 
                    trangThai = @trangThai 
                WHERE maVanChuyen = @maVanChuyen
            `);

        return { message: "Cập nhật vận chuyển và đồng bộ hóa đơn thành công!" };
    }
}

module.exports = VanChuyenService;
