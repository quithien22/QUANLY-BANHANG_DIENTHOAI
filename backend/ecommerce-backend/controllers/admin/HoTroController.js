// file: controllers/admin/HoTroController.js
const BaseController = require('../BaseController');

class HoTroController extends BaseController {
    constructor(hoTroService) {
        super();
        this.hoTroService = hoTroService;
    }

    // POST /api/admin/faq/danhmuc
    themDanhMuc = this.handle(async (req, res) => {
        const ketQua = await this.hoTroService.themDanhMuc(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm danh mục FAQ");

    // POST /api/admin/faq/cauhoi
    themCauHoi = this.handle(async (req, res) => {
        const ketQua = await this.hoTroService.themCauHoi(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm câu hỏi FAQ");

    // DELETE /api/admin/faq/cauhoi/:id
    xoaCauHoi = this.handle(async (req, res) => {
        const ketQua = await this.hoTroService.xoaCauHoi(req.params.id);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa câu hỏi FAQ");
}

module.exports = HoTroController;
