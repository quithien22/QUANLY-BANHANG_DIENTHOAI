// file: services/admin/ThongKeService.js
// Báo cáo & thống kê cho trang admin.
const BaseService = require('../BaseService');

const NGUONG_TON_KHO = 5; // Cùng ngưỡng với trang Quản lý sản phẩm

class ThongKeService extends BaseService {
    // Trả về khoảng thời gian hiện tại và khoảng ngay trước đó (để so sánh % tăng/giảm)
    tinhKhoangThoiGian(khoang) {
        const bay = Date.now();
        const now = new Date();
        const hienTai = { den: new Date(now) };
        const truoc = {};
        const NGAY = 24 * 60 * 60 * 1000;

        if (khoang === '7ngay') {
            hienTai.tu = new Date(bay - 7 * NGAY);
            truoc.den = new Date(hienTai.tu.getTime() - 1000);
            truoc.tu = new Date(truoc.den.getTime() - 7 * NGAY);
        } else if (khoang === 'quynay') {
            const quy = Math.floor(now.getMonth() / 3);
            hienTai.tu = new Date(now.getFullYear(), quy * 3, 1);
            truoc.den = new Date(hienTai.tu.getTime() - 1000);
            truoc.tu = new Date(truoc.den.getFullYear(), Math.floor(truoc.den.getMonth() / 3) * 3, 1);
        } else if (khoang === 'namnay') {
            hienTai.tu = new Date(now.getFullYear(), 0, 1);
            truoc.den = new Date(hienTai.tu.getTime() - 1000);
            truoc.tu = new Date(truoc.den.getFullYear(), 0, 1);
        } else {
            // Mặc định là 30 ngày
            hienTai.tu = new Date(bay - 30 * NGAY);
            truoc.den = new Date(hienTai.tu.getTime() - 1000);
            truoc.tu = new Date(truoc.den.getTime() - 30 * NGAY);
        }
        return { hienTai, truoc };
    }

    async layTongQuan(khoang = '30ngay') {
        const sql = this.sql;
        const pool = await this.getPool();
        const { hienTai, truoc } = this.tinhKhoangThoiGian(khoang);

        const layThongKe = async (tu, den) => {
            const ketQua = await pool.request()
                .input('tu', sql.DateTime, tu)
                .input('den', sql.DateTime, den)
                .query(`
                    SELECT 
                        ISNULL(SUM(CASE WHEN trangThai = 'hoan_tat' THEN tongTien END), 0) AS doanhThu,
                        COUNT(*) AS tongDonHang,
                        ISNULL(AVG(CASE WHEN trangThai = 'hoan_tat' THEN tongTien END), 0) AS giaTriTB,
                        SUM(CASE WHEN trangThai = 'da_huy' THEN 1 ELSE 0 END) AS soDonHuy
                    FROM HoaDon
                    WHERE thoiGianLap BETWEEN @tu AND @den
                `);
            const dong = ketQua.recordset[0];
            const tyLeHuy = dong.tongDonHang > 0 ? (dong.soDonHuy / dong.tongDonHang) * 100 : 0;
            return { ...dong, tyLeHuy };
        };

        const [tkHienTai, tkTruoc] = await Promise.all([
            layThongKe(hienTai.tu, hienTai.den),
            layThongKe(truoc.tu, truoc.den),
        ]);

        const phanTram = (moi, cu) => (!cu ? (moi > 0 ? 100 : 0) : ((moi - cu) / cu) * 100);

        return {
            doanhThu: tkHienTai.doanhThu,
            doanhThuThayDoi: phanTram(tkHienTai.doanhThu, tkTruoc.doanhThu),
            tongDonHang: tkHienTai.tongDonHang,
            tongDonHangThayDoi: phanTram(tkHienTai.tongDonHang, tkTruoc.tongDonHang),
            giaTriTB: tkHienTai.giaTriTB,
            giaTriTBThayDoi: phanTram(tkHienTai.giaTriTB, tkTruoc.giaTriTB),
            tyLeHuy: tkHienTai.tyLeHuy,
            tyLeHuyThayDoi: tkHienTai.tyLeHuy - tkTruoc.tyLeHuy,
        };
    }

