// file: routes/admin/CaiDatRoutes.js
// GET /api/caidat/banner thuộc ContentRoutes (user); các route banner của admin nằm ở BannerRoutes.
const BaseRoutes = require('../BaseRoutes');

class CaiDatRoutes extends BaseRoutes {
    constructor(caiDatController) {
        super('/api/caidat');
        this.caiDatController = caiDatController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.caiDatController;
        this.router.get('/', c.layTatCa);
        this.router.put('/hoso', c.capNhatHoSo);
        this.router.put('/matkhau', c.doiMatKhau);
        this.router.put('/cuahang', c.capNhatCuaHang);
        this.router.put('/vanchuyen', c.capNhatVanChuyen);
    }
}

module.exports = CaiDatRoutes;
