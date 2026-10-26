// file: admin/admin-react/src/API/DoiTraHangApi.js
// Yêu cầu đổi trả hàng (admin).
import BaseApi from "./BaseApi";

class DoiTraHangApi extends BaseApi {
    // GET /api/doitrahang
    async layDanhSach() {
        const response = await this.client.get("/api/doitrahang");
        return response.data;
    }

    // GET /api/doitrahang/:maDoiTra/chitiet
    async layChiTiet(maDoiTra) {
        const response = await this.client.get(`/api/doitrahang/${maDoiTra}/chitiet`);
        return response.data;
    }

    // PUT /api/doitrahang/xuly/:maDoiTra  body: { trangThai, hinhThucGiaiQuyet, ghiChuNoiBo, maNV }
    async xuLy(maDoiTra, duLieu) {
        const response = await this.client.put(`/api/doitrahang/xuly/${maDoiTra}`, duLieu);
        return response.data;
    }
}

export default DoiTraHangApi;
export const doiTraHangApi = new DoiTraHangApi();
