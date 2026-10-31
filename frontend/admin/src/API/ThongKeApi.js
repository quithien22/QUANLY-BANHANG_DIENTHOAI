// file: admin/admin-react/src/API/ThongKeApi.js
// Báo cáo & thống kê (admin).
import BaseApi from "./BaseApi";

class ThongKeApi extends BaseApi {
    // GET /api/thongke/tongquan?khoang=
    async layTongQuan(khoang) {
        const response = await this.client.get("/api/thongke/tongquan", { params: { khoang } });
        return response.data;
    }

    // GET /api/thongke/doanhthu?khoang=&theo=
    async layDoanhThu(khoang, theo) {
        const response = await this.client.get("/api/thongke/doanhthu", { params: { khoang, theo } });
        return response.data;
    }

    // GET /api/thongke/top-san-pham?khoang=
    async layTopSanPham(khoang) {
        const response = await this.client.get("/api/thongke/top-san-pham", { params: { khoang } });
        return response.data;
    }

    // GET /api/thongke/khuyenmai?khoang=
    async layHieuQuaKhuyenMai(khoang) {
        const response = await this.client.get("/api/thongke/khuyenmai", { params: { khoang } });
        return response.data;
    }

    // GET /api/thongke/ton-kho-canh-bao
    async layTonKhoCanhBao() {
        const response = await this.client.get("/api/thongke/ton-kho-canh-bao");
        return response.data;
    }
}

export default ThongKeApi;
export const thongKeApi = new ThongKeApi();
