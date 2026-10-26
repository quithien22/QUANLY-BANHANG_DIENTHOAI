// file: services/WishlistService.js
// Sản phẩm yêu thích của khách hàng.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class WishlistService extends BaseService {
    // Thả tim / bỏ tim. Trả về 'added' hoặc 'removed'
    async toggle(maKH, maSP) {
        const sql = this.sql;
        if (!maKH || !maSP) {
            throw new HttpError(400, "Thiếu mã khách hàng hoặc mã sản phẩm");
        }

        const pool = await this.getPool();

        const check = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('maSP', sql.VarChar, maSP)
            .query("SELECT * FROM SanPhamYeuThich WHERE maKH = @maKH AND maSP = @maSP");

        if (check.recordset.length > 0) {
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .query("DELETE FROM SanPhamYeuThich WHERE maKH = @maKH AND maSP = @maSP");
            return 'removed';
        }

        await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('maSP', sql.VarChar, maSP)
            .query("INSERT INTO SanPhamYeuThich (maKH, maSP) VALUES (@maKH, @maSP)");
        return 'added';
    }

    async listByCustomer(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT sp.* 
                FROM SanPham sp
                INNER JOIN SanPhamYeuThich yt ON sp.maSP = yt.maSP
                WHERE yt.maKH = @maKH
                ORDER BY yt.ngayThem DESC
            `);
        return result.recordset;
    }
}

module.exports = WishlistService;
