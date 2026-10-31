// file: admin/admin-react/src/API/BannerApi.js
// Banner quảng cáo (admin).
import BaseApi from "./BaseApi";

class BannerApi extends BaseApi {
    // GET /api/caidat/banner (route dùng chung với trang user)
    async layDanhSach() {
        const response = await this.client.get("/api/caidat/banner");
        return response.data;
    }

    // POST /api/caidat/banner   duLieuForm: FormData (hinhAnh hoặc hinhAnhLink, tenBanner, viTri, thuTu...)
    async them(duLieuForm) {
        const response = await this.client.post("/api/caidat/banner", duLieuForm, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    }

    // PUT /api/caidat/banner/trangthai/:maBanner  body: { trangThai }
    async doiTrangThai(maBanner, trangThai) {
        const response = await this.client.put(`/api/caidat/banner/trangthai/${maBanner}`, { trangThai });
        return response.data;
    }

    // DELETE /api/caidat/banner/:maBanner
    async xoa(maBanner) {
        const response = await this.client.delete(`/api/caidat/banner/${maBanner}`);
        return response.data;
    }
}

export default BannerApi;
export const bannerApi = new BannerApi();
