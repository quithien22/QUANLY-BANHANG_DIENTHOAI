// file: routes/admin/HoTroRoutes.js
const BaseRoutes = require('../BaseRoutes');

class HoTroRoutes extends BaseRoutes {
    constructor(hoTroController) {
        super('/api/admin/faq');
        this.hoTroController = hoTroController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.hoTroController;
        this.router.post('/danhmuc', c.themDanhMuc);
        this.router.post('/cauhoi', c.themCauHoi);
        this.router.delete('/cauhoi/:id', c.xoaCauHoi);
    }
}

module.exports = HoTroRoutes;
