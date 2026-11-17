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
        if (!tuKhoa) return [];

        const pool = await this.getPool();
        const result = await pool.request()
            .input('tuKhoa', sql.VarChar, `%${tuKhoa}%`)
            .query(`
                SELECT maSP, tenSP, giaBan, hinhAnh 
                FROM SanPham 
                WHERE tenSP LIKE @tuKhoa
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

        const ketQuaSP = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT sp.*, spfs.giaFlashSale, kgfs.trangThai AS trangThaiFlashSale
                FROM SanPham sp
                LEFT JOIN SanPhamFlashSale spfs ON sp.maSP = spfs.maSP
                LEFT JOIN KhungGioFlashSale kgfs ON spfs.maKhungGio = kgfs.maKhungGio AND kgfs.trangThai = 'dang_dien_ra'
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
