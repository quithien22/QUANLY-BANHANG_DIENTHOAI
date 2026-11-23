// file: utils/imageUrl.js
// Dựng URL đầy đủ cho ảnh đã upload.
// Đặt PUBLIC_API_URL trong .env khi triển khai (vd: https://api.example.com); mặc định http://localhost:8080
const layUrlAnh = (tenFile) => {
    if (!tenFile) return null;
    const goc = (process.env.PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
    return `${goc}/uploads/${tenFile}`;
};

module.exports = { layUrlAnh };
