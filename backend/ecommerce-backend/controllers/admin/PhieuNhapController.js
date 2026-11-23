// file: controllers/admin/PhieuNhapController.js
const BaseController = require('../BaseController');

class PhieuNhapController extends BaseController {
    constructor(phieuNhapService) {
        super();
        this.phieuNhapService = phieuNhapService;
    }

    // GET /api/phieunhap_nhacungcap
    layDanhSach = this.handle(async (req, res) => {
        res.json(await this.phieuNhapService.layDanhSach());
    }, "Lỗi lấy danh sách phiếu nhập");

    // GET /api/phieunhap_nhacungcap/:maPN/chitiet
    layChiTiet = this.handle(async (req, res) => {
        res.json(await this.phieuNhapService.layChiTiet(req.params.maPN));
    }, "Lỗi lấy chi tiết phiếu nhập");

    // POST /api/phieunhap_nhacungcap/them
    tao = this.handle(async (req, res) => {
        // maNV (người lập phiếu) lấy từ token, không tin maNV client gửi
        const ketQua = await this.phieuNhapService.tao({ ...req.body, maNV: req.auth.maNV });
        res.status(200).json({ success: true, ...ketQua });
    }, "Lỗi tạo phiếu nhập");
}

module.exports = PhieuNhapController;
