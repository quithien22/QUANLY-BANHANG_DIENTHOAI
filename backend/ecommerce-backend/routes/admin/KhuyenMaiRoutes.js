// file: routes/admin/KhuyenMaiRoutes.js
// Mount ở /api. Không đụng route user (/user/khuyenmai, POST /khuyenmai/ap-dung).
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class KhuyenMaiRoutes extends BaseRoutes {
    constructor(khuyenMaiController) {
        super('/api');
        this.khuyenMaiController = khuyenMaiController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.khuyenMaiController;
        this.router.get('/khuyenmai', requireAdmin(), c.layDanhSach);
        // Danh sách flash sale hiển thị cho cả khách -> để công khai (chỉ đọc)
        this.router.get('/sanphamflashsale', c.layFlashSale);
        this.router.post('/admin/khuyenmai/them', requireAdmin(), c.taoKhuyenMai);
        this.router.put('/admin/khuyenmai/:maKM/trangthai', requireAdmin(), c.capNhatTrangThai);
        this.router.post('/admin/flashsale/taokhunggio', requireAdmin(), c.taoKhungGio);
        this.router.put('/admin/flashsale/khunggio/:maKhungGio', requireAdmin(), c.capNhatKhungGio);
        this.router.delete('/admin/flashsale/khunggio/:maKhungGio', requireAdmin(), c.xoaKhungGio);
        this.router.delete('/admin/flashsale/khunggio/:maKhungGio/sanpham/:maSP', requireAdmin(), c.xoaSanPhamFlashSale);
        this.router.post('/admin/flashsale/themsanpham', requireAdmin(), c.themSanPhamFlashSale);
    }
}

module.exports = KhuyenMaiRoutes;
