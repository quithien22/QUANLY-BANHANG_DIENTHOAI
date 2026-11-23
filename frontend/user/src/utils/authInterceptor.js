// file: src/utils/authInterceptor.js
// Gắn JWT vào mọi request gửi tới backend và tự đăng xuất khi phiên hết hạn / bị khóa.
//
// Token nằm trong userInfo mà backend trả khi đăng nhập (login.js lưu nguyên object vào localStorage "userData"),
// nên không cần sửa các trang đăng nhập.
//
// Cài ở 2 nơi (xem cuối file và API/BaseApi.js):
//  - axios toàn cục      -> các trang gọi thẳng axios tới localhost:8080
//  - client của BaseApi  -> axios.create() KHÔNG kế thừa interceptor toàn cục nên phải cài riêng
import axios from "axios";

const SESSION_KEYS = ["userData"];
const LOGIN_PATH = "/login";

// Chỉ gửi token tới backend của mình, không bao giờ gửi cho Google, MoMo, ảnh CDN...
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const BACKEND_HOSTS = [BASE_URL, "http://localhost:8080"];

function layToken() {
    try {
        return JSON.parse(localStorage.getItem("userData") || "null")?.token || null;
    } catch {
        return null;
    }
}

function laRequestToiBackend(config) {
    const url = String(config?.url || "");
    const full = /^https?:\/\//i.test(url) ? url : `${config?.baseURL || ""}${url}`;
    return BACKEND_HOSTS.some((host) => full.startsWith(host));
}

function dangXuatVaVeTrangDangNhap() {
    try {
        SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch { /* bỏ qua */ }
    if (window.location.pathname !== LOGIN_PATH) {
        window.location.assign(LOGIN_PATH);
    }
}

const daCai = new WeakSet();

export function installAuthInterceptor(instance) {
    if (!instance || daCai.has(instance)) return;
    daCai.add(instance);

    instance.interceptors.request.use((config) => {
        const token = layToken();
        if (token && laRequestToiBackend(config)) {
            config.headers = config.headers || {};
            if (!config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    });

    // Phải cài TRƯỚC interceptor lỗi của BaseApi (nó đổi lỗi axios thành ApiError và làm mất error.response.data)
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const data = error?.response?.data;
            if (error?.response?.status === 401 && data?.code === "TOKEN_INVALID" && laRequestToiBackend(error.config)) {
                dangXuatVaVeTrangDangNhap();
            }
            return Promise.reject(error);
        }
    );
}

// Import file này (VD trong index.js) là đủ để axios toàn cục có token
installAuthInterceptor(axios);
