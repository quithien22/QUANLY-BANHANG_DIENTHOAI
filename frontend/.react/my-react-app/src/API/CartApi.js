// file: src/API/CartApi.js
// Quản lý toàn bộ lời gọi API giỏ hàng. Component không cần biết URL.
import BaseApi from "./BaseApi";

class CartApi extends BaseApi {
    // GET /api/giohang/:maKH
    async getCart(maKH) {
        const response = await this.client.get(`/api/giohang/${maKH}`);
        return response.data;
    }

    // POST /api/giohang/them
    // payload: { maKH, maSP, maBienThe, tenPhanLoai, giaTaiThoiDiemThem, soLuong }
    async addToCart(payload) {
        const response = await this.client.post("/api/giohang/them", payload);
        return response.data;
    }

    // PUT /api/giohang/capnhat-soluong/:maGioHang (soLuong <= 0 thì backend tự xóa dòng)
    async updateQuantity(maGioHang, soLuong) {
        const response = await this.client.put(`/api/giohang/capnhat-soluong/${maGioHang}`, { soLuong });
        return response.data;
    }

    // DELETE /api/giohang/:maGioHang
    async removeItem(maGioHang) {
        const response = await this.client.delete(`/api/giohang/${maGioHang}`);
        return response.data;
    }
}

export default CartApi;
export const cartApi = new CartApi();
