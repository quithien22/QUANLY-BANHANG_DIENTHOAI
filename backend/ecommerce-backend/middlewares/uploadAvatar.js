// file: middlewares/uploadAvatar.js
// Cấu hình multer riêng cho ảnh đại diện nhân viên: chỉ JPG/PNG, tối đa 2MB.
// Lưu vào uploads/ (tính từ thư mục chạy node, khớp với express.static('uploads') trong server.js).
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const THU_MUC = 'uploads';
fs.mkdirSync(THU_MUC, { recursive: true }); // tự tạo nếu chưa có

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, THU_MUC + '/'),
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
    },
});

module.exports = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG'));
    },
});
