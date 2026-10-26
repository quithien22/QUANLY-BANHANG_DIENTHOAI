// file: middlewares/upload.js
// Cấu hình multer dùng cho các route phía user (upload ảnh đổi trả...).
// Giống hệt cấu hình trong server.js: lưu vào thư mục uploads/ (tính từ thư mục chạy node).
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ten = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, ten);
    },
});

module.exports = multer({ storage });
