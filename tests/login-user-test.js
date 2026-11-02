/* eslint-disable */
// =====================================================================
// TEST CASE: ĐĂNG NHẬP USER - KIỂM TRA ĐẦU VÀO (Email/SĐT + Mật khẩu)
// Component : frontend/user/src/pages/login/login.js
// Công cụ   : Jest + React Testing Library (đã có sẵn trong frontend/user)
//
// CÁCH CHẠY
//   react-scripts (CRA) chỉ quét thư mục src/ và chỉ nhận tên *.test.js, nên:
//   1) Copy file này vào frontend/user/src/ và đổi tên thành login-user.test.js
//   2) cd frontend/user
//      npm test -- --watchAll=false login-user
//   (File tự nhận ra nó đang nằm ở tests/ hay ở src/ để tìm đúng đường dẫn.)
//
// QUY ƯỚC
//   - Test có tiền tố [BUG] mô tả hành vi ĐÚNG mong muốn; với code hiện tại
//     các test này sẽ FAIL cho tới khi sửa login.js (xem danh sách cuối file).
//   - API đăng nhập, Swal, router, Footer, nút Google đều được mock;
//     chỉ kiểm tra hành vi của form.
//
// CÁC CASE KHÔNG NẰM TRONG FILE NÀY (thuộc tầng API/DB, test bằng Postman
// hoặc supertest vì cần database thật):
//   TC-29 Tài khoản bị khóa + mật khẩu sai -> 401 "Mật khẩu không chính xác!"
//   TC-30 Mật khẩu cũ chưa băm, nhập đúng -> thành công và DB được băm lại bcrypt
//   TC-31 Tài khoản tạo bằng Google, đăng nhập bằng mật khẩu bất kỳ -> 401
//   TC-33 POST /api/user/dang-nhap thiếu matKhau -> nên là 400 (hiện là 500)
// =====================================================================

const fs = require('fs');
const path = require('path');

// ---- Tìm thư mục frontend/user dù file nằm ở tests/ hay src/ ----
const DANG_O_TESTS = fs.existsSync(path.join(__dirname, '..', 'frontend', 'user', 'package.json'));
const FE_ROOT = DANG_O_TESTS ? path.join(__dirname, '..', 'frontend', 'user') : path.join(__dirname, '..');
const FE_SRC = path.join(FE_ROOT, 'src');
const nm = (ten) => path.join(FE_ROOT, 'node_modules', ten);

// ---- MOCK (phải khai báo trước khi require component) ----
const mockNavigate = jest.fn();

jest.doMock(path.join(FE_SRC, 'API', 'AuthApi'), () => ({
    __esModule: true,
    default: class {},
    authApi: { login: jest.fn() },
}));

jest.doMock(nm('sweetalert2'), () => ({
    __esModule: true,
    default: { fire: jest.fn() },
}));

jest.doMock(nm('react-router-dom'), () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));

jest.doMock(path.join(FE_SRC, 'pages', 'footer', 'footer'), () => ({
    __esModule: true,
    default: () => null,
}));

jest.doMock(path.join(FE_SRC, 'pages', 'login', 'login_google'), () => ({
    __esModule: true,
    default: () => null,
}));

const React = require(nm('react'));
const { render, screen, fireEvent, waitFor } = require(nm('@testing-library/react'));
const userEventModule = require(nm('@testing-library/user-event'));
const userEvent = userEventModule.default || userEventModule;

const Login = require(path.join(FE_SRC, 'pages', 'login', 'login')).default;
const { authApi } = require(path.join(FE_SRC, 'API', 'AuthApi'));
const Swal = require(nm('sweetalert2')).default;

// ---- Thông báo lỗi của form (khớp với login.js) ----
const MSG_THIEU = 'Vui lòng nhập đầy đủ Email/Số điện thoại và mật khẩu!';
const MSG_DUOI_EMAIL = 'Vui lòng sử dụng tài khoản Email có đuôi @gmail.com!';
const MSG_SDT = 'Tài khoản không hợp lệ (Phải là SĐT 10 số hoặc Email @gmail.com)!';
const MSG_MK_NGAN = 'Mật khẩu phải có ít nhất 6 ký tự!';
const MSG_MAT_KET_NOI = 'Lỗi kết nối đến máy chủ!';

