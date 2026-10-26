// file: routes/AuthRoutes.js
const BaseRoutes = require('../BaseRoutes');

class AuthRoutes extends BaseRoutes {
    constructor(authController) {
        super('/api/user');
        this.authController = authController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.authController;
        this.router.post('/dang-nhap', c.login);
        this.router.post('/dang-ky', c.register);
        this.router.post('/dang-nhap-google', c.loginGoogle);
    }
}

module.exports = AuthRoutes;
