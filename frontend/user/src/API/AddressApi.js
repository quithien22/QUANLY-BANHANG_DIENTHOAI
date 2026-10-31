// file: src/API/AddressApi.js
// Sổ địa chỉ nhận hàng.
import BaseApi from "./BaseApi";

class AddressApi extends BaseApi {
    // GET /api/diachi/:maKH -> { success, data }
    async list(maKH) {
        const response = await this.client.get(`/api/diachi/${maKH}`);
        return response.data;
    }

    // POST /api/diachi/them   payload: { maKH, hoTenNguoiNhan, SDT, diaChiChiTiet }
    async add(payload) {
        const response = await this.client.post("/api/diachi/them", payload);
        return response.data;
    }

    // PUT /api/diachi/sua/:maDiaChi
    async update(maDiaChi, payload) {
        const response = await this.client.put(`/api/diachi/sua/${maDiaChi}`, payload);
        return response.data;
    }

    // PUT /api/diachi/dat-mac-dinh
    // LƯU Ý: backend hiện CHƯA có route này nên nút "Thiết lập mặc định" sẽ trả 404.
    async setDefault(maKH, maDiaChi) {
        const response = await this.client.put("/api/diachi/dat-mac-dinh", { maKH, maDiaChi });
        return response.data;
    }

    // DELETE /api/diachi/xoa/:maDiaChi
    async remove(maDiaChi) {
        const response = await this.client.delete(`/api/diachi/xoa/${maDiaChi}`);
        return response.data;
    }
}

export default AddressApi;
export const addressApi = new AddressApi();
