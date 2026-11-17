// file: admin/admin-react/src/API/KhuyenMaiApi.js
// Khuyến mãi và Flash Sale (admin).
import BaseApi from "./BaseApi";

class KhuyenMaiApi extends BaseApi {
    // GET /api/khuyenmai
    async layDanhSach() {
        const response = await this.client.get("/api/khuyenmai");
        return response.data;
    }

    // POST /api/admin/khuyenmai/them  body: { tenKM, phanTram, dieuKien, ngayBD, ngayKT }
    async taoKhuyenMai(duLieu) {
        const response = await this.client.post("/api/admin/khuyenmai/them", duLieu);
        return response.data;
    }

    // GET /api/sanphamflashsale -> các khung giờ kèm sản phẩm
    async layFlashSale() {
        const response = await this.client.get("/api/sanphamflashsale");
        return response.data;
    }

    // POST /api/admin/flashsale/taokhunggio  body: { ngayApDung, gioBD, gioKT }
    async taoKhungGio(duLieu) {
        const response = await this.client.post("/api/admin/flashsale/taokhunggio", duLieu);
        return response.data;
    }

    // POST /api/admin/flashsale/themsanpham  body: { maFS, maSP, giaFlashSale, soLuongGioiHan }
    async themSanPhamFlashSale(duLieu) {
        const response = await this.client.post("/api/admin/flashsale/themsanpham", duLieu);
        return response.data;
    }
}

export default KhuyenMaiApi;
export const khuyenMaiApi = new KhuyenMaiApi();
