const express = require('express');
const cors = require('cors');
const path = require('path');

// Doc khoa MoMo tu file .env (can: npm install dotenv). Neu chua cai thi bo qua, doc tu bien moi truong he thong.
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { console.warn('Chua cai dotenv - khong doc duoc file .env (npm install dotenv)'); }
if (!process.env.GOOGLE_CLIENT_ID) console.warn('Chua co GOOGLE_CLIENT_ID trong file .env - dang nhap Google se khong hoat dong.');

const app = express();
app.use(cors()); // Cho phép Frontend gọi API thoải mái
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

// Cho phép truy cập ảnh đã upload qua URL, VD: http://localhost:8080/uploads/xxx.jpg
// (cấu hình multer nằm ở middlewares/upload.js, hàm dựng URL ảnh ở utils/imageUrl.js)
app.use('/uploads', express.static('uploads'));

// Cấu hình kết nối SQL Server
const dbConfig = {
    user: 'sa',  
    password: '123456',  
    server: 'LAPTOP-THIEN123',
    database: 'QuanLyBanHangDienThoai',
    port: 1435,
    options: {
        instanceName: 'MSSQLSERVER01',
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
