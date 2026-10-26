// file: services/admin/KhuyenMaiService.js
// Khuyến mãi và Flash Sale phía admin.
const BaseService = require('../BaseService');

class KhuyenMaiService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`SELECT * FROM KhuyenMai km`);
        return ketQua.recordset;
    }

    // Danh sách khung giờ Flash Sale kèm sản phẩm bên trong
    async layFlashSale() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT 
                kgls.maKhungGio, kgls.gioBD, kgls.gioKT, kgls.ngayApDung, kgls.trangThai AS trangThaiKhungGio,
                spkm.giaFlashSale, spkm.soLuongGioiHan, spkm.daBan,
                sp.maSP, sp.tenSP, sp.hinhAnh, sp.giaBan
            FROM KhungGioFlashSale kgls
            LEFT JOIN SanPhamFlashSale spkm ON kgls.maKhungGio = spkm.maKhungGio
            LEFT JOIN SanPham sp ON spkm.maSP = sp.maSP
            ORDER BY kgls.ngayApDung DESC, kgls.gioBD DESC
        `);
        return ketQua.recordset;
    }

    async taoKhungGio({ ngayApDung, gioBD, gioKT }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const maKhungGio = 'KG' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .input('gioBD', sql.VarChar(10), gioBD)
            .input('gioKT', sql.VarChar(10), gioKT)
            .input('ngayApDung', sql.Date, ngayApDung)
            .query(`
                INSERT INTO KhungGioFlashSale (maKhungGio, gioBD, gioKT, ngayApDung, trangThai) 
                VALUES (@maKhungGio, @gioBD, @gioKT, @ngayApDung, 'sap_dien_ra')
            `);

        return { message: "Tạo khung giờ Flash Sale thành công!" };
    }

    // maFS chính là mã khung giờ (frontend gửi tên maFS)
    async themSanPhamFlashSale({ maFS, maSP, giaFlashSale, soLuongGioiHan }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maFS)
            .input('maSP', sql.VarChar(20), maSP)
            .input('giaFlashSale', sql.Float, giaFlashSale)
            .input('soLuongGioiHan', sql.Int, soLuongGioiHan)
            .query(`
                INSERT INTO SanPhamFlashSale (maKhungGio, maSP, giaFlashSale, soLuongGioiHan, daBan) 
                VALUES (@maKhungGio, @maSP, @giaFlashSale, @soLuongGioiHan, 0)
            `);

        return { message: "Thêm sản phẩm vào Flash Sale thành công!" };
    }
}

module.exports = KhuyenMaiService;
