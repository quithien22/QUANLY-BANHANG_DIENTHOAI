// file: services/AuthService.js
// Đăng nhập / đăng ký / đăng nhập Google cho khách hàng.
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const axios = require('axios');
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class AuthService extends BaseService {
    // Dạng thông tin trả về chung cho đăng nhập thường và Google
    toUserInfo(user) {
        return { maKH: user.maKH, hoTen: user.hoTen, email: user.email, sdt: user.sdt };
    }

    async login({ taiKhoan, matKhau }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query(`
                SELECT maKH, hoTen, email, sdt, trangThai, matKhau 
                FROM KhachHang 
                WHERE (email = @taiKhoan OR sdt = @taiKhoan) 
            `);

        if (result.recordset.length === 0) {
            throw new HttpError(401, "Tài khoản không chính xác!");
        }

        const user = result.recordset[0];
        let isMatch = false;

        // Hỗ trợ cả mật khẩu đã băm (bcrypt) và mật khẩu cũ chưa băm
        if (user.matKhau && (user.matKhau.startsWith('$2a$') || user.matKhau.startsWith('$2b$'))) {
            isMatch = await bcrypt.compare(matKhau, user.matKhau);
        } else {
            isMatch = (matKhau === user.matKhau);

            // Đăng nhập đúng với mật khẩu cũ -> tự động băm và lưu đè để nâng cấp bảo mật
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                const hashedMatKhau = await bcrypt.hash(matKhau, salt);
                await pool.request()
                    .input('maKH', sql.VarChar, user.maKH)
                    .input('matKhauMoi', sql.VarChar, hashedMatKhau)
                    .query(`UPDATE KhachHang SET matKhau = @matKhauMoi WHERE maKH = @maKH`);
            }
        }

        if (!isMatch) {
            throw new HttpError(401, "Mật khẩu không chính xác!");
        }

        if (user.trangThai == 0) {
            throw new HttpError(403, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!");
        }

        if (
            user.trangThai === 0 ||
            user.trangThai === '0' ||
            user.trangThai === 'da_khoa' ||
            user.trangThai === 'Đã khóa (Chặn)'
        ) {
            throw new HttpError(403, "Tài khoản của bạn đã bị khóa bởi quản trị viên!");
        }

        return this.toUserInfo(user);
    }

    async register({ taiKhoan, matKhau }) {
        const sql = this.sql;
        const pool = await this.getPool();

        if (!taiKhoan || !matKhau) {
            throw new HttpError(400, "Vui lòng nhập đầy đủ thông tin!");
        }

        // 1. Tài khoản (email hoặc sdt) đã tồn tại chưa?
        const checkExist = await pool.request()
            .input('taiKhoan', sql.VarChar, taiKhoan)
            .query("SELECT maKH FROM KhachHang WHERE email = @taiKhoan OR SDT = @taiKhoan");

        if (checkExist.recordset.length > 0) {
            throw new HttpError(400, "Email hoặc số điện thoại này đã được đăng ký!");
        }

        // 2. Phân loại email / số điện thoại
        const isEmail = taiKhoan.includes("@");
        const emailVal = isEmail ? taiKhoan : null;
        const sdtVal = !isEmail ? taiKhoan : null;

        // 3. Băm mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedMatKhau = await bcrypt.hash(matKhau, salt);

        // 4. Sinh mã khách hàng mới
        const maKH_Moi = "KH" + Date.now().toString().slice(-6);

        await pool.request()
            .input('maKH', sql.VarChar(20), maKH_Moi)
            .input('hoTen', sql.NVarChar(50), "Khách hàng mới")
            .input('email', sql.VarChar(255), emailVal)
            .input('SDT', sql.VarChar(15), sdtVal)
            .input('matKhau', sql.VarChar(255), hashedMatKhau)
            .input('diemTichLuy', sql.Int, 0)
            .input('tongDonHang', sql.Int, 0)
            .input('trangThai', sql.Bit, 1)
            .query(`
                INSERT INTO KhachHang 
                    (maKH, hoTen, email, SDT, matKhau, diemTichLuy, tongDonHang, trangThai)
                VALUES 
                    (@maKH, @hoTen, @email, @SDT, @matKhau, @diemTichLuy, @tongDonHang, @trangThai)
            `);
    }

    // Frontend gửi accessToken lấy từ Google. Backend hỏi lại Google để xác thực,
    // KHÔNG tin dữ liệu do frontend tự gửi.
    async loginGoogle({ accessToken }) {
        const sql = this.sql;
        const googleClientId = process.env.GOOGLE_CLIENT_ID;

        if (!accessToken) {
            throw new HttpError(400, "Thiếu mã xác thực Google!");
        }
        if (!googleClientId) {
            console.error("Chua cau hinh GOOGLE_CLIENT_ID trong file .env cua backend");
            throw new HttpError(500, "Máy chủ chưa cấu hình đăng nhập Google!");
        }

        // 1. Xác thực token với Google + kiểm tra token cấp cho ĐÚNG app này
        let tokenInfo, profile;
        try {
            const r1 = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { access_token: accessToken } });
            tokenInfo = r1.data;

            const r2 = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            profile = r2.data;
        } catch (e) {
            throw new HttpError(401, "Xác thực Google thất bại hoặc đã hết hạn, vui lòng thử lại!");
        }

        if (tokenInfo.aud !== googleClientId && tokenInfo.azp !== googleClientId) {
            throw new HttpError(401, "Mã xác thực Google không thuộc ứng dụng này!");
        }
        if (!profile.email || String(profile.email_verified) !== 'true') {
            throw new HttpError(401, "Email Google chưa được xác minh!");
        }

        const email = profile.email.toLowerCase();
        const pool = await this.getPool();

        // 2. Tìm khách hàng theo email
        const result = await pool.request()
            .input('email', sql.VarChar(255), email)
            .query(`SELECT maKH, hoTen, email, sdt, trangThai FROM KhachHang WHERE email = @email`);

        let user;
        if (result.recordset.length > 0) {
            user = result.recordset[0];

            if (
                user.trangThai == 0 ||
                user.trangThai === 'da_khoa' ||
                user.trangThai === 'Đã khóa (Chặn)'
            ) {
                throw new HttpError(403, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!");
            }
        } else {
            // 3. Chưa có tài khoản -> tự tạo mới (mật khẩu ngẫu nhiên)
            const matKhauNgauNhien = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            const maKH_Moi = "KH" + Date.now().toString().slice(-6);
            const hoTen = (profile.name || "Khách hàng mới").substring(0, 50);

            await pool.request()
                .input('maKH', sql.VarChar(20), maKH_Moi)
                .input('hoTen', sql.NVarChar(50), hoTen)
                .input('email', sql.VarChar(255), email)
                .input('SDT', sql.VarChar(15), null)
                .input('matKhau', sql.VarChar(255), matKhauNgauNhien)
                .input('diemTichLuy', sql.Int, 0)
                .input('tongDonHang', sql.Int, 0)
                .input('trangThai', sql.Bit, 1)
                .query(`
                    INSERT INTO KhachHang
                        (maKH, hoTen, email, SDT, matKhau, diemTichLuy, tongDonHang, trangThai)
                    VALUES
                        (@maKH, @hoTen, @email, @SDT, @matKhau, @diemTichLuy, @tongDonHang, @trangThai)
                `);

            user = { maKH: maKH_Moi, hoTen: hoTen, email: email, sdt: null };
        }

        return this.toUserInfo(user);
    }
}

module.exports = AuthService;
