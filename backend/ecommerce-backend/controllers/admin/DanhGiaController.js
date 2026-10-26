// file: controllers/admin/DanhGiaController.js
const BaseController = require('../BaseController');

class DanhGiaController extends BaseController {
    constructor(danhGiaService) {
        super();
        this.danhGiaService = danhGiaService;
    }

    // GET /api/admin/danhgiasanpham
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.danhGiaService.layDanhSach());
    }, "Lỗi lấy danh sách đánh giá admin");

    // POST /api/admin/danhgia/phanhoi
    guiPhanHoi = this.handle(async (req, res) => {
        const ketQua = await this.danhGiaService.guiPhanHoi(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi gửi phản hồi");

    // DELETE /api/admin/danhgia/xoa/:maDanhGia
    xoa = this.handle(async (req, res) => {
        const ketQua = await this.danhGiaService.xoa(req.params.maDanhGia);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa đánh giá");
}

module.exports = DanhGiaController;
