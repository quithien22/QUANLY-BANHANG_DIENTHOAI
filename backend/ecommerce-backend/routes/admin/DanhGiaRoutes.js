// file: routes/admin/DanhGiaRoutes.js
const BaseRoutes = require('../BaseRoutes');

class DanhGiaRoutes extends BaseRoutes {
    constructor(danhGiaController) {
        super('/api/admin');
        this.danhGiaController = danhGiaController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.danhGiaController;
        this.router.get('/danhgiasanpham', c.layDanhSach);
        this.router.post('/danhgia/phanhoi', c.guiPhanHoi);
        this.router.delete('/danhgia/xoa/:maDanhGia', c.xoa);
    }
}

module.exports = DanhGiaRoutes;
