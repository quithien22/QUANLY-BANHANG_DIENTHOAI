// file: controllers/admin/ThongKeController.js
const BaseController = require('../BaseController');

class ThongKeController extends BaseController {
    constructor(thongKeService) {
        super();
        this.thongKeService = thongKeService;
    }

    // GET /api/thongke/tongquan?khoang=
    layTongQuan = this.handle(async (req, res) => {
        res.json(await this.thongKeService.layTongQuan(req.query.khoang));
    }, "Lỗi thống kê tổng quan");

    // GET /api/thongke/doanhthu?khoang=&theo=
    layDoanhThu = this.handle(async (req, res) => {
        res.json(await this.thongKeService.layDoanhThu(req.query.khoang, req.query.theo));
    }, "Lỗi biểu đồ doanh thu");

    // GET /api/thongke/top-san-pham?khoang=
    layTopSanPham = this.handle(async (req, res) => {
        res.json(await this.thongKeService.layTopSanPham(req.query.khoang));
    }, "Lỗi top sản phẩm");

    // GET /api/thongke/khuyenmai?khoang=
    layHieuQuaKhuyenMai = this.handle(async (req, res) => {
        res.json(await this.thongKeService.layHieuQuaKhuyenMai(req.query.khoang));
    }, "Lỗi hiệu quả khuyến mãi");

    // GET /api/thongke/ton-kho-canh-bao
    layTonKhoCanhBao = this.handle(async (req, res) => {
        res.json(await this.thongKeService.layTonKhoCanhBao());
    }, "Lỗi tồn kho cảnh báo");
}

module.exports = ThongKeController;
