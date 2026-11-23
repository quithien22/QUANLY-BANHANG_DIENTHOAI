# QuanLyBanHangDienThoai – Hệ thống bán điện thoại

Dự án gồm 3 phần chạy riêng, giao tiếp với nhau qua REST API (JSON):

| Phần | Thư mục | Công nghệ | Vai trò |
|---|---|---|---|
| Backend | `backend/ecommerce-backend` | Node.js, Express, SQL Server (`mssql`) | Cung cấp API cho cả khách hàng và admin |
| Frontend (khách hàng) | `frontend/user` | React | Trang mua hàng |
| Admin (nhân viên) | `frontend/admin` | React | Trang quản trị |

```
Trình duyệt (React) ──HTTP/JSON──▶ Express (cổng 8080) ──▶ SQL Server (QuanLyBanHangDienThoai)
```

---

## 1. Cách hoạt động của Backend

Backend theo mô hình hướng đối tượng, mỗi chức năng được tách thành 3 lớp:

```
Request ─▶ Routes ─▶ Controller ─▶ Service ─▶ Database
                                      │
Response ◀────────────────────────────┘
```

| Lớp | Việc duy nhất của nó | Không được làm |
|---|---|---|
| **Routes** | Khai báo URL + method, gắn vào hàm của Controller | Xử lý nghiệp vụ |
| **Controller** | Đọc `req` (params, query, body, file), gọi Service, trả JSON | Viết SQL |
| **Service** | Nghiệp vụ + truy vấn SQL, ném `HttpError` khi sai điều kiện | Biết gì về `req`/`res` |
| **Database** | Giữ cấu hình và pool kết nối SQL Server dùng chung | – |

### Các file nền tảng
- `server.js` – chỉ khởi tạo Express: CORS, đọc JSON, phục vụ thư mục `/uploads`, nạp `container.js`, lắng nghe cổng **8080**. Chứa cấu hình kết nối SQL Server (`dbConfig`).
- `container.js` – nơi **duy nhất** nối các đối tượng: `Database → Service → Controller → Routes`. Thêm chức năng mới chỉ cần thêm vài dòng ở đây.
- `config/Database.js` – tạo pool kết nối.
- `services/BaseService.js` – lớp cha của mọi Service (cung cấp `getPool()` và `sql`).
- `controllers/BaseController.js` – lớp cha của mọi Controller. Hàm `handle()` bọc `try/catch` chung:
  - `HttpError` (lỗi nghiệp vụ) → trả đúng mã HTTP và `{ success:false, message }`.
  - Lỗi bất ngờ → ghi log và trả 500 với `{ success:false, message:"Lỗi Server: ..." }`.
- `routes/BaseRoutes.js` – lớp cha của mọi Routes (giữ `router` và đường dẫn gốc).
- `errors/HttpError.js` – lỗi có kèm mã HTTP.
- `middlewares/upload.js` – multer, lưu ảnh upload vào thư mục `uploads/`.
- `utils/imageUrl.js` – dựng URL đầy đủ của ảnh đã upload.

### Cấu trúc thư mục
```
backend/ecommerce-backend/
├── server.js
├── container.js
├── config/            Database.js
├── errors/            HttpError.js
├── middlewares/       upload.js
├── utils/             imageUrl.js
├── routes/
│   ├── BaseRoutes.js
│   ├── user/          Cart, Auth, Customer, Catalog, Promotion, Content, Order, Payment, Wishlist, Review, Return, Address
│   └── admin/         AuthAdmin, KhachHang, HoaDon, NhanVien, ChamCong, NhaCungCap, PhieuNhap,
│                      KhuyenMai, DanhGia, ThuongHieu, VanChuyen, SanPham, DoiTraHang, CaiDat,
│                      Banner, ThongKe, HoTro
├── controllers/       (cùng cấu trúc user/ và admin/)
└── services/          (cùng cấu trúc user/ và admin/)
```
Phía **user** đặt tên file tiếng Anh (`CartService`…), phía **admin** đặt tên tiếng Việt không dấu (`KhachHangService`, `HoaDonController`…). Mỗi module admin gồm đủ 3 file: `…Service.js`, `…Controller.js`, `…Routes.js`.

### Ví dụ một luồng: admin đổi trạng thái đơn hàng
1. Trang admin gọi `hoaDonApi.capNhatTrangThai(maHoaDon, trangThai)`.
2. Gửi `PUT /api/hoadon/capnhat-trangthai/:maHoaDon`.
3. `HoaDonRoutes` chuyển tới `HoaDonController.capNhatTrangThai`.
4. Controller gọi `HoaDonService.capNhatTrangThai`: cập nhật trạng thái hóa đơn; khi đơn chuyển sang `hoan_tat` thì cộng điểm tích lũy (1 điểm / 100.000đ), khi rời khỏi `hoan_tat` thì trừ lại; rồi đồng bộ `tongDonHang` của khách.
5. Controller trả `{ success: true, message: "..." }`.

