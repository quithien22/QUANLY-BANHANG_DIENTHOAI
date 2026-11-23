// file: routes/admin/NhaCungCapRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class NhaCungCapRoutes extends BaseRoutes {
    constructor(nhaCungCapController) {
        super('/api/nhacungcap');
        this.nhaCungCapController = nhaCungCapController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.nhaCungCapController;
        this.router.get('/', requireAdmin(), c.layDanhSach);
        this.router.post('/them', requireAdmin(), c.them);
        this.router.put('/sua/:maNCC', requireAdmin(), c.sua);
    }
}

module.exports = NhaCungCapRoutes;
