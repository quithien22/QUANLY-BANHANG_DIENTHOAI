// file: controllers/admin/KhachHangController.js
// Nhận request quản lý khách hàng, gọi KhachHangService, trả JSON. Không viết SQL ở đây.
const BaseController = require('../BaseController');

class KhachHangController extends BaseController {
    constructor(khachHangService) {
        super();
        this.khachHangService = khachHangService;
    }

    // GET /api/khachhang
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.khachHangService.layDanhSach());
    }, "Lỗi lấy danh sách khách hàng");

    // PUT /api/khachhang/sua/:maKH
    suaThongTin = this.handle(async (req, res) => {
        const { maKH } = req.params;
        const ketQua = await this.khachHangService.suaThongTin(maKH, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi khi cập nhật khách hàng");
}

module.exports = KhachHangController;
