// file: controllers/admin/NhaCungCapController.js
const BaseController = require('../BaseController');

class NhaCungCapController extends BaseController {
    constructor(nhaCungCapService) {
        super();
        this.nhaCungCapService = nhaCungCapService;
    }

    // GET /api/nhacungcap
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.nhaCungCapService.layDanhSach());
    }, "Lỗi lấy danh sách nhà cung cấp");

    // POST /api/nhacungcap/them
    them = this.handle(async (req, res) => {
        const ketQua = await this.nhaCungCapService.them(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm nhà cung cấp");

    // PUT /api/nhacungcap/sua/:maNCC
    sua = this.handle(async (req, res) => {
        const ketQua = await this.nhaCungCapService.sua(req.params.maNCC, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi sửa nhà cung cấp");
}

module.exports = NhaCungCapController;
