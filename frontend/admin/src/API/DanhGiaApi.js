// file: admin/admin-react/src/API/DanhGiaApi.js
// Đánh giá sản phẩm (admin): xem, phản hồi, xóa.
import BaseApi from "./BaseApi";

class DanhGiaApi extends BaseApi {
    // GET /api/admin/danhgiasanpham -> đánh giá kèm shopReply và danhSachAnh
    async layDanhSach() {
        const response = await this.client.get("/api/admin/danhgiasanpham");
        return response.data;
    }

    // POST /api/admin/danhgia/phanhoi  body: { maDanhGia, maNV, noiDung }
    async guiPhanHoi(duLieu) {
        const response = await this.client.post("/api/admin/danhgia/phanhoi", duLieu);
        return response.data;
    }

    // DELETE /api/admin/danhgia/xoa/:maDanhGia
    async xoa(maDanhGia) {
        const response = await this.client.delete(`/api/admin/danhgia/xoa/${maDanhGia}`);
        return response.data;
    }
}

export default DanhGiaApi;
export const danhGiaApi = new DanhGiaApi();
