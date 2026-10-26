// file: routes/PromotionRoutes.js
const BaseRoutes = require('../BaseRoutes');

class PromotionRoutes extends BaseRoutes {
    constructor(promotionController) {
        super('/api');
        this.promotionController = promotionController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.promotionController;
        this.router.get('/user/khuyenmai', c.getFlashSale);
        this.router.post('/khuyenmai/ap-dung', c.applyCoupon);
    }
}

module.exports = PromotionRoutes;
