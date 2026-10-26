// file: routes/CartRoutes.js
// Chỉ định tuyến: URL + method -> hàm của Controller.
const BaseRoutes = require('../BaseRoutes');

class CartRoutes extends BaseRoutes {
    constructor(cartController) {
        super('/api/giohang');
        this.cartController = cartController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.cartController;
        this.router.get('/:maKH', c.getCart);
        this.router.post('/them', c.addToCart);
        this.router.put('/capnhat-soluong/:maGioHang', c.updateQuantity);
        this.router.delete('/:maGioHang', c.removeItem);
    }
}

module.exports = CartRoutes;
