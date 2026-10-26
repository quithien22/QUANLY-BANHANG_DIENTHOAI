// file: src/API/ReturnApi.js
// Yêu cầu đổi trả hàng của khách.
import BaseApi from "./BaseApi";

class ReturnApi extends BaseApi {
    // GET /api/user/doitrahang/:maKH -> mảng yêu cầu đổi trả
    async list(maKH) {
        const response = await this.client.get(`/api/user/doitrahang/${maKH}`);
        return response.data;
    }

    // POST /api/user/doitrahang/tao (multipart/form-data)
    // formData: maHoaDon, lyDo, loaiYeuCau, hinhAnh (file, không bắt buộc)
    async create(formData) {
        const response = await this.client.post("/api/user/doitrahang/tao", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    }
}

export default ReturnApi;
export const returnApi = new ReturnApi();
