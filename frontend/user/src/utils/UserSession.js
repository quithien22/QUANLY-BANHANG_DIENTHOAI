// file: src/utils/UserSession.js
// Quản lý phiên đăng nhập của khách trong trình duyệt (key "userData" trong localStorage).
// Thay cho việc mỗi trang tự JSON.parse(localStorage.getItem("userData")).
class UserSession {
    constructor(storage = window.localStorage, key = "userData") {
        this.storage = storage;
        this.key = key;
    }

    // Trả về object user, hoặc null nếu chưa đăng nhập / dữ liệu hỏng
    get() {
        try {
            return JSON.parse(this.storage.getItem(this.key) || "null");
        } catch {
            return null;
        }
    }

    getMaKH() {
        return this.get()?.maKH;
    }

    isLoggedIn() {
        return !!this.getMaKH();
    }

    set(userInfo) {
        this.storage.setItem(this.key, JSON.stringify(userInfo));
    }

    // Gộp thêm trường mới vào user hiện tại (VD: sau khi cập nhật hồ sơ)
    update(partial) {
        const updated = { ...(this.get() || {}), ...partial };
        this.set(updated);
        return updated;
    }

    clear() {
        this.storage.removeItem(this.key);
    }
}

export default UserSession;
export const userSession = new UserSession();
