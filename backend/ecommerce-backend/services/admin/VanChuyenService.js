// file: services/admin/VanChuyenService.js
// Quản lý vận chuyển; đổi trạng thái vận chuyển sẽ đồng bộ sang trạng thái hóa đơn.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class VanChuyenService extends BaseService {
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

        await pool.request()
            .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
            .input('donViVanChuyen', sql.VarChar(50), donViVanChuyen || null)
            .input('maVanDon', sql.VarChar(50), maHoaDon || null)
            .input('ngayGiaoDuKien', sql.Date, ngayGiaoDuKien || null)
            .input('trangThai', sql.VarChar(30), trangThai || 'cho_lay_hang')
            .query(`
                UPDATE VanChuyen 
                SET donViVanChuyen = @donViVanChuyen, 
                    maVanDon = @maVanDon, 
                    ngayGiaoDuKien = @ngayGiaoDuKien, 
                    trangThai = @trangThai 
                WHERE maVanChuyen = @maVanChuyen
            `);

        // Đồng bộ trạng thái sang hóa đơn
        let trangThaiHoaDon = 'cho_xac_nhan';
        if (trangThai === 'dang_giao') trangThaiHoaDon = 'dang_giao';
        else if (trangThai === 'da_giao') trangThaiHoaDon = 'hoan_tat';
        else if (trangThai === 'da_huy') trangThaiHoaDon = 'da_huy';

        if (maHoaDonLienQuan) {
            await pool.request()
                .input('trangThaiHD', sql.VarChar(30), trangThaiHoaDon)
                .input('maHoaDon', sql.VarChar(20), maHoaDonLienQuan)
                .query("UPDATE HoaDon SET trangThai = @trangThaiHD WHERE maHoaDon = @maHoaDon");
        }

        return { message: "Cập nhật vận chuyển và đồng bộ hóa đơn thành công!" };
    }
}

module.exports = VanChuyenService;
