// file: admin/admin-react/src/API/KhachHangApi.js
// Quản lý khách hàng (admin).
import BaseApi from "./BaseApi";

class KhachHangApi extends BaseApi {
    // GET /api/khachhang -> mảng khách hàng kèm tongDonHang
    async layDanhSach() {
        const response = await this.client.get("/api/khachhang");
        return response.data;
    }

    // PUT /api/khachhang/sua/:maKH  body: { hoTen, SDT, trangThai } -> { success, message }
    async suaThongTin(maKH, duLieu) {
        const response = await this.client.put(`/api/khachhang/sua/${maKH}`, duLieu);
        return response.data;
    }
}

export default KhachHangApi;
export const khachHangApi = new KhachHangApi();
