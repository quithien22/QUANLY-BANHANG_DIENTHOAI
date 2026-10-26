// file: routes/admin/ThongKeRoutes.js
const BaseRoutes = require('../BaseRoutes');

class ThongKeRoutes extends BaseRoutes {
    constructor(thongKeController) {
        super('/api/thongke');
        this.thongKeController = thongKeController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.thongKeController;
        this.router.get('/tongquan', c.layTongQuan);
        this.router.get('/doanhthu', c.layDoanhThu);
        this.router.get('/top-san-pham', c.layTopSanPham);
        this.router.get('/khuyenmai', c.layHieuQuaKhuyenMai);
        this.router.get('/ton-kho-canh-bao', c.layTonKhoCanhBao);
    }
}

module.exports = ThongKeRoutes;
