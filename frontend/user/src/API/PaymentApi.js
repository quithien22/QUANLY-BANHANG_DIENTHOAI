// file: src/API/PaymentApi.js
// Thanh toán MoMo.
import BaseApi from "./BaseApi";

class PaymentApi extends BaseApi {
    // POST /api/payment/momo -> { payUrl, ... }
    // payload: { amount, orderId }
    async createMomo(payload) {
        const response = await this.client.post("/api/payment/momo", payload);
        return response.data;
    }

    // POST /api/payment/momo-xacnhan -> { success, thanhCong, maHoaDon, message }
    // params: các tham số MoMo trả về trên URL của trang kết quả
    async confirmMomo(params) {
        const response = await this.client.post("/api/payment/momo-xacnhan", params);
        return response.data;
    }
}

export default PaymentApi;
export const paymentApi = new PaymentApi();
