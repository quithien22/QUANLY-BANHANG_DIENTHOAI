// file: controllers/admin/VanChuyenController.js
const BaseController = require('../BaseController');

class VanChuyenController extends BaseController {
    constructor(vanChuyenService) {
        super();
        this.vanChuyenService = vanChuyenService;
    }

    // GET /api/vanchuyen
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.vanChuyenService.layDanhSach());
    }, "Lỗi lấy danh sách vận chuyển");

    // PUT /api/vanchuyen/:maVanChuyen
    capNhat = this.handle(async (req, res) => {
        const ketQua = await this.vanChuyenService.capNhat(req.params.maVanChuyen, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật vận chuyển");
}

module.exports = VanChuyenController;
