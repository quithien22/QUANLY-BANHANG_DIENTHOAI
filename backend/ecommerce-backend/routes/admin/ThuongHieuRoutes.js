// file: routes/admin/ThuongHieuRoutes.js
const BaseRoutes = require('../BaseRoutes');

class ThuongHieuRoutes extends BaseRoutes {
    constructor(thuongHieuController) {
        super('/api');
        this.thuongHieuController = thuongHieuController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.thuongHieuController;
        this.router.get('/thuonghieu', c.layDanhSach);
        this.router.put('/admin/thuonghieu/trangthai/:maThuongHieu', c.doiTrangThai);
        this.router.post('/admin/thuonghieu/them', c.them);
        this.router.put('/admin/thuonghieu/sua/:maThuongHieu', c.sua);
        this.router.delete('/admin/thuonghieu/xoa/:maThuongHieu', c.xoa);
    }
}

module.exports = ThuongHieuRoutes;
