// file: controllers/ReturnController.js
const BaseController = require('../BaseController');

class ReturnController extends BaseController {
    constructor(returnService) {
        super();
        this.returnService = returnService;
    }

    // POST /api/user/doitrahang/tao  (multipart, trường ảnh: hinhAnh)
    create = this.handle(async (req, res) => {
        const { maHoaDon, lyDo, loaiYeuCau } = req.body;
        await this.returnService.create({ maHoaDon, lyDo, loaiYeuCau, file: req.file, maKH: req.auth.maKH });
        res.json({ success: true, message: "Gửi yêu cầu đổi trả thành công!" });
    }, "Lỗi tạo đổi trả", { serverMessage: (err) => "Lỗi server: " + err.message });

    // GET /api/user/doitrahang/:maKH
    list = this.handle(async (req, res) => {
        res.json(await this.returnService.listByCustomer(req.params.maKH));
    }, "Lỗi lấy lịch sử đổi trả user", { plainText: true, serverMessage: (err) => "Lỗi server: " + err.message });
}

module.exports = ReturnController;
