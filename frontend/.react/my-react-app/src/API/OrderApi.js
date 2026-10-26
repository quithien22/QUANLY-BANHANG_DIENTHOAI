// file: src/API/OrderApi.js
// Đặt hàng, hủy đơn, xem đơn hàng / lịch sử mua hàng.
import BaseApi from "./BaseApi";

class OrderApi extends BaseApi {
    // POST /api/hoadon/dat-hang  -> { success, message, maHoaDon, tongTien }
    async placeOrder(payload) {
        const response = await this.client.post("/api/hoadon/dat-hang", payload);
        return response.data;
    }

    // PUT /api/hoadon/huy-don/:maHoaDon  -> { success, message }
    async cancelOrder(maHoaDon) {
        const response = await this.client.put(`/api/hoadon/huy-don/${maHoaDon}`);
        return response.data;
    }

    // GET /api/hoadon/khachhang/:maKH  -> mảng đơn hàng kèm chiTietSanPham
    async getOrders(maKH) {
        const response = await this.client.get(`/api/hoadon/khachhang/${maKH}`);
        return response.data;
    }

    // GET /api/hoadon/lich-su/:maKH  -> { success, data }
    async getHistory(maKH) {
        const response = await this.client.get(`/api/hoadon/lich-su/${maKH}`);
        return response.data;
    }

    // GET /api/hoadon/chi-tiet/:maHoaDon  -> { success, data }
    async getItems(maHoaDon) {
        const response = await this.client.get(`/api/hoadon/chi-tiet/${maHoaDon}`);
        return response.data;
    }
}

export default OrderApi;
export const orderApi = new OrderApi();
