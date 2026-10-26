// file: services/CartService.js
// Xử lý nghiệp vụ + truy vấn DB cho giỏ hàng. Không biết gì về req/res.
const BaseService = require('../BaseService');

class CartService extends BaseService {
    // Xem giỏ hàng của 1 khách hàng
    async getCartByCustomerId(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT 
                    gh.maGioHang, gh.maKH, gh.maSP, gh.maBienThe, gh.soLuong,
                    sp.tenSP, sp.hinhAnh, sp.giaBan,
                    bt.giaTri AS bienTheGiaTri, bt.giaChenhLech
                FROM GioHang gh
                JOIN SanPham sp ON gh.maSP = sp.maSP
                LEFT JOIN BienTheSanPham bt ON gh.maBienThe = bt.maBienThe
                WHERE gh.maKH = @maKH
                ORDER BY gh.ngayThem DESC
            `);

        return result.recordset;
    }

    // Thêm sản phẩm vào giỏ. Nếu đã có (cùng maKH + maSP + tenPhanLoai) -> cộng dồn số lượng
    async addToCart({ maKH, maSP, maBienThe, tenPhanLoai, soLuong, giaTaiThoiDiemThem }) {
        const sql = this.sql;
        const pool = await this.getPool();

        // ================= THUẬT TOÁN XỬ LÝ GIÁ THÔNG MINH =================
        // 1. Lấy giá gốc của sản phẩm từ Database
        const spResult = await pool.request()
            .input('maSP', sql.VarChar, maSP)
            .query(`SELECT giaBan FROM SanPham WHERE maSP = @maSP`);

        const giaGoc = spResult.recordset.length > 0 ? Number(spResult.recordset[0].giaBan) : 0;
        const giaTruyenLen = Number(giaTaiThoiDiemThem) || 0;

        // 2. Nhận diện cách nhập giá:
        // - Giá truyền lên < giá gốc (VD: 0đ hoặc 4.000.000đ) => Giá Gốc + Giá Phụ Thu.
        // - Giá truyền lên >= giá gốc (VD: 6.490.000đ) => giữ nguyên để không bị cộng dồn gấp đôi.
        let giaThucTe = giaTruyenLen;
        if (giaTruyenLen < giaGoc) {
            giaThucTe = giaGoc + giaTruyenLen;
        }
        // ===================================================================

        const checkResult = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .input('maSP', sql.VarChar, maSP)
            .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
            .query(`
                SELECT * FROM GioHang 
                WHERE maKH = @maKH AND maSP = @maSP AND ISNULL(tenPhanLoai, '') = ISNULL(@tenPhanLoai, '')
            `);

        if (checkResult.recordset.length > 0) {
            // Đã có sẵn phiên bản màu/dung lượng này -> chỉ cộng dồn số lượng
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                .input('soLuongThem', sql.Int, soLuong)
                .query(`
                    UPDATE GioHang 
                    SET soLuong = soLuong + @soLuongThem 
                    WHERE maKH = @maKH AND maSP = @maSP AND ISNULL(tenPhanLoai, '') = ISNULL(@tenPhanLoai, '')
                `);
        } else {
            // Phiên bản mới -> thêm dòng mới với giá thực tế đã tính
            await pool.request()
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .input('maBienThe', sql.VarChar, maBienThe)
                .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                .input('soLuong', sql.Int, soLuong)
                .input('gia', sql.Int, giaThucTe)
                .query(`
                    INSERT INTO GioHang (maKH, maSP, maBienThe, tenPhanLoai, soLuong, gia) 
                    VALUES (@maKH, @maSP, @maBienThe, @tenPhanLoai, @soLuong, @gia)
                `);
        }

        return { message: "Đã thêm vào giỏ hàng" };
    }

    // Cập nhật số lượng 1 dòng trong giỏ (nút + / -). Số lượng <= 0 thì xóa dòng đó
    async updateCartQuantity(maGioHang, soLuong) {
        const sql = this.sql;
        const pool = await this.getPool();

        if (Number(soLuong) <= 0) {
            await pool.request()
                .input('maGioHang', sql.Int, maGioHang)
                .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);
            return { message: "Đã xóa sản phẩm khỏi giỏ" };
        }

        await pool.request()
            .input('maGioHang', sql.Int, maGioHang)
            .input('soLuong', sql.Int, soLuong)
            .query(`UPDATE GioHang SET soLuong = @soLuong WHERE maGioHang = @maGioHang`);

        return { message: "Đã cập nhật số lượng" };
    }

    // Xóa hẳn 1 dòng khỏi giỏ
    async removeItem(maGioHang) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maGioHang', sql.Int, maGioHang)
            .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);

        return { message: "Đã xóa sản phẩm khỏi giỏ" };
    }
}

module.exports = CartService;
