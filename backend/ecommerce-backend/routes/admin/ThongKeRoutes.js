// file: routes/admin/ThongKeRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class ThongKeRoutes extends BaseRoutes {
    constructor(thongKeController) {
        super('/api/thongke');
        this.thongKeController = thongKeController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.thongKeController;
        this.router.get('/tongquan', requireAdmin(), c.layTongQuan);
        this.router.get('/doanhthu', requireAdmin(), c.layDoanhThu);
        this.router.get('/top-san-pham', requireAdmin(), c.layTopSanPham);
        this.router.get('/khuyenmai', requireAdmin(), c.layHieuQuaKhuyenMai);
        this.router.get('/ton-kho-canh-bao', requireAdmin(), c.layTonKhoCanhBao);
    }
}

module.exports = ThongKeRoutes;
