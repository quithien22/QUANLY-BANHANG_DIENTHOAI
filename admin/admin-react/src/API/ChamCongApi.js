// file: admin/admin-react/src/API/ChamCongApi.js
// Chấm công và lương nhân viên.
import BaseApi from "./BaseApi";

class ChamCongApi extends BaseApi {
    // POST /api/chamcong/tu-dong   body: { maNV } -> { success, message }
    // Chỉ chèn 1 bản ghi chấm công cho hôm nay nếu nhân viên chưa được chấm công.
    async chamCongTuDong(maNV) {
        const response = await this.client.post("/api/chamcong/tu-dong", { maNV });
        return response.data;
    }

    // GET /api/chamcong?thang=&nam=  -> mảng dòng chấm công + lương theo tháng
    async layBang(thang, nam) {
        const response = await this.client.get("/api/chamcong", { params: { thang, nam } });
        return response.data;
    }

    // POST /api/luong/tinh-toan  body: { thang, nam }
    async tinhLuong(thang, nam) {
        const response = await this.client.post("/api/luong/tinh-toan", { thang, nam });
        return response.data;
    }

    // PUT /api/luong/cap-nhat-co-ban/:maNV  body: { luongCoBanMoi, luongThuongMoi, maCVNguoiThaoTac }
    async capNhatLuongCoBan(maNV, duLieu) {
        const response = await this.client.put(`/api/luong/cap-nhat-co-ban/${maNV}`, duLieu);
        return response.data;
    }
}

export default ChamCongApi;
export const chamCongApi = new ChamCongApi();