    // Dữ liệu biểu đồ doanh thu, nhóm theo ngày / tuần / tháng
    async layDoanhThu(khoang = '30ngay', theo = 'tuan') {
        const sql = this.sql;
        const pool = await this.getPool();
        const { hienTai } = this.tinhKhoangThoiGian(khoang);

        let nhomTheo = `DATEPART(iso_week, thoiGianLap)`;
        if (theo === 'ngay') nhomTheo = `CONVERT(date, thoiGianLap)`;
        if (theo === 'thang') nhomTheo = `FORMAT(thoiGianLap, 'yyyy-MM')`;

        const ketQua = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT ${nhomTheo} AS nhom, SUM(tongTien) AS doanhThu
                FROM HoaDon
                WHERE trangThai = 'hoan_tat' AND thoiGianLap BETWEEN @tu AND @den
                GROUP BY ${nhomTheo}
                ORDER BY nhom
            `);
        return ketQua.recordset;
    }

    async layTopSanPham(khoang = '30ngay') {
        const sql = this.sql;
        const pool = await this.getPool();
        const { hienTai } = this.tinhKhoangThoiGian(khoang);

        const ketQua = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT TOP 5 sp.maSP, sp.tenSP,
                       SUM(ct.soLuong * ct.giaBan) AS doanhThu,
                       SUM(ct.soLuong) AS soLuongBan
                FROM ChiTietHoaDon ct
                JOIN HoaDon hd ON ct.maHoaDon = hd.maHoaDon
                JOIN SanPham sp ON ct.maSP = sp.maSP
                WHERE hd.trangThai = 'hoan_tat' AND hd.thoiGianLap BETWEEN @tu AND @den
                GROUP BY sp.maSP, sp.tenSP
                ORDER BY doanhThu DESC
            `);
        return ketQua.recordset;
    }

    async layHieuQuaKhuyenMai(khoang = '30ngay') {
        const sql = this.sql;
        const pool = await this.getPool();
        const { hienTai } = this.tinhKhoangThoiGian(khoang);

        const ketQua = await pool.request()
            .input('tu', sql.DateTime, hienTai.tu)
            .input('den', sql.DateTime, hienTai.den)
            .query(`
                SELECT km.maKM, km.tenKM, km.ngayBD, km.ngayKT, km.trangThai AS trangThaiBat,
                       COUNT(hd.maHoaDon) AS soDon,
                       ISNULL(SUM(hd.tongTien), 0) AS doanhThu
                FROM KhuyenMai km
                LEFT JOIN HoaDon hd ON hd.maKM = km.maKM AND hd.trangThai = 'hoan_tat'
                    AND hd.thoiGianLap BETWEEN @tu AND @den
                GROUP BY km.maKM, km.tenKM, km.ngayBD, km.ngayKT, km.trangThai
                ORDER BY doanhThu DESC
            `);
        return ketQua.recordset;
    }

    // Sản phẩm còn đang bán nhưng tồn kho thấp, cần nhập gấp
    async layTonKhoCanhBao() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT sp.maSP, sp.tenSP, sp.hinhAnh, sp.tonKho,
                   th.tenThuongHieu, lsp.tenLSP
            FROM SanPham sp
            LEFT JOIN ThuongHieu th ON sp.maThuongHieu = th.maThuongHieu
            LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
            WHERE sp.tonKho <= ${NGUONG_TON_KHO} AND sp.trangThai = 1
            ORDER BY sp.tonKho ASC
        `);
        return ketQua.recordset.map((dong) => ({ ...dong, nguongToiThieu: NGUONG_TON_KHO }));
    }
}

module.exports = ThongKeService;