const USER_INFO = { maKH: 'KH000001', hoTen: 'Nguyen Van A', email: 'user@gmail.com', sdt: '0912345678' };

// ---- Hàm tiện ích ----
const manHinh = () => render(React.createElement(Login));
const oTaiKhoan = () => screen.getByPlaceholderText('Email / SDT');
const oMatKhau = () => screen.getByPlaceholderText('Mật khẩu');
const nutDangNhap = () => screen.getByRole('button', { name: 'Đăng nhập' });
const oGhiNho = () => screen.getByLabelText('Ghi nhớ đăng nhập');

function nhapTaiKhoanVaMatKhau(taiKhoan, matKhau) {
    fireEvent.change(oTaiKhoan(), { target: { value: taiKhoan } });
    fireEvent.change(oMatKhau(), { target: { value: matKhau } });
}

function nhapVaDangNhap(taiKhoan, matKhau) {
    nhapTaiKhoanVaMatKhau(taiKhoan, matKhau);
    fireEvent.click(nutDangNhap());
}

const serverTraThanhCong = () => authApi.login.mockResolvedValue({ success: true, userInfo: USER_INFO });
const serverBaoLoi = (message) => authApi.login.mockRejectedValue({ response: { data: { message } } });
const thayThongBao = (noiDung) => screen.queryByText(noiDung) !== null;
const testBug = (ten, fn) => test('[BUG] ' + ten, fn);

// Case bị chặn ngay ở frontend: hiện đúng thông báo và KHÔNG gọi API
function expectBiChanBoiFrontend(taiKhoan, matKhau, thongBao) {
    manHinh();
    nhapVaDangNhap(taiKhoan, matKhau);
    expect(thayThongBao(thongBao)).toBe(true);
    expect(authApi.login).not.toHaveBeenCalled();
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authApi.login.mockReset();
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({});
    mockNavigate.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {}); // login.js có console.error(error)
});

afterEach(() => {
    console.error.mockRestore();
});

