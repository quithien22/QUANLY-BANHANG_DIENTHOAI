// file: routes/PromotionRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser } = require('../../middlewares/auth');

class PromotionRoutes extends BaseRoutes {
    constructor(promotionController) {
        super('/api');
        this.promotionController = promotionController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.promotionController;
        this.router.get('/user/khuyenmai', c.getFlashSale);
        // Mã giảm giá chỉ dùng ở giỏ hàng / thanh toán (phải đăng nhập) -> chặn người lạ dò mã
        this.router.post('/khuyenmai/ap-dung', requireUser(), c.applyCoupon);
    }
}

module.exports = PromotionRoutes;
