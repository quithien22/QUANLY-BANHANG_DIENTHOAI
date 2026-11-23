// file: controllers/CustomerController.js
const BaseController = require('../BaseController');

class CustomerController extends BaseController {
    constructor(customerService) {
        super();
        this.customerService = customerService;
    }

    // GET /api/khachhang/:maKH
    getProfile = this.handle(async (req, res) => {
        const data = await this.customerService.getProfile(req.params.maKH);
        res.json({ success: true, data });
    }, "Lỗi lấy 1 khách hàng", { serverMessage: (err) => "Lỗi server: " + err.message });

    // PUT /api/user/cap-nhat-info
    updateInfo = this.handle(async (req, res) => {
        await this.customerService.updateInfo({ ...req.body, maKH: req.auth.maKH });
        res.status(200).json({ success: true, message: "Cập nhật thành công!" });
    }, "LỖI SQL KHI CẬP NHẬT KHÁCH HÀNG", { serverMessage: (err) => "Lỗi hệ thống: " + err.message });

    // PUT /api/user/doi-mat-khau
    changePassword = this.handle(async (req, res) => {
        await this.customerService.changePassword({ ...req.body, maKH: req.auth.maKH });
        res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    }, "Lỗi đổi mật khẩu KH", { serverMessage: "Lỗi hệ thống!" });
}

module.exports = CustomerController;
