# QuanLyBanHangDienThoai – Hệ thống bán điện thoại

Dự án gồm 4 phần chạy riêng, giao tiếp với nhau qua REST API (JSON):

| Phần | Thư mục | Công nghệ | Vai trò |
|---|---|---|---|
| Backend | `backend/ecommerce-backend` | Node.js, Express, SQL Server (`mssql`) | API cho cả khách hàng và admin |
| Frontend (khách hàng) | `frontend/user` | React 19 (Create React App), Tailwind | Trang mua hàng |
| Admin (nhân viên) | `frontend/admin` | React 19 (Create React App) | Trang quản trị |
| AI service | `ai-service` | Python, FastAPI | Gợi ý sản phẩm, nhận diện ý định (NLU) cho chatbot |

```
Trình duyệt (React) ──HTTP/JSON + JWT──▶ Express (cổng 8080) ──▶ SQL Server (QuanLyBanHangDienThoai)
                                              │
                                              └──▶ Gemini API, MoMo, Google OAuth, ai-service
```

> **Lưu ý vị trí file:** `package.json` của backend nằm ở `backend/`, **không** nằm trong `backend/ecommerce-backend/`. Cài thư viện ở `backend/`, chạy server ở `backend/ecommerce-backend/`.

---

## 1. Backend

Mô hình hướng đối tượng, mỗi chức năng tách thành 3 lớp:

```
Request ─▶ Routes ─▶ Controller ─▶ Service ─▶ Database
                                      │
Response ◀────────────────────────────┘
```

| Lớp | Việc duy nhất của nó | Không được làm |
|---|---|---|
| **Routes** | Khai báo URL + method, gắn middleware xác thực, gắn vào hàm của Controller | Xử lý nghiệp vụ |
| **Controller** | Đọc `req` (params, query, body, file, `req.auth`), gọi Service, trả JSON | Viết SQL |
| **Service** | Nghiệp vụ + SQL (tham số hóa), ném `HttpError` khi sai điều kiện | Biết gì về `req`/`res` |
| **Database** | Giữ cấu hình và pool kết nối SQL Server dùng chung | – |

### Các file nền tảng
- `server.js` – khởi tạo Express: CORS, đọc JSON, phục vụ `/uploads`, nạp `container.js`, lắng nghe cổng **8080**. Đọc cấu hình từ `.env` và **từ chối khởi động** nếu thiếu `DB_SERVER`, `DB_PASSWORD` hoặc `JWT_SECRET` (phải ≥ 32 ký tự).
- `container.js` – nơi **duy nhất** nối các đối tượng: `Database → Service → Controller → Routes`. Gọi `configureAuth(db)` để middleware xác thực dùng được CSDL.
- `config/Database.js` – pool kết nối.
- `services/BaseService.js` – lớp cha của Service (`getPool()`, `sql`).
- `controllers/BaseController.js` – lớp cha của Controller. `handle()` bọc `try/catch`: `HttpError` → đúng mã HTTP và `{ success:false, message }`; lỗi lạ → log và trả 500.
- `routes/BaseRoutes.js` – lớp cha của Routes.
- `errors/HttpError.js` – lỗi kèm mã HTTP.
- `middlewares/auth.js` – xác thực và phân quyền (mục 2).
- `middlewares/upload.js` – multer, lưu ảnh vào `uploads/`.
- `utils/jwt.js` – JWT HS256 viết bằng `crypto` có sẵn của Node.
- `utils/id.js` – sinh mã không trùng (`taoMa('KH')`, `taoMa('PN')`…).
- `utils/imageUrl.js` – dựng URL đầy đủ của ảnh upload.

### Cấu trúc thư mục
```
backend/ecommerce-backend/
├── server.js
├── container.js
├── config/            Database.js
├── errors/            HttpError.js
├── middlewares/       auth.js, upload.js
├── utils/             jwt.js, id.js, imageUrl.js
├── routes/
│   ├── BaseRoutes.js
│   ├── user/          Cart, Auth, Customer, Catalog, Promotion, Content, Order, Payment,
│   │                  Wishlist, Review, Return, Address, Chatbot
│   └── admin/         AuthAdmin, KhachHang, HoaDon, NhanVien, ChamCong, NhaCungCap, PhieuNhap,
│                      KhuyenMai, DanhGia, ThuongHieu, VanChuyen, SanPham, DoiTraHang, CaiDat,
│                      Banner, ThongKe, HoTro
├── controllers/       (cùng cấu trúc user/ và admin/)
└── services/          (cùng cấu trúc user/ và admin/)
```
Phía **user** đặt tên file tiếng Anh (`CartService`…), phía **admin** đặt tên tiếng Việt không dấu (`KhachHangService`…). Mỗi module gồm đủ 3 file: `…Service.js`, `…Controller.js`, `…Routes.js`.

---

