// file: routes/admin/PhieuNhapRoutes.js
const BaseRoutes = require('../BaseRoutes');

class PhieuNhapRoutes extends BaseRoutes {
    constructor(phieuNhapController) {
        super('/api/phieunhap_nhacungcap');
        this.phieuNhapController = phieuNhapController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.phieuNhapController;
        this.router.get('/', c.layDanhSach);
        this.router.get('/:maPN/chitiet', c.layChiTiet);
        this.router.post('/them', c.tao);
    }
}

module.exports = PhieuNhapRoutes;
