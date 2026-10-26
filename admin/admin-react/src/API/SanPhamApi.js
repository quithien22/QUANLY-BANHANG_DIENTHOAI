// file: admin/admin-react/src/API/SanPhamApi.js
// Sản phẩm (admin).
import BaseApi from "./BaseApi";

const CAU_HINH_FORM = { headers: { "Content-Type": "multipart/form-data" } };

class SanPhamApi extends BaseApi {
    // GET /api/sanpham
    async layDanhSach() {
        const response = await this.client.get("/api/sanpham");
        return response.data;
    }

    // POST /api/sanpham/them   duLieuForm: FormData (có thể kèm file 'anhSanPham')
    async them(duLieuForm) {
        const response = await this.client.post("/api/sanpham/them", duLieuForm, CAU_HINH_FORM);
        return response.data;
    }

    // PUT /api/sanpham/sua/:maSP   duLieuForm: FormData
    async sua(maSP, duLieuForm) {
        const response = await this.client.put(`/api/sanpham/sua/${maSP}`, duLieuForm, CAU_HINH_FORM);
        return response.data;
    }

    // DELETE /api/sanpham/:maSP
    async xoa(maSP) {
        const response = await this.client.delete(`/api/sanpham/${maSP}`);
        return response.data;
    }
}

export default SanPhamApi;
export const sanPhamApi = new SanPhamApi();
