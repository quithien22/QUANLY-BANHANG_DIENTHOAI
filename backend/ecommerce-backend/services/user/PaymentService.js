// file: services/PaymentService.js
// Thanh toán MoMo: tạo giao dịch, kiểm tra chữ ký, cập nhật trạng thái thanh toán.
const crypto = require('crypto');
const axios = require('axios');
const BaseService = require('../BaseService');

class PaymentService extends BaseService {
    constructor(db) {
        super(db);
        // Đọc .env tại thời điểm khởi tạo (sau khi server.js đã nạp dotenv)
        this.momo = {
            partnerCode: process.env.MOMO_PARTNER_CODE || '',
            accessKey: process.env.MOMO_ACCESS_KEY || '',
            secretKey: process.env.MOMO_SECRET_KEY || '',
            endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
            redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/thanh-toan-thanh-cong',
            ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:8080/api/payment/momo-ipn',
        };
    }

    isConfigured() {
        const { partnerCode, accessKey, secretKey } = this.momo;
        return !!(partnerCode && accessKey && secretKey);
    }

    // Tạo giao dịch MoMo, trả về dữ liệu MoMo (có payUrl)
    async createMomoPayment(amountRaw, maHoaDon) {
        const { partnerCode, accessKey, secretKey, redirectUrl, ipnUrl, endpoint } = this.momo;

        const amount = Math.round(Number(amountRaw)); // MoMo yêu cầu số nguyên
        const orderId = `${maHoaDon}_${Date.now()}`;   // mỗi lần tạo giao dịch phải có orderId riêng
        const requestType = "captureWallet";
        const extraData = "";
        const orderInfo = `Thanh toan don hang ${maHoaDon}`;
        const requestId = partnerCode + new Date().getTime();

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        const requestBody = {
            partnerCode, accessKey, requestId, amount, orderId, orderInfo,
            redirectUrl, ipnUrl, extraData, requestType, signature, lang: 'vi'
        };

        const result = await axios.post(endpoint, requestBody).catch((e) => {
            console.error('Loi goi MoMo:', e.response?.data || e.message);
            throw e;
        });
        return result.data;
    }

    // Kiểm tra chữ ký MoMo gửi về (redirect hoặc IPN)
    verifySignature(p) {
        const raw = `accessKey=${this.momo.accessKey}&amount=${p.amount}&extraData=${p.extraData ?? ''}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
        const expected = crypto.createHmac('sha256', this.momo.secretKey).update(raw).digest('hex');
        return expected === p.signature;
    }

    // Xử lý kết quả MoMo: kiểm tra chữ ký + số tiền, thành công thì đánh dấu đã thanh toán
    async processResult(p) {
        const sql = this.sql;

        if (!p || !p.signature || !this.momo.secretKey || !this.verifySignature(p)) {
            return { hopLe: false, message: 'Chu ky khong hop le' };
        }

        // orderId có dạng "<maHoaDon>_<timestamp>"
        const maHoaDon = String(p.orderId).split('_')[0];
        const pool = await this.getPool();

        const tt = await pool.request()
            .input('maHoaDon', sql.VarChar(20), maHoaDon)
            .query('SELECT soTien, trangThai FROM ThanhToan WHERE maHoaDon = @maHoaDon');

        if (tt.recordset.length === 0) return { hopLe: false, message: 'Khong tim thay giao dich' };
        if (Math.round(tt.recordset[0].soTien) !== Number(p.amount)) {
            return { hopLe: false, message: 'So tien khong khop' };
        }

        const thanhCong = Number(p.resultCode) === 0;
        if (thanhCong) {
            await pool.request()
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query("UPDATE ThanhToan SET trangThai = 'da_thanh_toan', thoiGian = GETDATE() WHERE maHoaDon = @maHoaDon AND trangThai = 'cho_thanh_toan'");
        }

        return { hopLe: true, thanhCong, maHoaDon, message: p.message };
    }
}

module.exports = PaymentService;