## 2. Xác thực và phân quyền (JWT)

### Luồng đăng nhập
1. Khách: `login` / `loginGoogle` (AuthController). Admin: `POST /api/admin/dang-nhap`.
2. Thành công → backend trả thông tin người dùng kèm trường **`token`** (HS256, payload `sub`, `role`, `iat`, `exp`).
   - `role = 'user'` (sub = `maKH`) hoặc `role = 'admin'` (sub = `maNV`).
   - Hạn token: `JWT_EXPIRES_IN` (khách, mặc định `7d`), `JWT_ADMIN_EXPIRES_IN` (admin, ví dụ `12h`). Định dạng: `15m`, `12h`, `7d` hoặc số giây.
3. Frontend gửi `Authorization: Bearer <token>` ở mọi request.

### Middleware (`middlewares/auth.js`)
| Middleware | Ý nghĩa |
|---|---|
| `requireUser` | Phải là khách đã đăng nhập; gán `req.auth.maKH` |
| `requireSelf('maKH')` | `:maKH` trên URL phải trùng với người trong token |
| `requireAdmin(...maCV)` | Phải là nhân viên; nếu truyền mã chức vụ thì chỉ các chức vụ đó được vào |
| `optionalAdmin()` | Không bắt buộc đăng nhập, nhưng nếu có token admin thì gán `req.auth` |

Nguyên tắc:
- **Danh tính chỉ lấy từ token** (`req.auth`), không bao giờ tin `maKH`/`maNV`/`maCV` do client gửi trong body hoặc URL.
- Mỗi request, middleware **kiểm tra lại CSDL**: tài khoản bị khóa hoặc đổi chức vụ có hiệu lực ngay, không cần chờ token hết hạn.
- Quyền sở hữu được kiểm tra ngay trong SQL (`AND maKH = @maKH`) cho giỏ hàng, địa chỉ, đơn hàng, đổi trả, thanh toán MoMo.
- Middleware gắn **theo từng route** (không dùng `router.use`) vì nhiều router cùng mount ở `/api`. Với route có upload, `requireUser/requireAdmin` đứng **trước** multer.

### Chức vụ
| Mã | Chức vụ | Ghi chú |
|---|---|---|
| CV01 | Giám đốc | Toàn quyền; là người duy nhất được tạo/sửa/xóa tài khoản CV01/CV02 và sửa lương cơ bản |
| CV02 | Quản lý | Nhóm quản trị (`ROLES.QUAN_TRI`): quản lý nhân viên thường, cài đặt cửa hàng, tính lương |
| CV03 | Nhân viên | Các chức năng vận hành còn lại |

### Endpoint công khai (không cần token)
- Đăng ký / đăng nhập (khách, admin), đăng nhập Google.
- Danh mục: `GET /api/sanpham`, `GET /api/thuonghieu`, `GET /api/caidat/banner`, `GET /api/sanphamflashsale`, `GET /api/user/khuyenmai`, `GET /api/danhgia/:maSP` (xem đánh giá sản phẩm), nội dung (Content).
- Chatbot `/api/ai-chat`.
- `POST /api/momo-ipn` và `/api/momo-xacnhan` – do MoMo gọi, được bảo vệ bằng chữ ký HMAC.

Mọi endpoint còn lại yêu cầu `requireUser` (khách) hoặc `requireAdmin` (admin).

---

## 3. Các nhóm API admin (đường dẫn gốc)

| Module | Đường dẫn |
|---|---|
| Đăng nhập admin | `POST /api/admin/dang-nhap` |
| Khách hàng | `/api/khachhang` |
| Hóa đơn / đơn hàng | `/api/hoadon` |
| Nhân viên | `/api/nhanvien`, `/api/admin/nhanvien/...` |
| Chấm công & lương | `/api/chamcong`, `/api/luong/...` |
| Nhà cung cấp | `/api/nhacungcap` |
| Phiếu nhập | `/api/phieunhap_nhacungcap` |
| Khuyến mãi & Flash sale | `/api/khuyenmai`, `/api/sanphamflashsale`, `/api/admin/flashsale/...` |
| Đánh giá | `/api/admin/danhgiasanpham`, `/api/admin/danhgia/...` |
| Thương hiệu | `/api/thuonghieu`, `/api/admin/thuonghieu/...` |
| Vận chuyển | `/api/vanchuyen` |
| Sản phẩm | `/api/sanpham` |
| Đổi trả hàng | `/api/doitrahang` |
| Cài đặt hệ thống | `/api/caidat` |
| Banner | `/api/caidat/banner` |
| Thống kê | `/api/thongke/...` |
| Hỗ trợ (FAQ) | `/api/admin/faq/...` |

Một số đường dẫn dùng chung giữa user và admin (`GET /api/sanpham`, `GET /api/thuonghieu`, `GET /api/caidat/banner`) – giữ nguyên khi sửa.

