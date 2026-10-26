// file: controllers/admin/AuthAdminController.js
// Nhận request đăng nhập nhân viên, gọi AuthAdminService, trả JSON. Không viết SQL ở đây.
const BaseController = require('../BaseController');

class AuthAdminController extends BaseController {
    constructor(authAdminService) {
        super();
        this.authAdminService = authAdminService;
    }

    // POST /api/admin/dang-nhap -> { success, adminInfo }
    login = this.handle(async (req, res) => {
        const adminInfo = await this.authAdminService.login(req.body);
        res.status(200).json({ success: true, adminInfo });
    }, "Lỗi đăng nhập Admin", { serverMessage: (err) => "Lỗi máy chủ: " + err.message });
}

module.exports = AuthAdminController;