### Các nhóm API admin (đường dẫn gốc)
| Module | Đường dẫn |
|---|---|
| Đăng nhập admin | `POST /api/admin/dang-nhap` |
| Khách hàng | `/api/khachhang` |
| Hóa đơn / đơn hàng | `/api/hoadon` (admin: `/`, `/toanbo`, `/capnhat-trangthai/:maHoaDon`) |
| Nhân viên | `/api/nhanvien`, `/api/admin/nhanvien/...` |
| Chấm công & lương | `/api/chamcong`, `/api/luong/...` |
| Nhà cung cấp | `/api/nhacungcap` |
| Phiếu nhập | `/api/phieunhap_nhacungcap` |
| Khuyến mãi & Flash sale | `/api/khuyenmai`, `/api/sanphamflashsale`, `/api/admin/flashsale/...` |
| Đánh giá | `/api/admin/danhgiasanpham`, `/api/admin/danhgia/...` |
| Thương hiệu (danh mục) | `/api/thuonghieu`, `/api/admin/thuonghieu/...` |
| Vận chuyển | `/api/vanchuyen` |
| Sản phẩm | `/api/sanpham` |
| Đổi trả hàng | `/api/doitrahang` |
| Cài đặt hệ thống | `/api/caidat` |
| Banner | `/api/caidat/banner` |
| Thống kê | `/api/thongke/...` |
| Hỗ trợ (FAQ) | `/api/admin/faq/...` |

Một số đường dẫn dùng chung giữa user và admin (ví dụ `GET /api/sanpham`, `GET /api/thuonghieu`, `GET /api/caidat/banner`) – hãy giữ nguyên chúng khi sửa.

---

## 2. Cách hoạt động của Frontend / Admin

Cả hai ứng dụng React đều **không gọi `axios` trực tiếp trong component**. Mọi cuộc gọi API đi qua các lớp trong thư mục `src/API`:

```
Component (trang)  ─▶  XxxApi (lớp API)  ─▶  BaseApi (axios dùng chung)  ─▶  Backend
```

- `BaseApi.js` – tạo một axios instance với `baseURL` (mặc định `http://localhost:8080`, đổi bằng biến `REACT_APP_API_URL` trong `.env`). Mọi lỗi được chuẩn hóa thành `ApiError` (`message`, `status`, `response`), nên component chỉ cần đọc `error.message`.
- Mỗi lớp API tương ứng một nhóm chức năng và xuất sẵn một đối tượng dùng chung, ví dụ `khachHangApi`, `hoaDonApi`, `sanPhamApi`.
- Các hàm API trả về **dữ liệu đã bóc sẵn** (`response.data`), nên component dùng trực tiếp kết quả, không cần `.data`.

```js
// Ví dụ trong trang admin
import { khachHangApi } from "../../API/KhachHangApi";

const danhSach = await khachHangApi.layDanhSach();
const ketQua   = await khachHangApi.suaThongTin(maKH, { hoTen, SDT, trangThai });
if (ketQua.success) { /* ... */ }
```

### Thư mục `frontend/admin/src`
```
API/       BaseApi, AdminAuthApi, ChamCongApi, KhachHangApi, HoaDonApi, NhanVienApi, NhaCungCapApi,
           PhieuNhapApi, KhuyenMaiApi, DanhGiaApi, ThuongHieuApi, VanChuyenApi, SanPhamApi,
           DoiTraHangApi, CaiDatApi, BannerApi, ThongKeApi, HoTroApi
utils/     AdminSession.js (đọc/ghi phiên đăng nhập), AdminLoginValidator.js
routes/    ProtectedRoute.js (chặn vào trang admin khi chưa đăng nhập)
components/ Sidebar, Topbar
pages/     auth, Dashboard, donhang, hethong, khachhang, kho, marketing, nhansu, sanpham, thongke
```

### Phiên đăng nhập admin
1. `AdminAuthApi` gọi `POST /api/admin/dang-nhap`.
2. Đăng nhập thành công → `adminSession.save(thongTinNhanVien)` lưu vào `localStorage` (key `adminData`).
3. Các trang lấy nhân viên đang đăng nhập bằng `adminSession.get()`; `ProtectedRoute` dùng `adminSession.isLoggedIn()` để chặn truy cập.
4. Sau khi đăng nhập, `chamCongApi.chamCongTuDong(maNV)` tự chấm công cho ngày hôm đó (mỗi ngày chỉ ghi một lần).
5. Chỉ **tên tài khoản** được ghi nhớ khi chọn "ghi nhớ"; mật khẩu không bao giờ được lưu.

---

## 3. Cách chạy

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng - 1 lệnh duy nhất)

Toàn bộ hệ thống (SQL Server, Backend Express, AI Service Python, Frontend Khách hàng, Frontend Admin) đã được đóng gói và cấu hình tự động khởi tạo cơ sở dữ liệu và dữ liệu mẫu:

