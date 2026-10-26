// file: src/API/ReviewApi.js
// Đánh giá sản phẩm.
import BaseApi from "./BaseApi";

class ReviewApi extends BaseApi {
    // GET /api/danhgia/:maSP
    async list(maSP) {
        const response = await this.client.get(`/api/danhgia/${maSP}`);
        return response.data;
    }

    // POST /api/danhgia/them   payload: { maSP, maKH, soSao, noiDung, hinhAnh? }
    async add(payload) {
        const response = await this.client.post("/api/danhgia/them", payload);
        return response.data;
    }

    // PUT /api/danhgia/sua/:maDanhGia   payload: { maKH, soSao, noiDung }
    async update(maDanhGia, payload) {
        const response = await this.client.put(`/api/danhgia/sua/${maDanhGia}`, payload);
        return response.data;
    }

    // DELETE /api/danhgia/xoa/:maDanhGia   (maKH gửi trong body để backend kiểm tra chủ đánh giá)
    async remove(maDanhGia, maKH) {
        const response = await this.client.delete(`/api/danhgia/xoa/${maDanhGia}`, { data: { maKH } });
        return response.data;
    }
}

export default ReviewApi;
export const reviewApi = new ReviewApi();
