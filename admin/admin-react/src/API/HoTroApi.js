// file: admin/admin-react/src/API/HoTroApi.js
// Hỗ trợ khách hàng: quản lý FAQ (admin).
import BaseApi from "./BaseApi";

class HoTroApi extends BaseApi {
    // GET /api/faq (route dùng chung với trang user) -> danh mục kèm câu hỏi
    async layFaq() {
        const response = await this.client.get("/api/faq");
        return response.data;
    }

    // POST /api/admin/faq/danhmuc  body: { tenDanhMuc, thuTu }
    async themDanhMuc(duLieu) {
        const response = await this.client.post("/api/admin/faq/danhmuc", duLieu);
        return response.data;
    }

    // POST /api/admin/faq/cauhoi  body: { maDanhMuc, cauHoi, traLoi, thuTu, linkLienQuan, anhLienQuan }
    async themCauHoi(duLieu) {
        const response = await this.client.post("/api/admin/faq/cauhoi", duLieu);
        return response.data;
    }

    // DELETE /api/admin/faq/cauhoi/:maCauHoi
    async xoaCauHoi(maCauHoi) {
        const response = await this.client.delete(`/api/admin/faq/cauhoi/${maCauHoi}`);
        return response.data;
    }
}

export default HoTroApi;
export const hoTroApi = new HoTroApi();
