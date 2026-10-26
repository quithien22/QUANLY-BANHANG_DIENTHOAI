// file: services/admin/BannerService.js
// Banner quảng cáo phía admin (GET danh sách nằm ở ContentService của user).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');
const { layUrlAnh } = require('../../utils/imageUrl');

class BannerService extends BaseService {
    // file: file upload (req.file), có thể undefined nếu admin dán link ảnh
    async them({ tenBanner, duongDan, viTri, thuTu, tieuDe, moTa, textNutBam, hinhAnhLink }, file) {
        const sql = this.sql;

        // Ưu tiên file upload; nếu không có thì nhận link ảnh http/https
        let hinhAnhUrl = null;
        if (file) {
            hinhAnhUrl = layUrlAnh(file.filename);
        } else if (hinhAnhLink && /^https?:\/\/\S+$/i.test(String(hinhAnhLink).trim())) {
            hinhAnhUrl = String(hinhAnhLink).trim();
        }

        if (!hinhAnhUrl) {
            throw new HttpError(400, "Vui lòng chọn hình ảnh hoặc nhập link ảnh hợp lệ (bắt đầu bằng http:// hoặc https://)!");
        }

        const pool = await this.getPool();
        await pool.request()
            .input('tenBanner', sql.NVarChar, tenBanner)
            .input('hinhAnh', sql.VarChar, hinhAnhUrl)
            .input('duongDan', sql.VarChar, duongDan || '')
            .input('viTri', sql.VarChar, viTri)
            .input('thuTu', sql.Int, thuTu || 1)
            .input('tieuDe', sql.NVarChar, tieuDe || '')
            .input('moTa', sql.NVarChar, moTa || '')
            .input('textNutBam', sql.NVarChar, textNutBam || '')
            .query(`
                INSERT INTO BannerQC (tenBanner, hinhAnh, duongDan, viTri, thuTu, trangThai, tieuDe, moTa, textNutBam) 
                VALUES (@tenBanner, @hinhAnh, @duongDan, @viTri, @thuTu, 1, @tieuDe, @moTa, @textNutBam)
            `);

        return { message: "Đã thêm Banner thành công!" };
    }

    async doiTrangThai(maBanner, trangThai) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maBanner', sql.Int, maBanner)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query("UPDATE BannerQC SET trangThai = @trangThai WHERE maBanner = @maBanner");

        return { message: "Đổi trạng thái thành công!" };
    }

    async xoa(maBanner) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maBanner', sql.Int, maBanner)
            .query("DELETE FROM BannerQC WHERE maBanner = @maBanner");

        return { message: "Xóa banner thành công!" };
    }
}

module.exports = BannerService;
