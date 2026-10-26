// file: controllers/PromotionController.js
const BaseController = require('../BaseController');

class PromotionController extends BaseController {
    constructor(promotionService) {
        super();
        this.promotionService = promotionService;
    }

    // GET /api/user/khuyenmai
    getFlashSale = this.handle(async (req, res) => {
        res.json(await this.promotionService.getTodayFlashSale());
    }, "Lỗi API Flash Sale", { plainText: true, serverMessage: (err) => "Lỗi server: " + err.message });

    // POST /api/khuyenmai/ap-dung
    applyCoupon = this.handle(async (req, res) => {
        const khuyenMai = await this.promotionService.applyCoupon(req.body.maNhap);
        res.status(200).json({ success: true, khuyenMai });
    }, "Lỗi áp dụng mã giảm giá");
}

module.exports = PromotionController;
