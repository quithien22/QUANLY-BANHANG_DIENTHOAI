// file: utils/imageUrl.js
// Dựng URL đầy đủ cho ảnh đã upload (giống hàm layUrlAnh trong server.js)
const layUrlAnh = (tenFile) => (tenFile ? `http://localhost:8080/uploads/${tenFile}` : null);

module.exports = { layUrlAnh };
