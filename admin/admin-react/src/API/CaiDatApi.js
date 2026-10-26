// file: admin/admin-react/src/API/CaiDatApi.js
// Cài đặt hệ thống (admin): hồ sơ, mật khẩu, cửa hàng, vận chuyển.
import BaseApi from "./BaseApi";

class CaiDatApi extends BaseApi {
    // GET /api/caidat?maNV=  -> { hoSo, cuaHang, vanChuyen }
    async layTatCa(maNV) {
        const response = await this.client.get("/api/caidat", { params: { maNV } });
        return response.data;
    }

    // PUT /api/caidat/hoso  body: { maNV, hoTen, soDienThoai, email, anhDaiDien }
    async capNhatHoSo(duLieu) {
        const response = await this.client.put("/api/caidat/hoso", duLieu);
        return response.data;
    }

    // PUT /api/caidat/matkhau  body: { maNV, hienTai, moi }
    async doiMatKhau(duLieu) {
        const response = await this.client.put("/api/caidat/matkhau", duLieu);
        return response.data;
    }

    // PUT /api/caidat/cuahang  body: { tenCuaHang, diaChi, hotline, moTa }
    async capNhatCuaHang(duLieu) {
        const response = await this.client.put("/api/caidat/cuahang", duLieu);
        return response.data;
    }

    // PUT /api/caidat/vanchuyen  body: { phiMacDinh, nguongMienPhi, donViHoTro }
    async capNhatVanChuyen(duLieu) {
        const response = await this.client.put("/api/caidat/vanchuyen", duLieu);
        return response.data;
    }
}

export default CaiDatApi;
export const caiDatApi = new CaiDatApi();
