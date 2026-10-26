// file: controllers/admin/ThuongHieuController.js
const BaseController = require('../BaseController');

class ThuongHieuController extends BaseController {
    constructor(thuongHieuService) {
        super();
        this.thuongHieuService = thuongHieuService;
    }

    // GET /api/thuonghieu
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.thuongHieuService.layDanhSach());
    }, "Lỗi lấy danh sách thương hiệu");

    // PUT /api/admin/thuonghieu/trangthai/:maThuongHieu
    doiTrangThai = this.handle(async (req, res) => {
        const ketQua = await this.thuongHieuService.doiTrangThai(req.params.maThuongHieu, req.body.trangThai);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật trạng thái thương hiệu");

    // POST /api/admin/thuonghieu/them
    them = this.handle(async (req, res) => {
        const ketQua = await this.thuongHieuService.them(req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm thương hiệu");

    // PUT /api/admin/thuonghieu/sua/:maThuongHieu
    sua = this.handle(async (req, res) => {
        const ketQua = await this.thuongHieuService.sua(req.params.maThuongHieu, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi sửa thương hiệu");

    // DELETE /api/admin/thuonghieu/xoa/:maThuongHieu
    xoa = this.handle(async (req, res) => {
        const ketQua = await this.thuongHieuService.xoa(req.params.maThuongHieu);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa thương hiệu");
}

module.exports = ThuongHieuController;
