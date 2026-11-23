// file: routes/admin/DoiTraHangRoutes.js
// Phía user dùng /api/user/doitrahang (ReturnRoutes) nên không trùng.
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class DoiTraHangRoutes extends BaseRoutes {
    constructor(doiTraHangController) {
        super('/api/doitrahang');
        this.doiTraHangController = doiTraHangController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.doiTraHangController;
        this.router.get('/', requireAdmin(), c.layDanhSach);
        this.router.get('/:maDoiTra/chitiet', requireAdmin(), c.layChiTiet);
        this.router.put('/xuly/:maDoiTra', requireAdmin(), c.xuLy);
    }
}

module.exports = DoiTraHangRoutes;
