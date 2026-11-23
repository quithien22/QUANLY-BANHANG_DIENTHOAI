// file: routes/PaymentRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser } = require('../../middlewares/auth');

class PaymentRoutes extends BaseRoutes {
    constructor(paymentController) {
        super('/api/payment');
        this.paymentController = paymentController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.paymentController;
        // Tạo giao dịch: phải đăng nhập và chỉ thanh toán được đơn của chính mình
        this.router.post('/momo', requireUser(), c.createMomo);
        // IPN và xác nhận kết quả do MoMo / trang kết quả gọi, đã được bảo vệ bằng chữ ký HMAC của MoMo -> KHÔNG gắn JWT
        this.router.post('/momo-ipn', c.ipn);
        this.router.post('/momo-xacnhan', c.confirm);
    }
}

module.exports = PaymentRoutes;
