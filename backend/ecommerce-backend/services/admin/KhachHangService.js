// file: services/admin/KhachHangService.js
// Nghiệp vụ + truy vấn DB cho trang quản lý khách hàng (admin). Không biết gì về req/res.
const BaseService = require('../BaseService');

class KhachHangService extends BaseService {
    // Danh sách khách hàng kèm tổng số hóa đơn của từng người
    async layDanhSach() {
        const pool = await this.getPool();

        const ketQua = await pool.request().query(`
            SELECT 
                kh.maKH, 
                kh.hoTen, 
                kh.SDT, 
                kh.email, 
                kh.diemTichLuy, 
                kh.trangThai,
                COUNT(hd.maHoaDon) AS tongDonHang
            FROM KhachHang kh
            LEFT JOIN HoaDon hd ON kh.maKH = hd.maKH
            GROUP BY 
                kh.maKH, kh.hoTen, kh.SDT, kh.email, kh.diemTichLuy, kh.trangThai
        `);

        return ketQua.recordset;
    }

    // Sửa tên, SĐT và trạng thái (khóa / mở khóa) của khách hàng
    async suaThongTin(maKH, { hoTen, SDT, trangThai }) {
        const sql = this.sql;
        const pool = await this.getPool();

        // Ép kiểu trangThai về dạng Bit (1 hoặc 0) cho SQL Server
        const trangThaiBit = (trangThai === true || trangThai === "true") ? 1 : 0;

        await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('hoTen', sql.NVarChar(100), hoTen)
            .input('SDT', sql.VarChar(20), SDT)
            .input('trangThai', sql.Bit, trangThaiBit)
            .query(`
                UPDATE KhachHang 
                SET hoTen = @hoTen, SDT = @SDT, trangThai = @trangThai 
                WHERE maKH = @maKH
            `);

        return { message: "Cập nhật thông tin khách hàng thành công!" };
    }
}

module.exports = KhachHangService;
