const BaseController = require ('../BaseController');
const { phatTokenNhanVien } = require('../../middlewares/auth');

class AuthAdminController extends BaseController {
    constructor(AuthAdmin){
        super();
        this.AuthAdmin  = AuthAdmin;
    }

    // POST /api/admin/dang-nhap
    login = this.handle(async(req, res) => {
        const info = await this.AuthAdmin.login(req.body);
        // Gắn JWT vào adminInfo; frontend lưu nguyên adminInfo (gồm token) và gửi lại qua header Authorization
        const adminInfo = { ...info, token: phatTokenNhanVien(info.maNV) };
        res.status(200).json({success:true, adminInfo});

    }, "Lỗi đăng nhập Admin", { serverMessage: "Lỗi hệ thống, vui lòng thử lại sau!" });
}

module.exports = AuthAdminController;