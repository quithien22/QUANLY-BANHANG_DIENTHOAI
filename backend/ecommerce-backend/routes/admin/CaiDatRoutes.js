// file: routes/admin/CaiDatRoutes.js
// GET /api/caidat/banner thuộc ContentRoutes (user); các route banner của admin nằm ở BannerRoutes.
const BaseRoutes = require('../BaseRoutes');
const uploadAvatar = require('../../middlewares/uploadAvatar');
const { ROLES, requireAdmin, optionalAdmin } = require('../../middlewares/auth');

class CaiDatRoutes extends BaseRoutes {
    constructor(caiDatController) {
        super('/api/caidat');
        this.caiDatController = caiDatController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.caiDatController;
        // Công khai (storefront dùng thông tin cửa hàng); có token nhân viên thì trả thêm hồ sơ của chính họ
        this.router.get('/', optionalAdmin(), c.layTatCa);
        // Hồ sơ + mật khẩu: nhân viên chỉ sửa được CHÍNH MÌNH (maNV lấy từ token)
        this.router.put('/hoso', requireAdmin(), uploadAvatar.single('avatar'), c.capNhatHoSo);
        this.router.put('/matkhau', requireAdmin(), c.doiMatKhau);
        // Cấu hình cửa hàng / vận chuyển: chỉ Giám đốc + Quản lý
        this.router.put('/cuahang', requireAdmin(...ROLES.QUAN_TRI), c.capNhatCuaHang);
        this.router.put('/vanchuyen', requireAdmin(...ROLES.QUAN_TRI), c.capNhatVanChuyen);
    }
}

module.exports = CaiDatRoutes;
