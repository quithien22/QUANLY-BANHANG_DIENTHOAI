// file: admin/admin-react/src/API/NhaCungCapApi.js
// Nhà cung cấp và phiếu nhập hàng (admin).
import BaseApi from "./BaseApi";

class NhaCungCapApi extends BaseApi {
    // GET /api/nhacungcap
    async layDanhSach() {
        const response = await this.client.get("/api/nhacungcap");
        return response.data;
    }

    // POST /api/nhacungcap/them  body: { tenNCC, diaChi, SDT }
    async them(duLieu) {
        const response = await this.client.post("/api/nhacungcap/them", duLieu);
        return response.data;
    }

    // PUT /api/nhacungcap/sua/:maNCC  body: { tenNCC, diaChi, SDT, trangThai }
    async sua(maNCC, duLieu) {
        const response = await this.client.put(`/api/nhacungcap/sua/${maNCC}`, duLieu);
        return response.data;
    }
}

export default NhaCungCapApi;
export const nhaCungCapApi = new NhaCungCapApi();