### Ví dụ một luồng: admin đổi trạng thái đơn hàng
1. Trang admin gọi `hoaDonApi.capNhatTrangThai(maHoaDon, trangThai)`.
2. Gửi `PUT /api/hoadon/capnhat-trangthai/:maHoaDon` kèm Bearer token.
3. `requireAdmin` xác thực → `HoaDonController.capNhatTrangThai` → `HoaDonService.capNhatTrangThai`.
4. Khi đơn sang `hoan_tat` thì cộng điểm tích lũy (1 điểm / 100.000đ); rời khỏi `hoan_tat` thì trừ lại; đồng bộ `tongDonHang` của khách.
5. Trả `{ success: true, message: "..." }`.

---

## 4. Frontend (`frontend/user`) và Admin (`frontend/admin`)

Mọi cuộc gọi API đi qua lớp trong `src/API`:

```
Component (trang) ─▶ XxxApi ─▶ BaseApi (axios) ─▶ Backend
```

- `BaseApi.js` – axios instance với `baseURL` mặc định `http://localhost:8080` (đổi bằng `REACT_APP_API_URL`). Lỗi được chuẩn hóa thành `ApiError` (`message`, `status`, `response`).
- Mỗi lớp API xuất sẵn một đối tượng dùng chung (`khachHangApi`, `hoaDonApi`…) và trả về dữ liệu đã bóc (`response.data`).

```js
import { khachHangApi } from "../../API/KhachHangApi";
const danhSach = await khachHangApi.layDanhSach();
```

### Phiên đăng nhập và token
- Phiên lưu ở `localStorage`: khóa `userData` (khách) và `adminData` (admin); bên trong có `token`.
- `src/utils/authInterceptor.js` (có ở cả hai app):
  - tự gắn `Authorization: Bearer <token>` cho request tới backend (`BASE_URL` hoặc `http://localhost:8080`);
  - khi nhận **401 với mã `TOKEN_INVALID`** thì xóa phiên và chuyển về `/login`;
  - được cài lên axios toàn cục (cho các trang còn gọi `axios` trực tiếp) **và** lên từng instance của `BaseApi` (vì `axios.create` không kế thừa interceptor toàn cục). Interceptor xác thực được đăng ký **trước** interceptor đổi lỗi thành `ApiError`.
  - được nạp bằng `import './utils/authInterceptor'` trong `index.js`.
- Khi ghi đè `userData`/`adminData`, **phải giữ lại `token`** (ví dụ `{ ...storedUser, ...capNhat }`), nếu không người dùng sẽ bị coi là chưa đăng nhập.
- Admin: `utils/AdminSession.js` (đọc/ghi phiên), `routes/ProtectedRoute.js` chặn vào trang khi chưa đăng nhập; sau khi đăng nhập tự chấm công ngày hôm đó. Chỉ tên tài khoản được nhớ, mật khẩu không bao giờ được lưu.

### Thư mục `frontend/admin/src`
```
API/        BaseApi + các lớp API theo module (KhachHangApi, HoaDonApi, SanPhamApi, ...)
utils/      AdminSession.js, AdminLoginValidator.js, authInterceptor.js
routes/     ProtectedRoute.js
components/ Sidebar, Topbar
pages/      auth, Dashboard, donhang, hethong, khachhang, kho, marketing, nhansu, sanpham, thongke
```
Một số trang admin vẫn gọi `axios` trực tiếp tới `http://localhost:8080`; nhờ interceptor toàn cục chúng vẫn được gắn token.

---

## 5. AI service (`ai-service`)

FastAPI (Python): `main.py` (ứng dụng), `nlu.py` (nhận diện ý định), `recommender.py` (gợi ý), `train.py` / `features.py` / `data_loader.py` (huấn luyện), `db.py` (kết nối SQL Server qua ODBC), `config.py`, thư mục `model/` và `data/`.

Cấu hình trong `ai-service/.env` (xem `.env.example`): `DB_SERVER` (dạng `TÊN_MÁY,CỔNG`), `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DRIVER`, `FAQ_PATH` (tuỳ chọn), `AI_TRAIN_TOKEN`.
- `POST /train` chỉ dùng được khi đặt `AI_TRAIN_TOKEN` và gọi kèm header `X-Train-Token`; để trống thì endpoint bị khóa.
- Cần cài **ODBC Driver 17 for SQL Server**.

---

## 6. Cách chạy

### 6.1 Chuẩn bị
1. Cài SQL Server, tạo CSDL `QuanLyBanHangDienThoai` và nạp schema/dữ liệu.
2. Tạo file `backend/ecommerce-backend/.env` từ `.env.example`:

