const BaseController = require ('../BaseController');

class AuthAdminController extends BaseController {
    constructor(AuthAdmin){
        super();
        this.AuthAdmin  = AuthAdmin;
    }

    // POST /api/admin/dang-nhap
    login = this.handle(async(req, res) => {
        const adminInfo = await this.AuthAdmin.login(req.body);
        res.status(200).json({success:true, adminInfo});

    }, "Lỗi đăng nhập Admin", { serverMessage: "Lỗi hệ thống, vui lòng thử lại sau!" });
}

module.exports = AuthAdminController;