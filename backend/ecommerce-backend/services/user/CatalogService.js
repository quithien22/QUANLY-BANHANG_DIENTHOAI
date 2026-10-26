// file: services/CatalogService.js
// Danh mục, thương hiệu, sản phẩm phía user.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

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

    // Sản phẩm theo hãng (cột SanPham.hang), kèm RAM/ROM để frontend lọc
    async listByBrand(tenHang) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('tenHang', sql.NVarChar(50), tenHang)
            .query(`
                SELECT sp.*, lsp.tenLSP
                FROM SanPham sp
                LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
                WHERE sp.hang = @tenHang AND sp.trangThai = 1
                ORDER BY sp.maSP DESC
            `);

        const sanPham = result.recordset;

        if (sanPham.length > 0) {
            // Dung lượng (ROM) lấy từ biến thể loại 'dungluong'
            const ketQuaBienThe = await pool.request()
                .input('tenHang', sql.NVarChar(50), tenHang)
                .query(`
                    SELECT bt.maSP, bt.giaTri
                    FROM BienTheSanPham bt
                    JOIN SanPham sp ON sp.maSP = bt.maSP
                    WHERE sp.hang = @tenHang AND sp.trangThai = 1 AND bt.loaiBienThe = 'dungluong'
                `);

            // RAM/ROM từ bảng thông số kỹ thuật
            const ketQuaThongSo = await pool.request()
                .input('tenHang', sql.NVarChar(50), tenHang)
                .query(`
                    SELECT ts.maSP, ts.nhan, ts.giaTri
                    FROM ThongSoKyThuat ts
                    JOIN SanPham sp ON sp.maSP = ts.maSP
                    WHERE sp.hang = @tenHang AND sp.trangThai = 1
                      AND (ts.nhan LIKE N'%RAM%' OR ts.nhan LIKE N'%ROM%'
                           OR ts.nhan LIKE N'%nhớ trong%' OR ts.nhan LIKE N'%lưu trữ%')
                `);

            const ramMap = {};
            const romMap = {};
            const themGiaTri = (map, maSP, giaTri) => {
                if (!giaTri) return;
                (map[maSP] = map[maSP] || []).push(String(giaTri));
            };

            ketQuaBienThe.recordset.forEach((r) => themGiaTri(romMap, r.maSP, r.giaTri));
            ketQuaThongSo.recordset.forEach((r) => {
                const nhan = String(r.nhan || '');
                if (/\bram\b/i.test(nhan)) themGiaTri(ramMap, r.maSP, r.giaTri);
                else if (/\brom\b|bộ nhớ trong|lưu trữ/i.test(nhan)) themGiaTri(romMap, r.maSP, r.giaTri);
            });

            sanPham.forEach((sp) => {
                sp.ram = ramMap[sp.maSP] || [];
                sp.rom = romMap[sp.maSP] || [];
            });
        }

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

        return {
            ...ketQuaSP.recordset[0],
            bienTheDungLuong: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'dungluong'),
            bienTheMauSac: ketQuaBienThe.recordset.filter((b) => b.loaiBienThe === 'mausac'),
            thongSoKyThuat: ketQuaThongSo.recordset,
        };
    }
}

module.exports = CatalogService;
