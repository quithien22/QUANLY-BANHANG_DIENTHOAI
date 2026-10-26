// file: routes/CustomerRoutes.js
// Mount ở /api vì gom các đường dẫn thuộc hai nhóm: /user/... và /khachhang/...
const BaseRoutes = require('../BaseRoutes');

class CustomerRoutes extends BaseRoutes {
    constructor(customerController) {
        super('/api');
        this.customerController = customerController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.customerController;
        this.router.get('/khachhang/:maKH', c.getProfile);
        this.router.put('/user/cap-nhat-info', c.updateInfo);
        this.router.put('/user/doi-mat-khau', c.changePassword);
    }
}

module.exports = CustomerRoutes;
