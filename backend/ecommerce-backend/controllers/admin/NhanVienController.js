// file: controllers/admin/NhanVienController.js
const BaseController = require('../BaseController');

class NhanVienController extends BaseController {
    constructor(nhanVienService) {
        super();
        this.nhanVienService = nhanVienService;
    }

    // GET /api/nhanvien
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.nhanVienService.layDanhSach());
    }, "Lỗi lấy danh sách nhân viên");

    // POST /api/admin/nhanvien/them
    them = this.handle(async (req, res) => {
        const ketQua = await this.nhanVienService.them(req.body, req.auth.maCV);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm nhân viên");

    // PUT /api/admin/nhanvien/sua/:maNV
    sua = this.handle(async (req, res) => {
        const ketQua = await this.nhanVienService.sua(req.params.maNV, req.body, req.auth.maCV);
        res.json({ success: true, ...ketQua });
    }, "Lỗi sửa nhân viên");

    // DELETE /api/admin/nhanvien/xoa/:maNV
    xoa = this.handle(async (req, res) => {
        const ketQua = await this.nhanVienService.xoa(req.params.maNV, req.auth.maCV);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa nhân viên");

    // POST /api/nhanvien/tao-tai-khoan
    taoTaiKhoan = this.handle(async (req, res) => {
        // Chức vụ người thao tác lấy từ token (đã tra lại DB), KHÔNG đọc maChucVuNguoiThaoTac từ body
        const ketQua = await this.nhanVienService.taoTaiKhoan({
            thongTinMoi: req.body.thongTinMoi,
            maChucVuNguoiThaoTac: req.auth.maCV,
        });
        res.status(200).json({ success: true, ...ketQua });
    }, "Lỗi cấp tài khoản nhân viên");
}

module.exports = NhanVienController;
