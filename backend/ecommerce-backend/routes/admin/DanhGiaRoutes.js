// file: routes/admin/DanhGiaRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class DanhGiaRoutes extends BaseRoutes {
    constructor(danhGiaController) {
        super('/api/admin');
        this.danhGiaController = danhGiaController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.danhGiaController;
        this.router.get('/danhgiasanpham', requireAdmin(), c.layDanhSach);
        this.router.post('/danhgia/phanhoi', requireAdmin(), c.guiPhanHoi);
        this.router.delete('/danhgia/xoa/:maDanhGia', requireAdmin(), c.xoa);
    }
}

module.exports = DanhGiaRoutes;
