// file: services/admin/HoTroService.js
// Quản lý FAQ (danh mục + câu hỏi) cho trang hỗ trợ khách hàng. GET FAQ phía user nằm ở ContentService.
const BaseService = require('../BaseService');

class HoTroService extends BaseService {
    async themDanhMuc({ tenDanhMuc, thuTu }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('tenDanhMuc', sql.NVarChar(255), tenDanhMuc)
            .input('thuTu', sql.Int, thuTu || 1)
            .query("INSERT INTO DanhMucFAQ (tenDanhMuc, thuTu, trangThai) VALUES (@tenDanhMuc, @thuTu, 1)");

        return { message: "Thêm danh mục thành công!" };
    }

    async themCauHoi({ maDanhMuc, cauHoi, traLoi, thuTu, linkLienQuan, anhLienQuan }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maDanhMuc', sql.Int, maDanhMuc)
            .input('cauHoi', sql.NVarChar(sql.MAX), cauHoi)
            .input('traLoi', sql.NVarChar(sql.MAX), traLoi)
            .input('thuTu', sql.Int, thuTu || 1)
            .input('linkLienQuan', sql.NVarChar(sql.MAX), linkLienQuan || null)
            .input('anhLienQuan', sql.NVarChar(sql.MAX), anhLienQuan || null)
            .query(`
                INSERT INTO CauHoiFAQ (maDanhMuc, cauHoi, traLoi, thuTu, trangThai, linkLienQuan, anhLienQuan) 
                VALUES (@maDanhMuc, @cauHoi, @traLoi, @thuTu, 1, @linkLienQuan, @anhLienQuan)
            `);

        return { message: "Thêm câu hỏi thành công!" };
    }

    async xoaCauHoi(maCauHoi) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maCauHoi', sql.Int, maCauHoi)
            .query("DELETE FROM CauHoiFAQ WHERE maCauHoi = @maCauHoi");

        return { message: "Đã xóa câu hỏi!" };
    }
}

module.exports = HoTroService;
