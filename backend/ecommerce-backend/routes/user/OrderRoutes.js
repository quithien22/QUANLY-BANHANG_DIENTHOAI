// file: routes/OrderRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser, requireSelf } = require('../../middlewares/auth');

class OrderRoutes extends BaseRoutes {
    constructor(orderController) {
        super('/api/hoadon');
        this.orderController = orderController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.orderController;
        this.router.post('/dat-hang', requireUser(), c.placeOrder);
        this.router.put('/huy-don/:maHoaDon', requireUser(), c.cancelOrder);
        this.router.get('/khachhang/:maKH', requireUser(), requireSelf('maKH'), c.getOrders);
        this.router.get('/lich-su/:maKH', requireUser(), requireSelf('maKH'), c.getHistory);
        this.router.get('/chi-tiet/:maHoaDon', requireUser(), c.getItems);
    }
}

module.exports = OrderRoutes;
