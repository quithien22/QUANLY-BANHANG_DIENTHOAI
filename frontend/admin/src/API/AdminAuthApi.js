// file: admin/admin-react/src/API/AdminAuthApi.js
// Đăng nhập nhân viên / quản trị.
import BaseApi from "./BaseApi";

class AdminAuthApi extends BaseApi {
    // POST /api/admin/dang-nhap
    //   body    : { taiKhoan, matKhau }  (taiKhoan = SĐT | email | mã nhân viên)
    //   trả về  : { success, adminInfo: { maNV, hoTen, maCV, trangThai } }
    async login(taiKhoan, matKhau) {
        const response = await this.client.post("/api/admin/dang-nhap", { taiKhoan, matKhau });
        return response.data;
    }
}

export default AdminAuthApi;
export const adminAuthApi = new AdminAuthApi();
