// file: routes/admin/KhuyenMaiRoutes.js
// Mount ở /api. Không đụng route user (/user/khuyenmai, POST /khuyenmai/ap-dung).
// Lưu ý: POST /api/admin/khuyenmai/them mà trang khuyenmai_admin.js đang gọi chưa từng có ở backend.
const BaseRoutes = require('../BaseRoutes');

class KhuyenMaiRoutes extends BaseRoutes {
    constructor(khuyenMaiController) {
        super('/api');
        this.khuyenMaiController = khuyenMaiController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.khuyenMaiController;
        this.router.get('/khuyenmai', c.layDanhSach);
        this.router.get('/sanphamflashsale', c.layFlashSale);
        this.router.post('/admin/flashsale/taokhunggio', c.taoKhungGio);
        this.router.post('/admin/flashsale/themsanpham', c.themSanPhamFlashSale);
    }
}

module.exports = KhuyenMaiRoutes;
