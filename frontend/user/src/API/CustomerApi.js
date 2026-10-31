// file: src/API/CustomerApi.js
// Hồ sơ khách hàng: xem, cập nhật thông tin, đổi mật khẩu.
import BaseApi from "./BaseApi";

class CustomerApi extends BaseApi {
    // GET /api/khachhang/:maKH -> { success, data }
    async getProfile(maKH) {
        const response = await this.client.get(`/api/khachhang/${maKH}`);
        return response.data;
    }

    // PUT /api/user/cap-nhat-info   payload: { maKH, hoTen, gioiTinh, ngaySinh, diaChi, sdt, email }
    async updateInfo(payload) {
        const response = await this.client.put("/api/user/cap-nhat-info", payload);
        return response.data;
    }

    // PUT /api/user/doi-mat-khau   payload: { maKH, matKhauCu, matKhauMoi }
    async changePassword(payload) {
        const response = await this.client.put("/api/user/doi-mat-khau", payload);
        return response.data;
    }
}

export default CustomerApi;
export const customerApi = new CustomerApi();
