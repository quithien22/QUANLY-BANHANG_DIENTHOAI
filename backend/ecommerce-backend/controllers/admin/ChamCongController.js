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
        const ketQua = await this.chamCongService.chamCongTuDong(req.body.maNV);
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
        const ketQua = await this.chamCongService.capNhatLuongCoBan(req.params.maNV, req.body);
        res.json({ success: true, ...ketQua });
    }, "Lỗi cập nhật lương");
}

module.exports = ChamCongController;
