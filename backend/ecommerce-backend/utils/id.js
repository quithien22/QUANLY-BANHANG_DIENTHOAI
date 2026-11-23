// file: utils/id.js
// Sinh mã chuỗi KHÔNG trùng cho các bảng dùng khóa chuỗi (maKH, maDoiTra, maHoaDon...).
//
// Trước đây dùng "KH" + 6 số cuối của Date.now() -> cứ 1.000 giây (~17 phút) là lặp lại,
// nên chắc chắn trùng khi dữ liệu nhiều. Mã mới = tiền tố + thời gian (base36, 8 ký tự)
// + 6 ký tự ngẫu nhiên (base36) => 2 + 8 + 6 = 16 ký tự, vừa cột VARCHAR(20).
// Muốn trùng phải cùng mili-giây VÀ cùng 6 ký tự ngẫu nhiên (1 / 2 tỷ).
const crypto = require('crypto');

const BANG_KY_TU = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function chuoiNgauNhien(doDai) {
    const byte = crypto.randomBytes(doDai);
    let kq = '';
    for (let i = 0; i < doDai; i++) kq += BANG_KY_TU[byte[i] % BANG_KY_TU.length];
    return kq;
}

// VD: taoMa('KH') -> 'KHMIK3F2A1Q7ZB04'
function taoMa(tienTo) {
    return tienTo + Date.now().toString(36).toUpperCase().padStart(8, '0') + chuoiNgauNhien(6);
}

// 2627 = vi phạm PRIMARY KEY / UNIQUE constraint, 2601 = vi phạm unique index
const laLoiTrungKhoa = (err) => !!err && (err.number === 2627 || err.number === 2601);

// Chạy thao tác INSERT với mã mới; nếu (rất hiếm) trùng khóa thì sinh mã khác và thử lại.
// thaoTac nhận mã vừa sinh và trả về kết quả.
async function chayVoiMaMoi(tienTo, thaoTac, soLanThu = 3) {
    for (let lan = 1; ; lan++) {
        try {
            return await thaoTac(taoMa(tienTo));
        } catch (err) {
            if (!laLoiTrungKhoa(err) || lan >= soLanThu) throw err;
        }
    }
}

module.exports = { taoMa, chayVoiMaMoi, laLoiTrungKhoa };
