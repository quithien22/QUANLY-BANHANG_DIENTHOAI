// file: routes/admin/ChamCongRoutes.js
// Mount ở /api vì gom hai nhóm: /chamcong/... và /luong/...
const BaseRoutes = require('../BaseRoutes');
const { ROLES, requireAdmin } = require('../../middlewares/auth');

class ChamCongRoutes extends BaseRoutes {
    constructor(chamCongController) {
        super('/api');
        this.chamCongController = chamCongController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.chamCongController;
        this.router.get('/chamcong', requireAdmin(), c.layBang);
        this.router.post('/chamcong/tu-dong', requireAdmin(), c.chamCongTuDong);
        this.router.post('/luong/tinh-toan', requireAdmin(...ROLES.QUAN_TRI), c.tinhLuong);
        // Chỉ Giám đốc được sửa lương (service cũng kiểm tra lại CV01)
        this.router.put('/luong/cap-nhat-co-ban/:maNV', requireAdmin(ROLES.GIAM_DOC), c.capNhatLuongCoBan);
    }
}

module.exports = ChamCongRoutes;
