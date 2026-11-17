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

    // POST /api/admin/khuyenmai/them
    taoKhuyenMai = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.taoKhuyenMai(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi tạo khuyến mãi");

    // PUT /api/admin/khuyenmai/:maKM/trangthai  body: { trangThai: true|false }
    capNhatTrangThai = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.capNhatTrangThai(req.params.maKM, req.body.trangThai);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật trạng thái khuyến mãi");

    // PUT /api/admin/flashsale/khunggio/:maKhungGio  body: { ngayApDung, gioBD, gioKT, maKM }
    capNhatKhungGio = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.capNhatKhungGio(req.params.maKhungGio, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật khung giờ Flash Sale");

    // DELETE /api/admin/flashsale/khunggio/:maKhungGio
    xoaKhungGio = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.xoaKhungGio(req.params.maKhungGio);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa khung giờ Flash Sale");

    // DELETE /api/admin/flashsale/khunggio/:maKhungGio/sanpham/:maSP
    xoaSanPhamFlashSale = this.handle(async (req, res) => {
        const ketQua = await this.khuyenMaiService.xoaSanPhamFlashSale(req.params.maKhungGio, req.params.maSP);
        res.json({ success: true, ...ketQua });
    }, "Lỗi gỡ sản phẩm khỏi Flash Sale");

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
