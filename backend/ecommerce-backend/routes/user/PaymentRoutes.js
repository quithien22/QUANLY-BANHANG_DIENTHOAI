// file: routes/PaymentRoutes.js
const BaseRoutes = require('../BaseRoutes');

class PaymentRoutes extends BaseRoutes {
    constructor(paymentController) {
        super('/api/payment');
        this.paymentController = paymentController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.paymentController;
        this.router.post('/momo', c.createMomo);
        this.router.post('/momo-ipn', c.ipn);
        this.router.post('/momo-xacnhan', c.confirm);
    }
}

module.exports = PaymentRoutes;
