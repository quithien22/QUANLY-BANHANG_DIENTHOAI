// file: src/API/PromotionApi.js
// Flash sale hôm nay + mã giảm giá.
import BaseApi from "./BaseApi";

class PromotionApi extends BaseApi {
    // GET /api/user/khuyenmai  (sản phẩm flash sale của ngày hôm nay)
    async getFlashSale() {
        const response = await this.client.get("/api/user/khuyenmai");
        return response.data;
    }

    // POST /api/khuyenmai/ap-dung
    async applyCoupon(maNhap) {
        const response = await this.client.post("/api/khuyenmai/ap-dung", { maNhap });
        return response.data;
    }
}

export default PromotionApi;
export const promotionApi = new PromotionApi();
