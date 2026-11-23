// file: controllers/PaymentController.js
// Giữ đúng định dạng phản hồi của các route MoMo cũ (không dùng handle() vì khác định dạng lỗi).
class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }

    // POST /api/payment/momo  -> tạo giao dịch, trả payUrl cho frontend chuyển hướng
    // (số tiền do server lấy từ DB theo orderId, field amount frontend gửi lên chỉ để tương thích)
    createMomo = async (req, res) => {
        const { amount, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Thieu orderId' });
        }
        if (!this.paymentService.isConfigured()) {
            return res.status(500).json({ message: 'Chua cau hinh MoMo trong file .env' });
        }

        try {
            // req.auth.maKH: chỉ cho thanh toán đơn của chính khách đang đăng nhập
            const data = await this.paymentService.createMomoPayment(amount, orderId, req.auth.maKH);
            res.status(200).json(data);
        } catch (error) {
            // HttpError (404 khong thay don, 400 da thanh toan) giu dung ma; loi khac -> 500
            res.status(error.status || 500).json({ message: error.message, error: error.message });
        }
    };

    // POST /api/payment/momo-ipn  -> MoMo gọi ngầm về server
    ipn = async (req, res) => {
        try {
            const kq = await this.paymentService.processResult(req.body);
            if (!kq.hopLe) console.warn('MoMo IPN khong hop le:', kq.message);
            res.status(204).end();
        } catch (err) {
            console.error('Loi xu ly MoMo IPN:', err);
            res.status(500).end();
        }
    };

    // POST /api/payment/momo-xacnhan  -> trang kết quả của frontend gửi tham số MoMo lên để xác nhận
    confirm = async (req, res) => {
        try {
            const kq = await this.paymentService.processResult(req.body);
            if (!kq.hopLe) return res.status(400).json({ success: false, message: kq.message });
            res.json({ success: true, thanhCong: kq.thanhCong, maHoaDon: kq.maHoaDon, message: kq.message });
        } catch (err) {
            console.error('Loi xac nhan MoMo:', err);
            res.status(500).json({ success: false, message: 'Loi server: ' + err.message });
        }
    };
}

module.exports = PaymentController;
