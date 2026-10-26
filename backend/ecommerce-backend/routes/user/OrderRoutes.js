// file: routes/OrderRoutes.js
const BaseRoutes = require('../BaseRoutes');

class OrderRoutes extends BaseRoutes {
    constructor(orderController) {
        super('/api/hoadon');
        this.orderController = orderController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.orderController;
        this.router.post('/dat-hang', c.placeOrder);
        this.router.put('/huy-don/:maHoaDon', c.cancelOrder);
        this.router.get('/khachhang/:maKH', c.getOrders);
        this.router.get('/lich-su/:maKH', c.getHistory);
        this.router.get('/chi-tiet/:maHoaDon', c.getItems);
    }
}

module.exports = OrderRoutes;
