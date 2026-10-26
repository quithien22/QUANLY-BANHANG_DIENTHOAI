// file: src/utils/Formatter.js
// Các hàm định dạng dùng chung (tiền, ngày giờ, URL ảnh), thay cho dinhDangTien / dinhDangNgay
// bị viết lặp lại trong từng trang.
import { BASE_URL } from "../API/BaseApi";

class Formatter {
    // 25990000 -> "25.990.000đ"
    static money(soTien) {
        return `${(Number(soTien) || 0).toLocaleString("vi-VN")}đ`;
    }

    // "2026-10-20T08:05:00" -> "8:05, 20/10/2026"
    static dateTime(chuoiNgay) {
        if (!chuoiNgay) return "";
        const d = new Date(chuoiNgay);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getHours()}:${pad(d.getMinutes())}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    // Link http(s) giữ nguyên, đường dẫn tương đối (/uploads/abc.png) nối với BASE_URL
    static imageUrl(duongDan) {
        if (!duongDan) return null;
        return duongDan.startsWith("http") ? duongDan : `${BASE_URL}${duongDan}`;
    }
}

export default Formatter;
