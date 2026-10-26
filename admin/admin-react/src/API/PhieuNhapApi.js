// file: admin/admin-react/src/API/PhieuNhapApi.js
// Phiếu nhập hàng (admin).
import BaseApi from "./BaseApi";

class PhieuNhapApi extends BaseApi {
    // GET /api/phieunhap_nhacungcap -> phiếu nhập kèm thông tin NCC
    async layDanhSach() {
        const response = await this.client.get("/api/phieunhap_nhacungcap");
        return response.data;
    }

    // GET /api/phieunhap_nhacungcap/:maPN/chitiet
    async layChiTiet(maPN) {
        const response = await this.client.get(`/api/phieunhap_nhacungcap/${maPN}/chitiet`);
        return response.data;
    }

    // POST /api/phieunhap_nhacungcap/them  body: { maNCC, maNV, danhSachSanPham: [{ maSP, soLuong, giaNhap, hanSuDung }] }
    async tao(duLieu) {
        const response = await this.client.post("/api/phieunhap_nhacungcap/them", duLieu);
        return response.data;
    }
}

export default PhieuNhapApi;
export const phieuNhapApi = new PhieuNhapApi();
