// file: routes/admin/VanChuyenRoutes.js
const BaseRoutes = require('../BaseRoutes');

class VanChuyenRoutes extends BaseRoutes {
    constructor(vanChuyenController) {
        super('/api/vanchuyen');
        this.vanChuyenController = vanChuyenController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.vanChuyenController;
        this.router.get('/', c.layDanhSach);
        this.router.put('/:maVanChuyen', c.capNhat);
    }
}

module.exports = VanChuyenRoutes;
