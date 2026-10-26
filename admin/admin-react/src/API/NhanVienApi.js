// file: admin/admin-react/src/API/NhanVienApi.js
// Quản lý nhân viên (admin).
import BaseApi from "./BaseApi";

class NhanVienApi extends BaseApi {
    // GET /api/nhanvien -> mảng nhân viên kèm chức vụ và danhSachQuyen
    async layDanhSach() {
        const response = await this.client.get("/api/nhanvien");
        return response.data;
    }

    // POST /api/admin/nhanvien/them
    async them(duLieu) {
        const response = await this.client.post("/api/admin/nhanvien/them", duLieu);
        return response.data;
    }

    // PUT /api/admin/nhanvien/sua/:maNV
    async sua(maNV, duLieu) {
        const response = await this.client.put(`/api/admin/nhanvien/sua/${maNV}`, duLieu);
        return response.data;
    }

    // DELETE /api/admin/nhanvien/xoa/:maNV
    async xoa(maNV) {
        const response = await this.client.delete(`/api/admin/nhanvien/xoa/${maNV}`);
        return response.data;
    }

    // POST /api/nhanvien/tao-tai-khoan  body: { thongTinMoi, maChucVuNguoiThaoTac }
    async taoTaiKhoan(thongTinMoi, maChucVuNguoiThaoTac) {
        const response = await this.client.post("/api/nhanvien/tao-tai-khoan", { thongTinMoi, maChucVuNguoiThaoTac });
        return response.data;
    }
}

export default NhanVienApi;
export const nhanVienApi = new NhanVienApi();
