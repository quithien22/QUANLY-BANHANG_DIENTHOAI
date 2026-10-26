// file: controllers/admin/DoiTraHangController.js
const BaseController = require('../BaseController');

class DoiTraHangController extends BaseController {
    constructor(doiTraHangService) {
        super();
        this.doiTraHangService = doiTraHangService;
    }

    // GET /api/doitrahang
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.doiTraHangService.layDanhSach());
    }, "Lỗi lấy danh sách đổi trả");

    // GET /api/doitrahang/:maDoiTra/chitiet
    layChiTiet = this.handle(async (req, res) => {
        res.json(await this.doiTraHangService.layChiTiet(req.params.maDoiTra));
    }, "Lỗi lấy chi tiết đổi trả");

    // PUT /api/doitrahang/xuly/:maDoiTra
    xuLy = this.handle(async (req, res) => {
        const ketQua = await this.doiTraHangService.xuLy(req.params.maDoiTra, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi CSDL khi cập nhật đổi trả");
}

module.exports = DoiTraHangController;
