// file: routes/admin/KhachHangRoutes.js
// Chỉ định tuyến: URL + method -> hàm của Controller.
// (GET /api/khachhang/:maKH của user nằm ở CustomerRoutes, không trùng với hai route dưới đây)
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class KhachHangRoutes extends BaseRoutes {
    constructor(khachHangController) {
        super('/api/khachhang');
        this.khachHangController = khachHangController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.khachHangController;
        this.router.get('/', requireAdmin(), c.layDanhSach);
        this.router.put('/sua/:maKH', requireAdmin(), c.suaThongTin);
    }
}

module.exports = KhachHangRoutes;
