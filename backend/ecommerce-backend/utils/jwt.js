// file: utils/jwt.js
// JWT HS256 tự cài bằng module crypto có sẵn của Node (không thêm thư viện nào,
// nên package.json / package-lock.json giữ nguyên và `npm ci` trên CI không bị lệch).
//
// Token = base64url(header).base64url(payload).base64url(HMAC-SHA256)
// payload: { sub, role, iat, exp }  -  role: 'user' | 'admin'
const crypto = require('crypto');

const TOI_THIEU_KY_TU_BI_MAT = 32;

function layBiMat() {
    const biMat = process.env.JWT_SECRET;
    if (!biMat || biMat.length < TOI_THIEU_KY_TU_BI_MAT) {
        throw new Error(`Thiếu JWT_SECRET (tối thiểu ${TOI_THIEU_KY_TU_BI_MAT} ký tự) trong file .env của backend`);
    }
    return biMat;
}

// "15m" | "12h" | "7d" | "3600" (giây) -> số giây
function docThoiHan(giaTri, macDinhGiay) {
    const m = /^(\d+)\s*([smhd]?)$/i.exec(String(giaTri ?? '').trim());
    if (!m) return macDinhGiay;
    const donVi = { '': 1, s: 1, m: 60, h: 3600, d: 86400 }[m[2].toLowerCase()];
    return Number(m[1]) * donVi;
}

const base64url = (chuoi) => Buffer.from(chuoi).toString('base64url');

function kyChuKy(duLieu, biMat) {
    return crypto.createHmac('sha256', biMat).update(duLieu).digest('base64url');
}

// payload: { sub, role, ... }; thoiHanGiay: số giây token còn hiệu lực
function kyToken(payload, thoiHanGiay) {
    const biMat = layBiMat();
    const bayGio = Math.floor(Date.now() / 1000);
    const phan1 = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const phan2 = base64url(JSON.stringify({ ...payload, iat: bayGio, exp: bayGio + thoiHanGiay }));
    const duLieu = `${phan1}.${phan2}`;
    return `${duLieu}.${kyChuKy(duLieu, biMat)}`;
}

// Trả về payload nếu token hợp lệ + chưa hết hạn, ngược lại trả null (không ném lỗi)
function xacThucToken(token) {
    if (typeof token !== 'string') return null;
    const cacPhan = token.split('.');
    if (cacPhan.length !== 3) return null;

    try {
        const biMat = layBiMat();
        const [phan1, phan2, chuKy] = cacPhan;

        const header = JSON.parse(Buffer.from(phan1, 'base64url').toString('utf8'));
        if (header.alg !== 'HS256') return null; // chặn "alg: none" và các thuật toán khác

        const chuKyDung = Buffer.from(kyChuKy(`${phan1}.${phan2}`, biMat));
        const chuKyGui = Buffer.from(chuKy);
        if (chuKyDung.length !== chuKyGui.length || !crypto.timingSafeEqual(chuKyDung, chuKyGui)) return null;

        const payload = JSON.parse(Buffer.from(phan2, 'base64url').toString('utf8'));
        if (!payload.sub || typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (_) {
        return null;
    }
}

module.exports = { kyToken, xacThucToken, docThoiHan, layBiMat };
