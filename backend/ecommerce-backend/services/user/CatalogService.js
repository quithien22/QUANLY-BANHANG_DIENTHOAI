// file: services/CatalogService.js
// Danh mục, thương hiệu, sản phẩm phía user.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

const chuanHoa = (s) => String(s ?? '').trim().toLowerCase();

class CatalogService extends BaseService {
    // Danh mục nổi bật ở trang chủ (thương hiệu đang bật)
    async listActiveBrands() {
        const pool = await this.getPool();
        const result = await pool.request().query("SELECT * FROM ThuongHieu WHERE trangThai = 1");
        return result.recordset;
    }

    async listByProductType(maLSP) {
        const sql = this.sql;
        const pool = await this.getPool();
        const result = await pool.request()
            .input('maLSP', sql.VarChar, maLSP)
            .query(`SELECT * FROM SanPham WHERE maLSP = @maLSP AND trangThai = 1`);
        return result.recordset;
    }

    async search(tuKhoa) {
        const sql = this.sql;
        if (!tuKhoa || typeof tuKhoa !== 'string') return [];

        // NVarChar (không phải VarChar) để từ khóa tiếng Việt có dấu không bị đổi thành '?'.
        // Chỉ tìm sản phẩm đang bán; escape % _ [ để khách gõ ký tự đặc biệt không thành ký tự thay thế.
        const tuKhoaThoat = tuKhoa.trim().replace(/[\[%_]/g, (c) => `[${c}]`);
        if (!tuKhoaThoat) return [];

        const pool = await this.getPool();
        const result = await pool.request()
            .input('tuKhoa', sql.NVarChar(200), `%${tuKhoaThoat}%`)
            .query(`
                SELECT sp.maSP, sp.tenSP, sp.giaBan, sp.hinhAnh, lsp.tenLSP
                FROM SanPham sp
                LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
                WHERE sp.tenSP LIKE @tuKhoa AND sp.trangThai = 1
            `);
        return result.recordset;
    }

    // Sản phẩm theo hãng, kèm RAM/ROM để frontend lọc.
    // Hãng của sản phẩm được nhận theo cột SanPham.hang, hoặc theo thương hiệu (maThuongHieu -> ThuongHieu)
    // nếu DB có liên kết đó. Lọc trong code để không phụ thuộc cột nào có/không có.
    // Các truy vấn phụ (biến thể, thông số, đánh giá) lỗi thì chỉ ghi log, vẫn trả danh sách sản phẩm.
    async listByBrand(tenHang) {
        const pool = await this.getPool();
        const dich = chuanHoa(tenHang);

        const result = await pool.request().query(`
            SELECT sp.*, lsp.tenLSP
            FROM SanPham sp
            LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
            WHERE sp.trangThai = 1
            ORDER BY sp.maSP DESC
        `);

        // Tên thương hiệu theo mã (nếu sản phẩm có cột maThuongHieu)
        const tenThuongHieuTheoMa = new Map();
        try {
            const th = await pool.request().query(`SELECT maThuongHieu, tenThuongHieu FROM ThuongHieu`);
            th.recordset.forEach((r) => tenThuongHieuTheoMa.set(String(r.maThuongHieu), r.tenThuongHieu));
        } catch (err) {
            console.error('[Hãng] Không đọc được bảng ThuongHieu:', err.message);
        }

        // "Khác" là giá trị Header dùng cho mục Phụ kiện Công nghệ
        const layTenHang = (sp) => [
            sp.hang,
            sp.tenThuongHieu,
            sp.maThuongHieu != null ? tenThuongHieuTheoMa.get(String(sp.maThuongHieu)) : null,
        ].filter(Boolean).map(chuanHoa);

        const sanPham = result.recordset.filter((sp) => {
            const cacTen = layTenHang(sp);
            if (cacTen.includes(dich)) return true;
            return dich === 'khác' && cacTen.some((t) => /phụ\s*kiện/.test(t));
        });

        if (sanPham.length === 0) {
            const hangDangCo = [...new Set(result.recordset.flatMap(layTenHang))];
            console.warn(`[Hãng] Không có sản phẩm nào cho hãng "${tenHang}" (đang bán: ${result.recordset.length} sản phẩm). Các giá trị hãng hiện có: ${JSON.stringify(hangDangCo)}`);
            return [];
        }

        const dsMaSP = new Set(sanPham.map((sp) => String(sp.maSP)));

        // Dung lượng (ROM) lấy từ biến thể loại 'dungluong'
        const romMap = {};
        const ramMap = {};
        const themGiaTri = (map, maSP, giaTri) => {
            if (!giaTri) return;
            (map[maSP] = map[maSP] || []).push(String(giaTri));
        };

        try {
            const ketQuaBienThe = await pool.request().query(`
                SELECT maSP, giaTri FROM BienTheSanPham WHERE loaiBienThe = 'dungluong'
            `);
            ketQuaBienThe.recordset
                .filter((r) => dsMaSP.has(String(r.maSP)))
                .forEach((r) => themGiaTri(romMap, r.maSP, r.giaTri));
        } catch (err) {
            console.error('[Hãng] Không đọc được biến thể sản phẩm:', err.message);
        }

        // RAM/ROM từ bảng thông số kỹ thuật
        try {
            const ketQuaThongSo = await pool.request().query(`
                SELECT maSP, nhan, giaTri
                FROM ThongSoKyThuat
                WHERE nhan LIKE N'%RAM%' OR nhan LIKE N'%ROM%'
                   OR nhan LIKE N'%nhớ trong%' OR nhan LIKE N'%lưu trữ%'
            `);
            ketQuaThongSo.recordset
                .filter((r) => dsMaSP.has(String(r.maSP)))
                .forEach((r) => {
                    const nhan = String(r.nhan || '');
                    if (/\bram\b/i.test(nhan)) themGiaTri(ramMap, r.maSP, r.giaTri);
                    else if (/\brom\b|bộ nhớ trong|lưu trữ/i.test(nhan)) themGiaTri(romMap, r.maSP, r.giaTri);
                });
        } catch (err) {
            console.error('[Hãng] Không đọc được thông số kỹ thuật:', err.message);
        }

        // Điểm đánh giá trung bình và số lượt đánh giá
        const danhGiaMap = new Map();
        try {
            const dg = await pool.request().query(`
                SELECT maSP, COUNT(*) AS soLuong, AVG(CAST(soSao AS FLOAT)) AS diemTB
                FROM DanhGiaSanPham
                GROUP BY maSP
            `);
            dg.recordset.forEach((r) => danhGiaMap.set(String(r.maSP), r));
        } catch (err) {
            console.error('[Hãng] Không đọc được đánh giá:', err.message);
        }

        sanPham.forEach((sp) => {
            sp.ram = ramMap[sp.maSP] || [];
            sp.rom = romMap[sp.maSP] || [];
            const dg = danhGiaMap.get(String(sp.maSP));
            sp.soLuongDanhGia = dg ? Number(dg.soLuong) || 0 : 0;
            sp.diemDanhGiaTB = dg ? Number(dg.diemTB) || 0 : 0;
        });

        return sanPham;
    }

    // Chi tiết 1 sản phẩm + biến thể (dung lượng, màu sắc) + thông số kỹ thuật
    async getProductDetail(maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        // Giá Flash Sale chỉ áp dụng khi sản phẩm nằm trong khung giờ đang diễn ra NGAY LÚC NÀY
        // (cùng cách tính với PromotionService.getTodayFlashSale: ngày áp dụng là hôm nay + giờ hiện tại nằm trong gioBD..gioKT).
        // Trước đây LEFT JOIN thẳng SanPhamFlashSale nên sản phẩm thuộc BẤT KỲ khung giờ nào (đã hết, chưa tới,
        // ngày khác) cũng bị hiển thị và bán ở giá Flash Sale; thuộc nhiều khung giờ thì còn bị nhân dòng.
        const ketQuaSP = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT sp.*, lsp.tenLSP, fs.giaFlashSale,
                       CASE WHEN fs.giaFlashSale IS NOT NULL THEN 'dang_dien_ra' END AS trangThaiFlashSale
                FROM SanPham sp
                LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
                OUTER APPLY (
                    SELECT TOP 1 spfs.giaFlashSale
                    FROM SanPhamFlashSale spfs
                    JOIN KhungGioFlashSale kgfs ON spfs.maKhungGio = kgfs.maKhungGio
                    WHERE spfs.maSP = sp.maSP
                      AND CAST(kgfs.ngayApDung AS DATE) = CAST(GETDATE() AS DATE)
                      AND CAST(GETDATE() AS TIME) BETWEEN kgfs.gioBD AND kgfs.gioKT
                    ORDER BY spfs.giaFlashSale ASC
                ) fs
                WHERE sp.maSP = @maSP
            `);

        if (ketQuaSP.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy sản phẩm");
        }

        const ketQuaBienThe = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT maBienThe, loaiBienThe, giaTri, giaChenhLech, hinhAnh
                FROM BienTheSanPham
                WHERE maSP = @maSP
            `);

        const ketQuaThongSo = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT nhan, giaTri
                FROM ThongSoKyThuat
                WHERE maSP = @maSP
                ORDER BY thuTu
            `);

        // Điểm trung bình và số lượt đánh giá tính trực tiếp từ bảng đánh giá
        let diemDanhGiaTB = 0;
        let soLuongDanhGia = 0;
        try {
            const ketQuaDanhGia = await pool.request()
                .input('maSP', sql.VarChar(20), maSP)
                .query(`SELECT COUNT(*) AS soLuong, AVG(CAST(soSao AS FLOAT)) AS diemTB FROM DanhGiaSanPham WHERE maSP = @maSP`);
            soLuongDanhGia = Number(ketQuaDanhGia.recordset[0].soLuong) || 0;
            diemDanhGiaTB = Number(ketQuaDanhGia.recordset[0].diemTB) || 0;
        } catch (err) {
            console.error('Lỗi tính điểm đánh giá:', err.message);
        }

        return {
            ...ketQuaSP.recordset[0],
            bienTheDungLuong: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'dungluong'),
            bienTheMauSac: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'mausac'),
            thongSoKyThuat: ketQuaThongSo.recordset,
            diemDanhGiaTB,
            soLuongDanhGia,
        };
    }
}

module.exports = CatalogService;
