// file: controllers/admin/HoaDonController.js
const BaseController = require('../BaseController');

class HoaDonController extends BaseController {
    constructor(hoaDonService) {
        super();
        this.hoaDonService = hoaDonService;
    }

    // GET /api/hoadon
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.hoaDonService.layDanhSach());
    }, "Lỗi lấy danh sách hóa đơn");

    // GET /api/hoadon/toanbo
    layToanBo = this.handle(async (req, res) => {
        res.json(await this.hoaDonService.layToanBo());
    }, "Lỗi lấy danh sách hóa đơn");

    // GET /api/hoadon/chitiet/:maHoaDon
    layChiTiet = this.handle(async (req, res) => {
        res.json(await this.hoaDonService.layChiTiet(req.params.maHoaDon));
    }, "Lỗi lấy chi tiết hóa đơn");

    // PUT /api/hoadon/capnhat-trangthai/:maHoaDon
    capNhatTrangThai = this.handle(async (req, res) => {
        const { maHoaDon } = req.params;
        const { trangThai } = req.body;
        const ketQua = await this.hoaDonService.capNhatTrangThai(maHoaDon, trangThai);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật trạng thái hóa đơn");
}

module.exports = HoaDonController;
