// file: controllers/admin/KhuyenMaiController.js
const BaseController = require('../BaseController');

class KhuyenMaiController extends BaseController {
    constructor(khuyenMaiService) {
        super();
        this.khuyenMaiService = khuyenMaiService;
    }

    // GET /api/khuyenmai
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.khuyenMaiService.layDanhSach());
    }, "Lỗi lấy danh sách khuyến mãi");

    // GET /api/sanphamflashsale
    layFlashSale = this.handle(async (req, res) => {
        res.json(await this.khuyenMaiService.layFlashSale());
    }, "Lỗi lấy danh sách flash sale");

    // POST /api/admin/flashsale/taokhunggio
    taoKhungGio = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.taoKhungGio(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi tạo khung giờ");

    // POST /api/admin/flashsale/themsanpham
    themSanPhamFlashSale = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.themSanPhamFlashSale(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm SP Flash Sale");
}

module.exports = KhuyenMaiController;