| Biến | Ý nghĩa |
|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_INSTANCE` | Kết nối SQL Server (`DB_SERVER`, `DB_PASSWORD` bắt buộc) |
| `JWT_SECRET` | **Bắt buộc**, ≥ 32 ký tự. Tạo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Hạn token khách (mặc định `7d`) |
| `JWT_ADMIN_EXPIRES_IN` | Hạn token admin (ví dụ `12h`) |
| `PUBLIC_API_URL` | URL công khai của backend (dựng link ảnh, callback) |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_IPN_URL`, `MOMO_REDIRECT_URL` | Thanh toán MoMo |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Chatbot Gemini |
| `GOOGLE_CLIENT_ID` | Đăng nhập Google |

   Không commit file `.env`. Đổi `JWT_SECRET` sẽ làm mọi token cũ mất hiệu lực.
3. Tạo thư mục `uploads/` trong thư mục chạy backend.

### 6.2 Backend
```
cd backend
npm install
cd ecommerce-backend
node server.js        # http://localhost:8080
```

### 6.3 Frontend
```
cd frontend/user  && npm install && npm start     # thường là http://localhost:3000
cd frontend/admin && npm install && npm start     # cổng khác nếu 3000 đã bị chiếm (CRA sẽ hỏi)
```
Đặt `REACT_APP_API_URL` trong `.env` của từng app nếu backend không chạy ở `http://localhost:8080`.

### 6.4 AI service (tuỳ chọn)
```
cd ai-service
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
cp .env.example .env              # rồi điền thông tin thật
uvicorn main:app --port 8000      # cổng và lệnh khởi động: kiểm tra lại trong main.py / cấu hình chatbot
```

---

## 7. Kiểm thử và CI

- `tests/login-user-test.js` – test đăng nhập của app user. Để chạy cục bộ, sao chép vào `frontend/user/src/login-user.test.js` rồi `npx react-scripts test --watchAll=false login-user` (CRA chỉ quét `src/` và `*.test.js`).
- `App.test.js` ở hai app là file mẫu của CRA, không có giá trị.
- GitHub Actions (`.github/workflows/node.js.yml`) chạy khi push/PR vào `main`:
  - **Backend** (Node 22 và 24): `npm ci` ở `backend/`, `node --check` mọi file `.js`, nạp thử `container.js`. Không có SQL Server trên runner nên không chạy truy vấn thật.
  - **Frontend** (user, admin): `npm ci`, test đăng nhập (chỉ user), `npm run build` với `CI=false`.
  - **AI service**: `pip install -r requirements.txt` và `python -m compileall`.

---

## 8. Quy ước khi thêm chức năng mới

**Backend** – thêm 3 file rồi nối vào `container.js`:
1. `services/admin/XxxService.js` (extends `BaseService`): nghiệp vụ + SQL tham số hóa; mã mới dùng `taoMa('XX')` trong `utils/id.js`, không dùng `Date.now()`.
2. `controllers/admin/XxxController.js` (extends `BaseController`): mỗi action bọc bằng `this.handle(...)`; lấy `maKH`/`maNV`/`maCV` từ `req.auth`, **không** từ body.
3. `routes/admin/XxxRoutes.js` (extends `BaseRoutes`): **bắt buộc** gắn `requireUser` hoặc `requireAdmin(...)` cho mọi route cần đăng nhập (và `requireSelf` nếu URL có `:maKH`). Chỉ để công khai khi thật sự cần (xem mục 2).
4. `container.js`: thêm `require` và `new XxxRoutes(new XxxController(new XxxService(db)))`.
5. Với dữ liệu thuộc về một khách, thêm điều kiện sở hữu vào SQL (`AND maKH = @maKH`).

**Frontend/Admin** – thêm `src/API/XxxApi.js` (extends `BaseApi`), xuất kèm một đối tượng dùng chung, rồi gọi từ component. Dùng `BaseApi` để token được gắn tự động.

---

## 9. Việc còn dang dở và lưu ý

- **Chưa chạy thử đầy đủ** sau khi nối JWT vào toàn hệ thống: hãy khởi động backend, đăng nhập user và admin rồi bấm qua các chức năng chính.
- **Chưa làm:**
  - Tính giá phía server (`PricingService`: flash sale + giá chênh lệch biến thể); hiện `placeOrder` còn phụ thuộc giá do client gửi.
  - Thêm/sửa sản phẩm kèm biến thể, thông số kỹ thuật, hình ảnh – cần tạo bảng `BienTheSanPham`, `ThongSoKyThuat`, `HinhAnhSanPham`.
  - Thay mã dễ trùng trong `KhuyenMaiService` bằng `taoMa(...)`.
- Một số lỗi cũ được giữ nguyên logic khi chuyển sang OOP: SQL của `POST/PUT/DELETE /api/sanpham` dùng cột `tenLSP` có thể không khớp schema; `khuyenmai_admin` gọi `POST /api/admin/khuyenmai/them` nhưng backend chưa có route này.
