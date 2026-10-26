// file: services/admin/NhaCungCapService.js
const BaseService = require('../BaseService');

class NhaCungCapService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`SELECT * FROM NhaCungCap ORDER BY maNCC`);
        return ketQua.recordset;
    }

    // Mã NCC tự sinh: NCC + (tổng số hiện có + 1)
    async them({ tenNCC, diaChi, SDT }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const dem = await pool.request().query("SELECT COUNT(*) AS total FROM NhaCungCap");
        const maNCC = "NCC" + (dem.recordset[0].total + 1).toString().padStart(2, '0');

        await pool.request()
            .input('maNCC', sql.VarChar(20), maNCC)
            .input('tenNCC', sql.NVarChar(100), tenNCC)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi)
            .input('SDT', sql.VarChar(15), SDT)
            .query(`INSERT INTO NhaCungCap (maNCC, tenNCC, diaChi, SDT, trangThai) VALUES (@maNCC, @tenNCC, @diaChi, @SDT, 0)`);

        return { message: "Thêm nhà cung cấp thành công", maNCC };
    }

    // Sửa NCC (kể cả đổi trạng thái Đang hợp tác / Ngừng hợp tác)
    async sua(maNCC, { tenNCC, diaChi, SDT, trangThai }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maNCC', sql.VarChar(20), maNCC)
            .input('tenNCC', sql.NVarChar(100), tenNCC)
            .input('diaChi', sql.NVarChar(sql.MAX), diaChi)
            .input('SDT', sql.VarChar(15), SDT)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query(`UPDATE NhaCungCap SET tenNCC=@tenNCC, diaChi=@diaChi, SDT=@SDT, trangThai=@trangThai WHERE maNCC=@maNCC`);

        return { message: "Cập nhật nhà cung cấp thành công" };
    }
}

module.exports = NhaCungCapService;
