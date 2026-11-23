// file: controllers/admin/CaiDatController.js
const BaseController = require('../BaseController');

class CaiDatController extends BaseController {
    constructor(caiDatService) {
        super();
        this.caiDatService = caiDatService;
    }

    // GET /api/caidat  (công khai; có token nhân viên hợp lệ thì trả thêm hồ sơ của chính người đó)
    layTatCa = this.handle(async (req, res) => {
        res.json(await this.caiDatService.layTatCa(req.auth?.maNV));
    }, "Lỗi lấy cài đặt");

    // PUT /api/caidat/hoso
    capNhatHoSo = this.handle(async (req, res) => {
        const ketQua = await this.caiDatService.capNhatHoSo({ ...req.body, maNV: req.auth.maNV }, req.file);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật hồ sơ");

    // PUT /api/caidat/matkhau
    doiMatKhau = this.handle(async (req, res) => {
        await this.caiDatService.doiMatKhau({ ...req.body, maNV: req.auth.maNV });
        res.json({ success: true });
    }, "Lỗi đổi mật khẩu");

    // PUT /api/caidat/cuahang
    capNhatCuaHang = this.handle(async (req, res) => {
        await this.caiDatService.capNhatCuaHang(req.body);
        res.json({ success: true });
    }, "Lỗi cập nhật cửa hàng");

    // PUT /api/caidat/vanchuyen
    capNhatVanChuyen = this.handle(async (req, res) => {
        await this.caiDatService.capNhatVanChuyen(req.body);
        res.json({ success: true });
    }, "Lỗi cập nhật vận chuyển");
}

module.exports = CaiDatController;
