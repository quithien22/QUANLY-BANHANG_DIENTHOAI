// file: admin/admin-react/src/API/HoaDonApi.js
// Hóa đơn / đơn hàng (admin).
import BaseApi from "./BaseApi";

class HoaDonApi extends BaseApi {
    // GET /api/hoadon -> danh sách gọn
    async layDanhSach() {
        const response = await this.client.get("/api/hoadon");
        return response.data;
    }

    // GET /api/hoadon/toanbo -> danh sách đầy đủ cho trang quản lý đơn hàng
    async layToanBo() {
        const response = await this.client.get("/api/hoadon/toanbo");
        return response.data;
    }

    // PUT /api/hoadon/capnhat-trangthai/:maHoaDon  body: { trangThai }
    async capNhatTrangThai(maHoaDon, trangThai) {
        const response = await this.client.put(`/api/hoadon/capnhat-trangthai/${maHoaDon}`, { trangThai });
        return response.data;
    }
}

export default HoaDonApi;
export const hoaDonApi = new HoaDonApi();
