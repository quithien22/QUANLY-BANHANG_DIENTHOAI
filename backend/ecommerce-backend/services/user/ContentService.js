// file: services/ContentService.js
// Nội dung hiển thị: banner quảng cáo và FAQ / trợ giúp.
const BaseService = require('../BaseService');

class ContentService extends BaseService {
    // Dùng chung cho cả Admin và User
    async getBanners() {
        const pool = await this.getPool();
        const result = await pool.request().query("SELECT * FROM BannerQC ORDER BY viTri, thuTu ASC");
        return result.recordset;
    }

    // Danh mục FAQ (đang bật) kèm danh sách câu hỏi của từng danh mục
    async getFaq() {
        const pool = await this.getPool();
        const resultDanhMuc = await pool.request().query("SELECT * FROM DanhMucFAQ WHERE trangThai = 1 ORDER BY thuTu ASC");
        const resultCauHoi = await pool.request().query("SELECT * FROM CauHoiFAQ WHERE trangThai = 1 ORDER BY thuTu ASC");

        return resultDanhMuc.recordset.map(dm => ({
            ...dm,
            cauHoiList: resultCauHoi.recordset.filter(ch => ch.maDanhMuc === dm.maDanhMuc)
        }));
    }
}

module.exports = ContentService;
