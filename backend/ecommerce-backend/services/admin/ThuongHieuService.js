// file: services/admin/ThuongHieuService.js
// Danh mục sản phẩm = thương hiệu. GET danh sách cũng được frontend user dùng (ProductApi.getBrands).
const BaseService = require('../BaseService');

class ThuongHieuService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`SELECT th.* FROM ThuongHieu th`);
        return ketQua.recordset;
    }

    async doiTrangThai(maThuongHieu, trangThai) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maThuongHieu', sql.VarChar, maThuongHieu)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query("UPDATE ThuongHieu SET trangThai = @trangThai WHERE maThuongHieu = @maThuongHieu");

        return { message: "Cập nhật trạng thái thành công" };
    }

    // Mã tự sinh dạng TH + (số lớn nhất hiện có + 1), mặc định đang bật.
    // Trước đây dùng COUNT(*)+1 nên sau khi xóa 1 thương hiệu rồi thêm mới sẽ sinh trùng mã (lỗi khóa chính).
    async them({ tenThuongHieu, hinhAnh }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const dem = await pool.request().query(
            "SELECT MAX(TRY_CAST(SUBSTRING(maThuongHieu, 3, 20) AS INT)) AS maxSo FROM ThuongHieu WHERE maThuongHieu LIKE 'TH[0-9]%'"
        );
        const maMoi = 'TH' + String((dem.recordset[0].maxSo || 0) + 1).padStart(2, '0');

        await pool.request()
            .input('maThuongHieu', sql.VarChar, maMoi)
            .input('tenThuongHieu', sql.NVarChar(50), tenThuongHieu)
            .input('hinhAnh', sql.VarChar(255), hinhAnh || "https://via.placeholder.com/48")
            .input('trangThai', sql.Bit, 1)
            .query(`
                INSERT INTO ThuongHieu (maThuongHieu, tenThuongHieu, hinhAnh, trangThai) 
                VALUES (@maThuongHieu, @tenThuongHieu, @hinhAnh, @trangThai)
            `);

        return { message: "Thêm thương hiệu thành công" };
    }

    async sua(maThuongHieu, { tenThuongHieu, hinhAnh }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maThuongHieu', sql.VarChar, maThuongHieu)
            .input('tenThuongHieu', sql.NVarChar(50), tenThuongHieu)
            .input('hinhAnh', sql.VarChar(255), hinhAnh || "https://via.placeholder.com/48")
            .query(`
                UPDATE ThuongHieu 
                SET tenThuongHieu = @tenThuongHieu, hinhAnh = @hinhAnh 
                WHERE maThuongHieu = @maThuongHieu
            `);

        return { message: "Cập nhật thương hiệu thành công" };
    }

    async xoa(maThuongHieu) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maThuongHieu', sql.VarChar, maThuongHieu)
            .query("DELETE FROM ThuongHieu WHERE maThuongHieu = @maThuongHieu");

        return { message: "Xóa thành công" };
    }
}

module.exports = ThuongHieuService;