// =====================================================================
// A. Ô TÀI KHOẢN (Email / SĐT)
// =====================================================================
describe('A. Ô tài khoản (Email / SĐT)', () => {
    test('TC-01: Email hợp lệ + mật khẩu đúng -> thành công, lưu userData, chuyển /home', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap('user@gmail.com', '123456');

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
        expect(authApi.login).toHaveBeenCalledWith('user@gmail.com', '123456');
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }));
        expect(JSON.parse(localStorage.getItem('userData'))).toEqual(USER_INFO);
        expect(sessionStorage.getItem('phienDangNhap')).toBe('1');
    });

    test('TC-02: SĐT hợp lệ + mật khẩu đúng -> thành công', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap('0912345678', '123456');

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
        expect(authApi.login).toHaveBeenCalledWith('0912345678', '123456');
    });

    test.each([
        ['TC-03', 'tài khoản để trống', '', '123456', MSG_THIEU],
        ['TC-04', 'tài khoản chỉ toàn dấu cách', '   ', '123456', MSG_THIEU],
        ['TC-05', 'email sai đuôi (@yahoo.com)', 'abc@yahoo.com', '123456', MSG_DUOI_EMAIL],
        ['TC-08', 'SĐT thiếu số (9 số)', '091234567', '123456', MSG_SDT],
        ['TC-09', 'SĐT thừa số (11 số)', '09123456789', '123456', MSG_SDT],
        ['TC-10a', 'SĐT sai đầu số 02', '0212345678', '123456', MSG_SDT],
        ['TC-10b', 'SĐT sai đầu số 01', '0112345678', '123456', MSG_SDT],
        ['TC-11', 'SĐT có chữ cái', '09123abc78', '123456', MSG_SDT],
    ])('%s: %s -> báo lỗi, không gọi API', (ma, mota, taiKhoan, matKhau, thongBao) => {
        expectBiChanBoiFrontend(taiKhoan, matKhau, thongBao);
    });

    test('TC-06: Email viết hoa (ABC@GMAIL.COM) -> qua kiểm tra frontend, gửi lên server', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap('ABC@GMAIL.COM', '123456');

        await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('ABC@GMAIL.COM', '123456'));
        expect(thayThongBao(MSG_DUOI_EMAIL)).toBe(false);
    });

    testBug('TC-07: "@gmail.com" (thiếu phần tên) phải bị chặn ở frontend', () => {
        manHinh();
        nhapVaDangNhap('@gmail.com', '123456');
        expect(authApi.login).not.toHaveBeenCalled();
    });

    testBug('TC-12: SĐT chứa ký tự "|" (0|12345678) phải báo không hợp lệ', () => {
        expectBiChanBoiFrontend('0|12345678', '123456', MSG_SDT);
    });

    testBug('TC-13: SĐT 12 số lặp đầu số (030312345678) phải báo không hợp lệ', () => {
        expectBiChanBoiFrontend('030312345678', '123456', MSG_SDT);
    });

    testBug('TC-14: SĐT có dấu cách đầu/cuối phải được tự cắt rồi mới gửi', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap(' 0912345678 ', '123456');

        await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('0912345678', '123456'));
    });

    testBug('TC-15: Email có dấu cách đầu phải được tự cắt rồi mới gửi', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap(' abc@gmail.com', '123456');

        await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('abc@gmail.com', '123456'));
    });

    test.each([
        ['TC-16', 'chuỗi SQL injection trá hình email', "' OR 1=1 --@gmail.com"],
        ['TC-17', 'tài khoản rất dài (300 ký tự)', 'a'.repeat(300) + '@gmail.com'],
    ])('%s: %s -> gửi nguyên vẹn, server trả 401, form hiện lỗi và không crash', async (ma, mota, taiKhoan) => {
        serverBaoLoi('Tài khoản không chính xác!');
        manHinh();
        nhapVaDangNhap(taiKhoan, '123456');

        expect(await screen.findByText('Tài khoản không chính xác!')).not.toBeNull();
        expect(authApi.login).toHaveBeenCalledWith(taiKhoan, '123456');
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

// =====================================================================
// B. Ô MẬT KHẨU
// =====================================================================
describe('B. Ô mật khẩu', () => {
    test.each([
        ['TC-18', 'mật khẩu để trống', '', MSG_THIEU],
        ['TC-19', 'mật khẩu chỉ toàn dấu cách', '      ', MSG_THIEU],
        ['TC-20', 'mật khẩu 5 ký tự (dưới biên)', '12345', MSG_MK_NGAN],
    ])('%s: %s -> báo lỗi, không gọi API', (ma, mota, matKhau, thongBao) => {
        expectBiChanBoiFrontend('user@gmail.com', matKhau, thongBao);
    });

    test('TC-21: Mật khẩu đúng 6 ký tự (biên) -> qua frontend, gọi API', async () => {
        serverTraThanhCong();
        manHinh();
        nhapVaDangNhap('user@gmail.com', '123456');

        await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('user@gmail.com', '123456'));
        expect(thayThongBao(MSG_MK_NGAN)).toBe(false);
    });

    test('TC-22: Mật khẩu sai -> hiện thông báo 401 từ server, không chuyển trang', async () => {
        serverBaoLoi('Mật khẩu không chính xác!');
        manHinh();
        nhapVaDangNhap('user@gmail.com', 'saimatkhau');

        expect(await screen.findByText('Mật khẩu không chính xác!')).not.toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(localStorage.getItem('userData')).toBeNull();
    });

    test('TC-23: Mật khẩu phân biệt hoa/thường -> gửi đúng nguyên văn lên server', async () => {
        serverBaoLoi('Mật khẩu không chính xác!');
        manHinh();
        nhapVaDangNhap('user@gmail.com', 'ABC123');

        await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('user@gmail.com', 'ABC123'));
        expect(await screen.findByText('Mật khẩu không chính xác!')).not.toBeNull();
    });

    test.each([
        ['TC-24a', 'mật khẩu rất dài (1000 ký tự)', 'x'.repeat(1000)],
        ['TC-24b', 'mật khẩu dạng SQL injection', "' OR '1'='1"],
    ])('%s: %s -> không crash, server trả 401', async (ma, mota, matKhau) => {
        serverBaoLoi('Mật khẩu không chính xác!');
        manHinh();
        nhapVaDangNhap('user@gmail.com', matKhau);

        expect(await screen.findByText('Mật khẩu không chính xác!')).not.toBeNull();
        expect(authApi.login).toHaveBeenCalledWith('user@gmail.com', matKhau);
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('TC-25: Ô mật khẩu ẩn ký tự (type=password)', () => {
        manHinh();
        expect(oMatKhau().type).toBe('password');
    });
});

// =====================================================================
// C. KẾT HỢP VÀ PHẢN HỒI TỪ SERVER
// =====================================================================
describe('C. Kết hợp và phản hồi từ server', () => {
    test('TC-26: Cả hai ô trống -> báo thiếu thông tin', () => {
        expectBiChanBoiFrontend('', '', MSG_THIEU);
    });

    test('TC-27: Tài khoản chưa đăng ký -> hiện thông báo 401 từ server', async () => {
        serverBaoLoi('Tài khoản không chính xác!');
        manHinh();
        nhapVaDangNhap('0987654321', '123456');

        expect(await screen.findByText('Tài khoản không chính xác!')).not.toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('TC-28: Tài khoản bị khóa -> hiện thông báo 403 từ server', async () => {
        serverBaoLoi('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!');
        manHinh();
        nhapVaDangNhap('user@gmail.com', '123456');

        expect(await screen.findByText('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!')).not.toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('TC-32: Mất kết nối server -> "Lỗi kết nối đến máy chủ!"', async () => {
        authApi.login.mockRejectedValue(new Error('Network Error'));
        manHinh();
        nhapVaDangNhap('user@gmail.com', '123456');

        expect(await screen.findByText(MSG_MAT_KET_NOI)).not.toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('TC-32b: Server lỗi 500 -> hiện thông báo lỗi hệ thống', async () => {
        serverBaoLoi('Lỗi hệ thống, vui lòng thử lại sau!');
        manHinh();
        nhapVaDangNhap('user@gmail.com', '123456');

        expect(await screen.findByText('Lỗi hệ thống, vui lòng thử lại sau!')).not.toBeNull();
    });

    test('TC-34: Nhấn Enter ở ô mật khẩu -> chỉ gửi đúng 1 request', async () => {
        serverTraThanhCong();
        manHinh();
        fireEvent.change(oTaiKhoan(), { target: { value: 'user@gmail.com' } });
        userEvent.type(oMatKhau(), '123456{enter}');

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
        expect(authApi.login).toHaveBeenCalledTimes(1);
    });

    testBug('TC-35: Bấm Đăng nhập 2 lần liên tiếp khi đang chờ server -> chỉ gửi 1 request', () => {
        authApi.login.mockReturnValue(new Promise(() => {})); // server chưa trả lời
        manHinh();
        nhapTaiKhoanVaMatKhau('user@gmail.com', '123456');
        fireEvent.click(nutDangNhap());
        fireEvent.click(nutDangNhap());

        expect(authApi.login).toHaveBeenCalledTimes(1);
    });

    test('Lỗi cũ được xóa khi bấm đăng nhập lại', async () => {
        manHinh();
        nhapVaDangNhap('', '');
        expect(thayThongBao(MSG_THIEU)).toBe(true);

        serverTraThanhCong();
        nhapVaDangNhap('user@gmail.com', '123456');
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
        expect(thayThongBao(MSG_THIEU)).toBe(false);
    });
});

 

// =====================================================================
// CÁCH SỬA CÁC TEST [BUG] trong login.js
//   - TC-12, TC-13 : regex SĐT  ->  /^0[35789][0-9]{8}$/
//   - TC-07        : email      ->  /^[^\s@]+@gmail\.com$/i
//   - TC-14, TC-15 : đầu hàm xuLyDangNhap thêm  const tk = taiKhoan.trim();
//                    rồi dùng tk để kiểm tra và gọi authApi.login(tk, matKhau)
//   - TC-35        : thêm state dangGui, return sớm nếu đang gửi, và
//                    disabled nút "Đăng nhập" trong lúc chờ server
// =====================================================================
