// file: admin/admin-react/src/API/BaseApi.js
// Lớp cha cho mọi API Client của trang Admin (giống frontend): giữ 1 axios instance dùng chung
// và chuẩn hoá lỗi thành ApiError để component không phụ thuộc vào cấu trúc lỗi của axios.
import axios from "axios";

// Đổi địa chỉ backend bằng REACT_APP_API_URL trong file .env, mặc định là localhost:8080
export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Lỗi chuẩn của tầng API.
//  - message : thông báo backend trả về (hoặc câu mặc định nếu mất kết nối)
//  - status  : mã HTTP (undefined nếu không kết nối được server)
//  - response: giữ lại response gốc của axios
export class ApiError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.response = response;
    }
}

class BaseApi {
    constructor(baseURL = BASE_URL) {
        this.client = axios.create({ baseURL });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const response = error.response;
                const message = response?.data?.message || "Lỗi kết nối đến máy chủ!";
                return Promise.reject(new ApiError(message, response?.status, response));
            }
        );
    }
}

export default BaseApi;
