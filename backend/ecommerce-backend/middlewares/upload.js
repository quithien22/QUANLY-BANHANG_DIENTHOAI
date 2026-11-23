// file: middlewares/upload.js
// Cấu hình multer dùng cho các route phía user/admin (ảnh đổi trả, sản phẩm, banner...).
// Lưu vào backend/ecommerce-backend/uploads (đường dẫn tuyệt đối, khớp với express.static trong server.js)
// và tự tạo thư mục nếu chưa có.
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const THU_MUC = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(THU_MUC, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, THU_MUC),
    filename: (req, file, cb) => {
        const ten = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, ten);
    },
});

module.exports = multer({ storage });
