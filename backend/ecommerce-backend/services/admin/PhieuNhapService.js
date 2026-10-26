// file: services/admin/PhieuNhapService.js
// Phiếu nhập hàng: danh sách, chi tiết, tạo phiếu (tạo lô hàng + cộng tồn kho trong 1 transaction).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class PhieuNhapService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT 
                pn.maPN, pn.ngayLap, pn.gioLap, pn.tongTien, pn.maNV, pn.trangThai,
                ncc.*
            FROM PhieuNhap pn
            LEFT JOIN NhaCungCap ncc ON pn.maNCC = ncc.maNCC
        `);
        return ketQua.recordset;
    }

    // Chi tiết 1 phiếu nhập (đi qua LoHang để lấy tên sản phẩm)
    async layChiTiet(maPN) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('maPN', sql.VarChar(20), maPN)
            .query(`
                SELECT ctpn.soLuong, ctpn.giaNhap, sp.maSP, sp.tenSP AS tenSanPham,
                       lh.hanSuDung, lh.ngayNhap
                FROM ChiTietPhieuNhap ctpn
                JOIN LoHang lh ON ctpn.maLoHang = lh.maLoHang
                JOIN SanPham sp ON lh.maSP = sp.maSP
                WHERE ctpn.maPN = @maPN
            `);
        return ketQua.recordset;
    }

    // danhSachSanPham: [{ maSP, soLuong, giaNhap, hanSuDung }]
    async tao({ maNCC, maNV, danhSachSanPham }) {
        const sql = this.sql;

        if (!maNCC || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
            throw new HttpError(400, "Thiếu nhà cung cấp hoặc danh sách sản phẩm.");
        }

        const pool = await this.getPool();
        const giaoDich = new sql.Transaction(pool);
        await giaoDich.begin();

        try {
            const tongTien = danhSachSanPham.reduce(
                (tong, sp) => tong + (Number(sp.soLuong) || 0) * (Number(sp.giaNhap) || 0), 0
            );

            const maPN = 'PN' + Date.now();
            await new sql.Request(giaoDich)
                .input('maPN', sql.VarChar(20), maPN)
                .input('maNCC', sql.VarChar(20), maNCC)
                .input('maNV', sql.VarChar(20), maNV || null)
                .input('tongTien', sql.Decimal(15, 2), tongTien)
                .query(`
                    INSERT INTO PhieuNhap (maPN, ngayLap, gioLap, tongTien, maNCC, maNV, trangThai)
                    VALUES (@maPN, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), @tongTien, @maNCC, @maNV, 1)
                `);

            for (const sp of danhSachSanPham) {
                const maLoHang = 'LH' + Date.now() + Math.floor(Math.random() * 1000);

                await new sql.Request(giaoDich)
                    .input('maLoHang', sql.VarChar(20), maLoHang)
                    .input('maSP', sql.VarChar(20), sp.maSP)
                    .input('hanSuDung', sql.Date, sp.hanSuDung || null)
                    .query(`INSERT INTO LoHang (maLoHang, maSP, hanSuDung, ngayNhap) VALUES (@maLoHang, @maSP, @hanSuDung, GETDATE())`);

                await new sql.Request(giaoDich)
                    .input('maPN', sql.VarChar(20), maPN)
                    .input('maLoHang', sql.VarChar(20), maLoHang)
                    .input('soLuong', sql.Int, sp.soLuong)
                    .input('giaNhap', sql.Float, sp.giaNhap)
                    .query(`INSERT INTO ChiTietPhieuNhap (maPN, maLoHang, soLuong, giaNhap) VALUES (@maPN, @maLoHang, @soLuong, @giaNhap)`);

                // Nhập hàng -> cộng tồn kho ngay
                await new sql.Request(giaoDich)
                    .input('maSP', sql.VarChar(20), sp.maSP)
                    .input('soLuong', sql.Int, sp.soLuong)
                    .query(`UPDATE SanPham SET tonKho = tonKho + @soLuong WHERE maSP = @maSP`);
            }

            await giaoDich.commit();
            return { message: "Tạo phiếu nhập thành công", maPN };
        } catch (loi) {
            await giaoDich.rollback();
            throw loi;
        }
    }
}

module.exports = PhieuNhapService;
