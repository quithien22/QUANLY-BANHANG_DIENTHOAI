// file: services/AddressService.js
// Sổ địa chỉ nhận hàng. Xóa địa chỉ là xóa mềm (daXoa = 1).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class AddressService extends BaseService {
    async listByCustomer(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT * FROM DiaChiGiaoHang 
                WHERE maKH = @maKH 
                ORDER BY macDinh DESC
            `);
        // Lọc địa chỉ đã xóa mềm ở đây để không lỗi nếu bảng chưa có cột daXoa
        return result.recordset.filter((dc) => !dc.daXoa);
    }

    // Địa chỉ đầu tiên của khách tự động là mặc định
    async add({ maKH, hoTenNguoiNhan, SDT, diaChiChiTiet }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const checkResult = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`SELECT COUNT(*) as SoLuong FROM DiaChiGiaoHang WHERE maKH = @maKH`);

        const isMacDinh = checkResult.recordset[0].SoLuong === 0 ? 1 : 0;

        await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('hoTenNguoiNhan', sql.NVarChar, hoTenNguoiNhan)
            .input('SDT', sql.VarChar, SDT)
            .input('diaChiChiTiet', sql.NVarChar, diaChiChiTiet)
            .input('macDinh', sql.Bit, isMacDinh)
            .query(`
                INSERT INTO DiaChiGiaoHang (maKH, hoTenNguoiNhan, SDT, diaChiChiTiet, macDinh)
                VALUES (@maKH, @hoTenNguoiNhan, @SDT, @diaChiChiTiet, @macDinh)
            `);
    }

    // maKH (lấy từ token): chỉ sửa được địa chỉ của chính khách đó
    async update(maDiaChi, { hoTenNguoiNhan, SDT, diaChiChiTiet }, maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .input('maKH', sql.VarChar(20), maKH)
            .input('hoTenNguoiNhan', sql.NVarChar, hoTenNguoiNhan)
            .input('SDT', sql.VarChar, SDT)
            .input('diaChiChiTiet', sql.NVarChar, diaChiChiTiet)
            .query(`
                UPDATE DiaChiGiaoHang 
                SET hoTenNguoiNhan = @hoTenNguoiNhan, 
                    SDT = @SDT, 
                    diaChiChiTiet = @diaChiChiTiet
                WHERE maDiaChi = @maDiaChi AND maKH = @maKH
            `);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(404, "Không tìm thấy địa chỉ.");
        }
    }

    // maKH (lấy từ token): chỉ xóa được địa chỉ của chính khách đó
    async remove(maDiaChi, maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const checkResult = await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .input('maKH', sql.VarChar(20), maKH)
            .query(`SELECT macDinh FROM DiaChiGiaoHang WHERE maDiaChi = @maDiaChi AND maKH = @maKH`);

        if (checkResult.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy địa chỉ.");
        }
        if (checkResult.recordset[0].macDinh) {
            throw new HttpError(400, "Không thể xóa địa chỉ mặc định! Hãy chọn địa chỉ khác làm mặc định trước.");
        }

        await pool.request()
            .input('maDiaChi', sql.Int, maDiaChi)
            .input('maKH', sql.VarChar(20), maKH)
            .query(`UPDATE DiaChiGiaoHang SET daXoa = 1 WHERE maDiaChi = @maDiaChi AND maKH = @maKH`);
    }
}

module.exports = AddressService;