1. Đảm bảo máy tính đã cài đặt và khởi động **Docker Desktop**.
2. Tại thư mục gốc của dự án, chạy lệnh:
   ```bash
   docker compose up --build
   ```
   *(Hoặc chạy ngầm trong nền: `docker compose up --build -d`)*

3. Sau khi khởi động xong, truy cập các địa chỉ:
   - **Frontend Khách hàng (Mua sắm):** [http://localhost:3000](http://localhost:3000)
   - **Frontend Admin (Quản trị viên):** [http://localhost:3001](http://localhost:3001)
     - Tài khoản: `admin@store.com` (hoặc `0900000001` / `NV01`)
     - Mật khẩu: `123456`
   - **Tài khoản khách hàng mẫu:** `user@gmail.com` / Mật khẩu: `123456`
   - **Backend API:** [http://localhost:8080](http://localhost:8080)
   - **AI Service:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **SQL Server:** `localhost:1433` (user: `sa`, password: `YourStrong@Password123`)

4. Dừng hệ thống:
   ```bash
   docker compose down
   ```

---

### Cách 2: Chạy thủ công trên máy (Local)
2. Chỉnh `dbConfig` trong `backend/ecommerce-backend/server.js` (user, password, server, port, instanceName) cho khớp máy của bạn.
3. Tạo file `.env` trong `backend/ecommerce-backend` (xem `.env.example`; cần `GOOGLE_CLIENT_ID` nếu dùng đăng nhập Google, và các khóa MoMo nếu dùng thanh toán).
4. Tạo thư mục `uploads/` trong thư mục chạy backend (nơi lưu ảnh upload).
5. Chạy backend:
   ```
   cd backend/ecommerce-backend
   npm install
   node server.js        # chạy ở http://localhost:8080
   ```
6. Chạy frontend khách hàng và admin (mỗi cái trong một cửa sổ terminal, xem `scripts` trong `package.json` của từng thư mục):
   ```
   cd frontend/user  && npm install && npm start     # http://localhost:3000
   cd frontend/admin && npm install && npm start     # http://localhost:3001
   ```

---

## 4. Quy ước khi thêm chức năng mới

**Backend** – thêm 3 file rồi nối vào `container.js`:
1. `services/admin/XxxService.js` (extends `BaseService`): viết nghiệp vụ và SQL.
2. `controllers/admin/XxxController.js` (extends `BaseController`): mỗi action bọc bằng `this.handle(...)`.
3. `routes/admin/XxxRoutes.js` (extends `BaseRoutes`): khai báo URL.
4. Trong `container.js`: thêm `require` và một dòng `new XxxRoutes(new XxxController(new XxxService(db)))`.

**Admin/Frontend** – thêm `src/API/XxxApi.js` (extends `BaseApi`), xuất kèm một đối tượng dùng chung, rồi gọi từ component.

<!-- ## 5. Tình trạng chuyển đổi OOP và các điểm cần biết

- **Backend:** toàn bộ route admin và user đã nằm trong các lớp Routes/Controller/Service; `server.js` không còn chứa route nào.
- **Admin React:** các trang `khachhang_admin`, `danhgia_admin`, `hotro_admin`, `quanlydh_admin`, `vanchuyen_admin`, `doitrahang_admin`, `nhacc_phieunhap` đã dùng lớp API. Các trang còn lại (`banner_admin`, `khuyenmai_admin`, `chamcong_admin`, `nhanvien_phanquyen`, `danhmucsp_admin`, `sanpham_admin`, `thongke_admin`, `caidathethong_admin`, `dashboard_admin`) **vẫn gọi `axios` trực tiếp** và đang được chuyển dần.
- **Chưa kiểm thử:** sau đợt refactor, toàn bộ backend và các trang đã chuyển chưa được chạy thử đầy đủ; hãy chạy server và bấm qua từng trang trước khi dùng.
- **Lỗi đã biết, được giữ nguyên logic khi chuyển:**
  - `POST/PUT/DELETE /api/sanpham` trước đây chưa từng được mount; SQL bên trong dùng cột `tenLSP` trong bảng `SanPham` nên có thể không khớp schema.
  - `khuyenmai_admin` gọi `POST /api/admin/khuyenmai/them` nhưng backend chưa có route này.
  - `PUT /api/caidat/matkhau` kiểm tra mật khẩu dạng chữ thường trong bảng `TaiKhoan`, không đồng bộ với đăng nhập (bcrypt trên `NhanVien`).
  - Hai route cũ `GET /api/categories` và `GET /api/danhgiasanpham` đã bị bỏ khi dọn `server.js`.
  - Mật khẩu nhân viên tạo qua `POST /api/admin/nhanvien/them` đang lưu dạng chữ thường (đăng nhập sẽ nâng cấp lên bcrypt ở lần đăng nhập đầu). -->
