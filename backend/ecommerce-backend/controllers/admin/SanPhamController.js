// file: controllers/admin/SanPhamController.js
const BaseController = require('../BaseController');

class SanPhamController extends BaseController {
    constructor(sanPhamService) {
        super();
        this.sanPhamService = sanPhamService;
    }

    // GET /api/sanpham
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.sanPhamService.layDanhSach());
    }, "Lỗi lấy danh sách sản phẩm");

    // POST /api/sanpham/them  (multipart: anhSanPham[])
    them = this.handle(async (req, res) => {
        const ketQua = await this.sanPhamService.them(req.body, req.files || []);
        res.status(200).json({ success: true, ...ketQua });
    }, "Lỗi thêm sản phẩm");

    // PUT /api/sanpham/sua/:maSP  (multipart: anhSanPham[])
    sua = this.handle(async (req, res) => {
        const ketQua = await this.sanPhamService.sua(req.params.maSP, req.body, req.files || []);
        res.status(200).json({ success: true, ...ketQua });
    }, "Lỗi cập nhật sản phẩm");

    // DELETE /api/sanpham/:maSP
    xoa = this.handle(async (req, res) => {
        const ketQua = await this.sanPhamService.xoa(req.params.maSP);
        res.status(200).json({ success: true, ...ketQua });
    }, "Không thể xóa (có thể sản phẩm đang được tham chiếu ở hóa đơn khác)");
}

module.exports = SanPhamController;
