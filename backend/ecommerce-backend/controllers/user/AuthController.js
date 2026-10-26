// file: controllers/AuthController.js
const BaseController = require('../BaseController');

class AuthController extends BaseController {
    constructor(authService) {
        super();
        this.authService = authService;
    }

    // POST /api/user/dang-nhap
    login = this.handle(async (req, res) => {
        const userInfo = await this.authService.login(req.body);
        res.status(200).json({ success: true, userInfo });
    }, "Lỗi đăng nhập User", { serverMessage: "Lỗi hệ thống, vui lòng thử lại sau!" });

    // POST /api/user/dang-ky
    register = this.handle(async (req, res) => {
        await this.authService.register(req.body);
        res.status(200).json({ success: true, message: "Đăng ký thành công!" });
    }, "Lỗi đăng ký Khách hàng", { serverMessage: (err) => "Lỗi hệ thống: " + err.message });

    // POST /api/user/dang-nhap-google
    loginGoogle = this.handle(async (req, res) => {
        const userInfo = await this.authService.loginGoogle(req.body);
        res.status(200).json({ success: true, userInfo });
    }, "Lỗi đăng nhập Google", { serverMessage: "Lỗi hệ thống, vui lòng thử lại sau!" });
}

module.exports = AuthController;
