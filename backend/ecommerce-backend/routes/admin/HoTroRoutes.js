// file: routes/admin/HoTroRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class HoTroRoutes extends BaseRoutes {
    constructor(hoTroController) {
        super('/api/admin/faq');
        this.hoTroController = hoTroController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.hoTroController;
        this.router.post('/danhmuc', requireAdmin(), c.themDanhMuc);
        this.router.post('/cauhoi', requireAdmin(), c.themCauHoi);
        this.router.delete('/cauhoi/:id', requireAdmin(), c.xoaCauHoi);
    }
}

module.exports = HoTroRoutes;
