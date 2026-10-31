// file: admin/admin-react/src/API/ThuongHieuApi.js
// Thương hiệu = danh mục sản phẩm (admin).
import BaseApi from "./BaseApi";

class ThuongHieuApi extends BaseApi {
    // GET /api/thuonghieu
    async layDanhSach() {
        const response = await this.client.get("/api/thuonghieu");
        return response.data;
    }

    // PUT /api/admin/thuonghieu/trangthai/:maThuongHieu  body: { trangThai }
    async doiTrangThai(maThuongHieu, trangThai) {
        const response = await this.client.put(`/api/admin/thuonghieu/trangthai/${maThuongHieu}`, { trangThai });
        return response.data;
    }

    // POST /api/admin/thuonghieu/them  body: { tenThuongHieu, hinhAnh }
    async them(duLieu) {
        const response = await this.client.post("/api/admin/thuonghieu/them", duLieu);
        return response.data;
    }

    // PUT /api/admin/thuonghieu/sua/:maThuongHieu  body: { tenThuongHieu, hinhAnh }
    async sua(maThuongHieu, duLieu) {
        const response = await this.client.put(`/api/admin/thuonghieu/sua/${maThuongHieu}`, duLieu);
        return response.data;
    }

    // DELETE /api/admin/thuonghieu/xoa/:maThuongHieu
    async xoa(maThuongHieu) {
        const response = await this.client.delete(`/api/admin/thuonghieu/xoa/${maThuongHieu}`);
        return response.data;
    }
}

export default ThuongHieuApi;
export const thuongHieuApi = new ThuongHieuApi();
