const express = require('express');
const cors = require('cors');
const path = require('path');

// Đọc cấu hình (DB, JWT, MoMo, Google...) từ file .env (cần: npm install dotenv).
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { console.warn('Chua cai dotenv - khong doc duoc file .env (npm install dotenv)'); }
if (!process.env.GOOGLE_CLIENT_ID) console.warn('Chua co GOOGLE_CLIENT_ID trong file .env - dang nhap Google se khong hoat dong.');

// Thiếu cấu hình bắt buộc thì dừng ngay, tuyệt đối không có mật khẩu / khóa mặc định trong mã nguồn.
const thieu = ['DB_SERVER', 'DB_PASSWORD', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (thieu.length > 0) {
    console.error(`Thieu cau hinh bat buoc trong file .env: ${thieu.join(', ')} (xem .env.example)`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET qua ngan: can it nhat 32 ky tu ngau nhien (xem .env.example)');
    process.exit(1);
}

const app = express();
app.use(cors()); // Cho phép Frontend gọi API (xác thực bằng header Authorization: Bearer <JWT>, không dùng cookie)
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

// Cho phép truy cập ảnh đã upload qua URL, VD: http://localhost:8080/uploads/xxx.jpg
// (cấu hình multer nằm ở middlewares/upload.js, hàm dựng URL ảnh ở utils/imageUrl.js)
// Dùng đường dẫn tuyệt đối để chạy `node server.js` ở thư mục nào cũng được (trùng với middlewares/upload*.js)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình kết nối SQL Server - toàn bộ đọc từ .env:
//   DB_SERVER, DB_PASSWORD (bắt buộc); DB_USER, DB_NAME, DB_PORT, DB_INSTANCE (tùy chọn)
// DB_INSTANCE để trống / không khai báo = không dùng instance, chỉ kết nối qua DB_PORT.
const instanceName = process.env.DB_INSTANCE || '';
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME || 'QuanLyBanHangDienThoai',
    port: Number(process.env.DB_PORT) || 1433,
    options: {
        ...(instanceName ? { instanceName } : {}),
        encrypt: false,
        trustServerCertificate: true
    }
};

// ===== Khởi tạo các đối tượng OOP (Database -> Service -> Controller -> Routes) =====
// Toàn bộ route của admin lẫn user (khách hàng, hóa đơn, nhân viên, sản phẩm, thống kê, giỏ hàng,
// đăng nhập, MoMo...) nằm trong container.js
require('./container')(dbConfig).forEach(({ path: basePath, router }) => app.use(basePath, router));
// ====================================================================================

app.listen(8080, () => {
    console.log("Server đang chạy ở cổng 8080...");
});
