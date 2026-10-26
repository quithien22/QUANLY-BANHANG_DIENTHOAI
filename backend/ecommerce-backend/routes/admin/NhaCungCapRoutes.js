// file: routes/admin/NhaCungCapRoutes.js
const BaseRoutes = require('../BaseRoutes');

class NhaCungCapRoutes extends BaseRoutes {
    constructor(nhaCungCapController) {
        super('/api/nhacungcap');
        this.nhaCungCapController = nhaCungCapController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.nhaCungCapController;
        this.router.get('/', c.layDanhSach);
        this.router.post('/them', c.them);
        this.router.put('/sua/:maNCC', c.sua);
    }
}

module.exports = NhaCungCapRoutes;
