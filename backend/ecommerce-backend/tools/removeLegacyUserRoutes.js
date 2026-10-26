// Xóa các route phía user đã được chuyển sang kiến trúc OOP khỏi server.js.
// Cách dùng (chạy trong thư mục backend/ecommerce-backend):
//     node tools/removeLegacyUserRoutes.js --dry-run  -> chỉ in ra sẽ xóa gì, không ghi file
//     node tools/removeLegacyUserRoutes.js            -> xóa thật (tự tạo server.backup.js trước)
const fs = require('fs');
const path = require('path');

const SERVER = path.join(__dirname, '..', 'server.js');
const BACKUP = path.join(__dirname, '..', 'server.backup.js');
const DRY = process.argv.includes('--dry-run');

// [method, path, lần xuất hiện cần xóa]. 'last' dành cho 2 route bị khai báo 2 lần
// (bản đầu của admin đang chạy thật, bản sau là bản user bị che nên mới xóa).
const TARGETS = [
    ['post', '/api/user/dang-nhap'], ['post', '/api/user/dang-ky'], ['post', '/api/user/dang-nhap-google'],
    ['get', '/api/khachhang/:maKH'], ['put', '/api/user/cap-nhat-info'], ['put', '/api/user/doi-mat-khau'],
    ['get', '/api/user/danhmuc'], ['get', '/api/sanpham/loai-san-pham/:maLSP'], ['get', '/api/sanpham/tim-kiem'],
    ['get', '/api/sanpham/thuonghieu/:tenHang'], ['get', '/api/sanpham/chitiet/:maSP'],
    ['get', '/api/user/khuyenmai'], ['post', '/api/khuyenmai/ap-dung'],
    ['get', '/api/caidat/banner'], ['get', '/api/faq'],
    ['post', '/api/hoadon/dat-hang'], ['put', '/api/hoadon/huy-don/:maHoaDon'], ['get', '/api/hoadon/khachhang/:maKH'],
    ['get', '/api/hoadon/lich-su/:maKH'], ['get', '/api/hoadon/chi-tiet/:maHoaDon'],
    ['post', '/api/payment/momo'], ['post', '/api/payment/momo-ipn'], ['post', '/api/payment/momo-xacnhan'],
    ['post', '/api/yeuthich/toggle'], ['get', '/api/yeuthich/:maKH'],
    ['get', '/api/danhgia/:maSP'], ['post', '/api/danhgia/them'], ['put', '/api/danhgia/sua/:maDanhGia'],
    ['delete', '/api/danhgia/xoa/:maDanhGia'],
    ['post', '/api/user/doitrahang/tao'], ['get', '/api/user/doitrahang/:maKH'],
    ['get', '/api/diachi/:maKH'], ['post', '/api/diachi/them'], ['put', '/api/diachi/sua/:maDiaChi'],
    ['delete', '/api/diachi/xoa/:maDiaChi'],
    ['get', '/api/sanpham', 'last'], ['get', '/api/thuonghieu', 'last'],
    ['get', '/api/giohang/:maKH'], ['post', '/api/giohang/them'],
    ['put', '/api/giohang/capnhat-soluong/:maGioHang'], ['delete', '/api/giohang/:maGioHang'],
];

const src = fs.readFileSync(SERVER, 'utf8');
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const lines = src.split(/\r?\n/);

const startRe = (m, p) => new RegExp(
    '^app\\.' + m + "\\(\\s*['\"`]" + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"`]\\s*[,)]");

const remove = new Set();
const report = [];

for (const [method, p, which] of TARGETS) {
    const re = startRe(method, p);
    const hits = [];
    lines.forEach((l, i) => { if (re.test(l)) hits.push(i); });

    if (hits.length === 0) { report.push(`- bỏ qua (không thấy, có thể đã xóa): ${method.toUpperCase()} ${p}`); continue; }
    if (hits.length > 1 && which !== 'last') { report.push(`! BỎ QUA vì khai báo ${hits.length} lần, cần xem tay: ${method.toUpperCase()} ${p}`); continue; }
    if (which === 'last' && hits.length < 2) { report.push(`! BỎ QUA ${method.toUpperCase()} ${p}: chỉ có 1 bản (đang chạy thật), giữ nguyên`); continue; }

    const start = which === 'last' ? hits[hits.length - 1] : hits[0];

    // Tìm dòng kết thúc "});" ở cột 0; hủy nếu gặp route khác trước đó
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
        if (/^app\.(get|post|put|delete|patch|use|listen)\(/.test(lines[i])) break;
        if (lines[i] === '});') { end = i; break; }
    }
    if (end === -1 || end - start > 400) { report.push(`! BỎ QUA (không xác định được điểm kết thúc): ${method.toUpperCase()} ${p}`); continue; }

    // Lấy luôn các dòng chú thích "//" nằm liền ngay phía trên
    let from = start;
    while (from > 0 && /^\s*\/\//.test(lines[from - 1])) from--;
    // Và 1 dòng trống ngay sau
    let to = end;
    if (lines[to + 1] !== undefined && lines[to + 1].trim() === '') to++;

    for (let i = from; i <= to; i++) remove.add(i);
    report.push(`+ xóa ${method.toUpperCase()} ${p}  (dòng ${from + 1}-${end + 1})`);
}

console.log(report.join('\n'));
console.log(`\nTổng cộng sẽ xóa ${remove.size} dòng / ${lines.length} dòng.`);

if (DRY) { console.log('(dry-run: chưa ghi gì)'); process.exit(0); }

fs.copyFileSync(SERVER, BACKUP);
const out = lines.filter((_, i) => !remove.has(i)).join(eol);
fs.writeFileSync(SERVER, out, 'utf8');
console.log(`Đã ghi server.js mới. Bản gốc được sao lưu ở: ${BACKUP}`);
