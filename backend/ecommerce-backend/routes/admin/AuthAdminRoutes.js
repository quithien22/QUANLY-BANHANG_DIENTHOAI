// file: routes/admin/AuthAdminRoutes.js
// Chỉ định tuyến: URL + method -> hàm của Controller.
const BaseRoutes = require('../BaseRoutes');

class AuthAdminRoutes extends BaseRoutes {
    constructor(authAdminController) {
        super('/api/admin');
        this.authAdminController = authAdminController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.authAdminController;
        this.router.post('/dang-nhap', c.login);
    }
}

module.exports = AuthAdminRoutes;
