// file: routes/admin/PhieuNhapRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class PhieuNhapRoutes extends BaseRoutes {
    constructor(phieuNhapController) {
        super('/api/phieunhap_nhacungcap');
        this.phieuNhapController = phieuNhapController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.phieuNhapController;
        this.router.get('/', requireAdmin(), c.layDanhSach);
        this.router.get('/:maPN/chitiet', requireAdmin(), c.layChiTiet);
        this.router.post('/them', requireAdmin(), c.tao);
    }
}

module.exports = PhieuNhapRoutes;
