// file: controllers/admin/ChamCongController.js
const BaseController = require('../BaseController');

class ChamCongController extends BaseController {
    constructor(chamCongService) {
        super();
        this.chamCongService = chamCongService;
    }

    // GET /api/chamcong?thang=&nam=
    layBang = this.handle(async (req, res) => {
        const { thang, nam } = req.query;
        res.json(await this.chamCongService.layBang(thang, nam));
    }, "Lỗi lấy dữ liệu chấm công");

    // POST /api/chamcong/tu-dong
    chamCongTuDong = this.handle(async (req, res) => {
        // Chỉ chấm công cho chính người đang đăng nhập
        const ketQua = await this.chamCongService.chamCongTuDong(req.auth.maNV);
        res.json({ success: true, ...ketQua });
    }, "Lỗi tự động chấm công");

    // POST /api/luong/tinh-toan
    tinhLuong = this.handle(async (req, res) => {
        const { thang, nam } = req.body;
        const ketQua = await this.chamCongService.tinhLuong(thang, nam);
        res.status(200).json({ success: true, ...ketQua });
    }, "Lỗi API tính lương");

    // PUT /api/luong/cap-nhat-co-ban/:maNV
    capNhatLuongCoBan = this.handle(async (req, res) => {
        // maCVNguoiThaoTac lấy từ token (route đã giới hạn cho Giám đốc), không đọc từ body
        const ketQua = await this.chamCongService.capNhatLuongCoBan(req.params.maNV, {
            ...req.body,
            maCVNguoiThaoTac: req.auth.maCV,
        });
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật lương");
}

module.exports = ChamCongController;
