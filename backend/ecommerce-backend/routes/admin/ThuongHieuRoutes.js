// file: routes/admin/ThuongHieuRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class ThuongHieuRoutes extends BaseRoutes {
    constructor(thuongHieuController) {
        super('/api');
        this.thuongHieuController = thuongHieuController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.thuongHieuController;
        // GET công khai: storefront cũng dùng để lọc theo thương hiệu
        this.router.get('/thuonghieu', c.layDanhSach);
        this.router.put('/admin/thuonghieu/trangthai/:maThuongHieu', requireAdmin(), c.doiTrangThai);
        this.router.post('/admin/thuonghieu/them', requireAdmin(), c.them);
        this.router.put('/admin/thuonghieu/sua/:maThuongHieu', requireAdmin(), c.sua);
        this.router.delete('/admin/thuonghieu/xoa/:maThuongHieu', requireAdmin(), c.xoa);
    }
}

module.exports = ThuongHieuRoutes;
