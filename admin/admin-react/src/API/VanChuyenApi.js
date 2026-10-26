// file: admin/admin-react/src/API/VanChuyenApi.js
// Vận chuyển (admin).
import BaseApi from "./BaseApi";

class VanChuyenApi extends BaseApi {
    // GET /api/vanchuyen
    async layDanhSach() {
        const response = await this.client.get("/api/vanchuyen");
        return response.data;
    }

    // PUT /api/vanchuyen/:maVanChuyen  body: { donViVanChuyen, maHoaDon, ngayGiaoDuKien, trangThai }
    async capNhat(maVanChuyen, duLieu) {
        const response = await this.client.put(`/api/vanchuyen/${maVanChuyen}`, duLieu);
        return response.data;
    }
}

export default VanChuyenApi;
export const vanChuyenApi = new VanChuyenApi();
