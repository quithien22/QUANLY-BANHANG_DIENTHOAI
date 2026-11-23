// file: routes/CartRoutes.js
// Chỉ định tuyến: URL + method -> hàm của Controller.
const BaseRoutes = require('../BaseRoutes');
const { requireUser, requireSelf } = require('../../middlewares/auth');

class CartRoutes extends BaseRoutes {
    constructor(cartController) {
        super('/api/giohang');
        this.cartController = cartController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.cartController;
        this.router.get('/:maKH', requireUser(), requireSelf('maKH'), c.getCart);
        this.router.post('/them', requireUser(), c.addToCart);
        this.router.put('/capnhat-soluong/:maGioHang', requireUser(), c.updateQuantity);
        this.router.delete('/:maGioHang', requireUser(), c.removeItem);
    }
}

module.exports = CartRoutes;
