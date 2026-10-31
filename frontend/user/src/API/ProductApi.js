// file: src/API/ProductApi.js
// Sản phẩm, danh mục, thương hiệu.
import BaseApi from "./BaseApi";

class ProductApi extends BaseApi {
    // GET /api/sanpham
    async getAll() {
        const response = await this.client.get("/api/sanpham");
        return response.data;
    }

    // GET /api/thuonghieu
    async getBrands() {
        const response = await this.client.get("/api/thuonghieu");
        return response.data;
    }

    // GET /api/user/danhmuc  (danh mục nổi bật = thương hiệu đang bật)
    async getActiveBrands() {
        const response = await this.client.get("/api/user/danhmuc");
        return response.data;
    }

    // GET /api/sanpham/loai-san-pham/:maLSP
    async getByType(maLSP) {
        const response = await this.client.get(`/api/sanpham/loai-san-pham/${maLSP}`);
        return response.data;
    }

    // GET /api/sanpham/tim-kiem?tuKhoa=...
    async search(tuKhoa) {
        const response = await this.client.get("/api/sanpham/tim-kiem", { params: { tuKhoa } });
        return response.data;
    }

    // GET /api/sanpham/thuonghieu/:tenHang
    async getByBrand(tenHang) {
        const response = await this.client.get(`/api/sanpham/thuonghieu/${encodeURIComponent(tenHang)}`);
        return response.data;
    }

    // GET /api/sanpham/chitiet/:maSP
    async getDetail(maSP) {
        const response = await this.client.get(`/api/sanpham/chitiet/${maSP}`);
        return response.data;
    }
}

export default ProductApi;
export const productApi = new ProductApi();
