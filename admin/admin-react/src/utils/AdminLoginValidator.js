// file: admin/admin-react/src/utils/AdminLoginValidator.js
// Kiểm tra dữ liệu form đăng nhập nhân viên.
// validate() trả về chuỗi lỗi, hoặc "" nếu hợp lệ.
class AdminLoginValidator {
    static MIN_PASSWORD_LENGTH = 6;

    validate(taiKhoan, matKhau) {
        if (!taiKhoan.trim() || !matKhau.trim()) {
            return "Vui lòng nhập đầy đủ thông tin đăng nhập!";
        }

        // Tài khoản admin có thể là SĐT, mã nhân viên hoặc email -> chỉ kiểm tra đuôi khi đang nhập email
        if (taiKhoan.includes("@") && !taiKhoan.trim().toLowerCase().endsWith("@gmail.com")) {
            return "Nếu dùng Email, tài khoản phải có định dạng @gmail.com!";
        }

        if (matKhau.length < AdminLoginValidator.MIN_PASSWORD_LENGTH) {
            return `Mật khẩu phải có ít nhất ${AdminLoginValidator.MIN_PASSWORD_LENGTH} ký tự!`;
        }

        return "";
    }
}

export default AdminLoginValidator;
export const adminLoginValidator = new AdminLoginValidator();
