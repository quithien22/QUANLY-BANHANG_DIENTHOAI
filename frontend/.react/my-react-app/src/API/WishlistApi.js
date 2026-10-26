// file: src/API/WishlistApi.js
// Sản phẩm yêu thích (thả tim).
import BaseApi from "./BaseApi";

class WishlistApi extends BaseApi {
    // GET /api/yeuthich/:maKH -> mảng sản phẩm yêu thích
    async list(maKH) {
        const response = await this.client.get(`/api/yeuthich/${maKH}`);
        return response.data;
    }

    // POST /api/yeuthich/toggle -> { success, action: 'added' | 'removed' }
    async toggle(maKH, maSP) {
        const response = await this.client.post("/api/yeuthich/toggle", { maKH, maSP });
        return response.data;
    }
}

export default WishlistApi;
export const wishlistApi = new WishlistApi();
