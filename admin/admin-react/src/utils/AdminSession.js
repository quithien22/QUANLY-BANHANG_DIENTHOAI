// file: admin/admin-react/src/utils/AdminSession.js
// Quản lý phiên đăng nhập của nhân viên trong trình duyệt (localStorage).
// Gom toàn bộ thao tác storage vào 1 lớp để component không phải nhớ tên key.
class AdminSession {
    // Giữ nguyên key "adminData" để các trang admin khác đang đọc key này vẫn chạy bình thường
    static KEY_ADMIN = "adminData";
    static KEY_REMEMBER = "adminSavedTaiKhoan";
    // Key cũ từng lưu mật khẩu dạng văn bản thường -> chỉ dùng để xoá đi
    static KEY_LEGACY_PASSWORD = "adminSavedMK";

    // Lưu thông tin nhân viên sau khi đăng nhập thành công
    save(adminInfo) {
        localStorage.setItem(AdminSession.KEY_ADMIN, JSON.stringify(adminInfo));
    }

    // Lấy thông tin nhân viên đang đăng nhập (null nếu chưa đăng nhập / dữ liệu hỏng)
    get() {
        try {
            return JSON.parse(localStorage.getItem(AdminSession.KEY_ADMIN));
        } catch {
            return null;
        }
    }

    isLoggedIn() {
        return this.get() !== null;
    }

    clear() {
        localStorage.removeItem(AdminSession.KEY_ADMIN);
    }

    // Ghi nhớ đăng nhập: CHỈ nhớ tài khoản, không bao giờ lưu mật khẩu
    rememberAccount(taiKhoan, ghiNho) {
        if (ghiNho) {
            localStorage.setItem(AdminSession.KEY_REMEMBER, taiKhoan.trim());
        } else {
            localStorage.removeItem(AdminSession.KEY_REMEMBER);
        }
    }

    // Tài khoản đã nhớ ("" nếu chưa nhớ)
    getRememberedAccount() {
        return localStorage.getItem(AdminSession.KEY_REMEMBER) || "";
    }

    // Dọn mật khẩu cũ còn sót trong máy người dùng
    removeLegacyPassword() {
        localStorage.removeItem(AdminSession.KEY_LEGACY_PASSWORD);
    }
}

export default AdminSession;
export const adminSession = new AdminSession();
