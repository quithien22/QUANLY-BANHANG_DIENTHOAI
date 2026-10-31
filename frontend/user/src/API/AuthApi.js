// file: src/API/AuthApi.js
// Đăng nhập / đăng ký / đăng nhập Google.
import BaseApi from "./BaseApi";

class AuthApi extends BaseApi {
    // POST /api/user/dang-nhap -> { success, userInfo }
    async login(taiKhoan, matKhau) {
        const response = await this.client.post("/api/user/dang-nhap", { taiKhoan, matKhau });
        return response.data;
    }

    // POST /api/user/dang-ky -> { success, message }
    async register(taiKhoan, matKhau) {
        const response = await this.client.post("/api/user/dang-ky", { taiKhoan, matKhau });
        return response.data;
    }

    // POST /api/user/dang-nhap-google -> { success, userInfo }
    async loginGoogle(accessToken) {
        const response = await this.client.post("/api/user/dang-nhap-google", { accessToken });
        return response.data;
    }
}

export default AuthApi;
export const authApi = new AuthApi();
