// file: src/utils/imageUrl.js
// Dựng URL đầy đủ cho ảnh sản phẩm/banner. Ảnh đã là link http(s) thì giữ nguyên,
// còn đường dẫn tương đối (vd: /uploads/abc.png) thì nối với BASE_URL của backend.
import { BASE_URL } from "../API/BaseApi";

export const layUrlAnh = (duongDan) => {
    if (!duongDan) return null;
    return duongDan.startsWith("http") ? duongDan : `${BASE_URL}${duongDan}`;
};
