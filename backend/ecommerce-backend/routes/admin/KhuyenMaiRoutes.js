// file: routes/admin/KhuyenMaiRoutes.js
// Mount ở /api. Không đụng route user (/user/khuyenmai, POST /khuyenmai/ap-dung).
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
        this.router.post('/admin/khuyenmai/them', c.taoKhuyenMai);
        this.router.put('/admin/khuyenmai/:maKM/trangthai', c.capNhatTrangThai);
        this.router.post('/admin/flashsale/taokhunggio', c.taoKhungGio);
        this.router.put('/admin/flashsale/khunggio/:maKhungGio', c.capNhatKhungGio);
        this.router.delete('/admin/flashsale/khunggio/:maKhungGio', c.xoaKhungGio);
        this.router.delete('/admin/flashsale/khunggio/:maKhungGio/sanpham/:maSP', c.xoaSanPhamFlashSale);
        this.router.post('/admin/flashsale/themsanpham', c.themSanPhamFlashSale);
    }
}

module.exports = KhuyenMaiRoutes;
