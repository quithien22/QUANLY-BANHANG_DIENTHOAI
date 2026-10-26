// file: src/API/ContentApi.js
// Nội dung hiển thị: banner quảng cáo, câu hỏi thường gặp (FAQ).
import BaseApi from "./BaseApi";

class ContentApi extends BaseApi {
    // GET /api/caidat/banner
    async getBanners() {
        const response = await this.client.get("/api/caidat/banner");
        return response.data;
    }

    // GET /api/faq
    async getFaq() {
        const response = await this.client.get("/api/faq");
        return response.data;
    }
}

export default ContentApi;
export const contentApi = new ContentApi();
