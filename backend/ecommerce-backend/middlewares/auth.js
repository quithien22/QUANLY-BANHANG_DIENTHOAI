// file: middlewares/auth.js
// Xác thực bằng JWT + phân quyền theo chức vụ.
//
// Nguyên tắc: danh tính (maKH, maNV, maCV) CHỈ lấy từ token đã ký (và tra lại DB), KHÔNG tin
// bất kỳ maKH / maNV / maCVNguoiThaoTac nào do client gửi trong body, query hay URL.
//  - Mỗi request tra lại DB để tài khoản bị khóa / đổi chức vụ có hiệu lực ngay (không đợi token hết hạn).
//  - Route công khai (xem sản phẩm, đăng nhập...) KHÔNG gắn middleware nên token sai/hết hạn không ảnh hưởng.
//  - Chỉ gắn middleware theo từng route (không router.use) vì nhiều router mount ở '/api'.
//
// Dùng trong file routes:
//   this.router.post('/them', requireUser(), c.add);
//   this.router.put('/x', requireAdmin(...ROLES.QUAN_TRI), c.sua);   // chỉ Giám đốc + Quản lý
//   this.router.get('/y', requireAdmin(), c.xem);                    // mọi nhân viên đang hoạt động
const { xacThucToken, kyToken, docThoiHan } = require('../utils/jwt');

const ROLES = {
    GIAM_DOC: 'CV01',
    QUAN_LY: 'CV02',
    NHAN_VIEN: 'CV03',
};
ROLES.QUAN_TRI = [ROLES.GIAM_DOC, ROLES.QUAN_LY]; // Giám đốc + Quản lý

let dbDungChung = null;

// Gọi 1 lần trong container.js trước khi dựng route
function configureAuth(db) {
    dbDungChung = db;
}

// ---------------- Phát token ----------------
const HAN_TOKEN_KHACH_GIAY = () => docThoiHan(process.env.JWT_EXPIRES_IN, 7 * 86400);
const HAN_TOKEN_NHAN_VIEN_GIAY = () => docThoiHan(process.env.JWT_ADMIN_EXPIRES_IN, 12 * 3600);

const phatTokenKhach = (maKH) => kyToken({ sub: maKH, role: 'user' }, HAN_TOKEN_KHACH_GIAY());
const phatTokenNhanVien = (maNV) => kyToken({ sub: maNV, role: 'admin' }, HAN_TOKEN_NHAN_VIEN_GIAY());

// ---------------- Tiện ích ----------------
function layToken(req) {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    return m ? m[1].trim() : null;
}

// `code` giúp frontend phân biệt "phiên hết hạn" (TOKEN_INVALID -> đăng xuất) với các lỗi khác
function tuChoi(res, status, code, message) {
    return res.status(status).json({ success: false, code, message });
}

const tokenKhongHopLe = (res) =>
    tuChoi(res, 401, 'TOKEN_INVALID', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại.');

const biKhoa = (trangThai) => trangThai === false || trangThai === 0 || trangThai === '0' || trangThai === 'da_khoa';

async function timKhach(maKH) {
    const sql = dbDungChung.sql;
    const pool = await dbDungChung.getPool();
    const kq = await pool.request()
        .input('maKH', sql.VarChar(20), maKH)
        .query('SELECT maKH, trangThai FROM KhachHang WHERE maKH = @maKH');
    return kq.recordset[0] || null;
}

async function timNhanVien(maNV) {
    const sql = dbDungChung.sql;
    const pool = await dbDungChung.getPool();
    const kq = await pool.request()
        .input('maNV', sql.VarChar(20), maNV)
        .query('SELECT maNV, maCV, trangThai FROM NhanVien WHERE maNV = @maNV');
    return kq.recordset[0] || null;
}

// ---------------- Middleware ----------------

// Khách hàng đã đăng nhập -> req.auth = { role: 'user', maKH }
function requireUser() {
    return async (req, res, next) => {
        try {
            const payload = xacThucToken(layToken(req));
            if (!payload || payload.role !== 'user') return tokenKhongHopLe(res);

            const khach = await timKhach(String(payload.sub));
            if (!khach) return tokenKhongHopLe(res);
            if (biKhoa(khach.trangThai)) {
                return tuChoi(res, 403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!');
            }

            req.auth = { role: 'user', maKH: khach.maKH };
            next();
        } catch (err) {
            console.error('Lỗi xác thực khách hàng:', err);
            tuChoi(res, 500, 'AUTH_ERROR', 'Lỗi hệ thống, vui lòng thử lại sau!');
        }
    };
}

// Chỉ cho khách xem/sửa dữ liệu của CHÍNH MÌNH: tham số URL (mặc định :maKH) phải trùng với token.
// Gắn SAU requireUser().
function requireSelf(tenThamSo = 'maKH') {
    return (req, res, next) => {
        if (!req.auth || String(req.params[tenThamSo]) !== req.auth.maKH) {
            return tuChoi(res, 403, 'FORBIDDEN', 'Bạn không có quyền truy cập dữ liệu của người khác.');
        }
        next();
    };
}

// Nhân viên đang hoạt động -> req.auth = { role: 'admin', maNV, maCV }  (maCV lấy từ DB, không từ token)
// Truyền danh sách mã chức vụ được phép; không truyền = mọi nhân viên.
function requireAdmin(...dsChucVu) {
    const duocPhep = new Set(dsChucVu.flat());
    return async (req, res, next) => {
        try {
            const payload = xacThucToken(layToken(req));
            if (!payload || payload.role !== 'admin') return tokenKhongHopLe(res);

            const nv = await timNhanVien(String(payload.sub));
            if (!nv) return tokenKhongHopLe(res);
            if (biKhoa(nv.trangThai)) {
                return tuChoi(res, 403, 'ACCOUNT_LOCKED', 'Tài khoản nhân viên đã bị khóa!');
            }
            if (duocPhep.size > 0 && !duocPhep.has(nv.maCV)) {
                return tuChoi(res, 403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
            }

            req.auth = { role: 'admin', maNV: nv.maNV, maCV: nv.maCV };
            next();
        } catch (err) {
            console.error('Lỗi xác thực nhân viên:', err);
            tuChoi(res, 500, 'AUTH_ERROR', 'Lỗi hệ thống, vui lòng thử lại sau!');
        }
    };
}

// Route công khai nhưng nếu có token nhân viên hợp lệ thì gắn req.auth (VD: GET /api/caidat trả thêm hồ sơ).
// Token sai / thiếu -> coi như khách vãng lai, không báo lỗi.
function optionalAdmin() {
    return async (req, res, next) => {
        try {
            const payload = xacThucToken(layToken(req));
            if (payload && payload.role === 'admin') {
                const nv = await timNhanVien(String(payload.sub));
                if (nv && !biKhoa(nv.trangThai)) {
                    req.auth = { role: 'admin', maNV: nv.maNV, maCV: nv.maCV };
                }
            }
        } catch (err) {
            console.error('Lỗi xác thực tùy chọn:', err);
        }
        next();
    };
}

module.exports = {
    ROLES,
    configureAuth,
    phatTokenKhach,
    phatTokenNhanVien,
    requireUser,
    requireSelf,
    requireAdmin,
    optionalAdmin,
};
