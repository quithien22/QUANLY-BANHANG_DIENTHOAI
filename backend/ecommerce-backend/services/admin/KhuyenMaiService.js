// file: services/admin/KhuyenMaiService.js
// Khuyến mãi và Flash Sale phía admin.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class KhuyenMaiService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`SELECT * FROM KhuyenMai km`);
        return ketQua.recordset;
    }

    // Danh sách khung giờ Flash Sale kèm sản phẩm bên trong
    async layFlashSale() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT 
                kgls.maKhungGio, kgls.gioBD, kgls.gioKT, kgls.ngayApDung, kgls.trangThai AS trangThaiKhungGio,
                kgls.maKM, km.tenKM, km.phanTram,
                spkm.giaFlashSale, spkm.soLuongGioiHan, spkm.daBan,
                sp.maSP, sp.tenSP, sp.hinhAnh, sp.giaBan
            FROM KhungGioFlashSale kgls
            LEFT JOIN SanPhamFlashSale spkm ON kgls.maKhungGio = spkm.maKhungGio
            LEFT JOIN SanPham sp ON spkm.maSP = sp.maSP
            LEFT JOIN KhuyenMai km ON kgls.maKM = km.maKM
            ORDER BY kgls.ngayApDung DESC, kgls.gioBD DESC
        `);
        return ketQua.recordset;
    }

    // Tạo chương trình khuyến mãi mới (mặc định trangThai = 1: đang chạy)
    async taoKhuyenMai({ tenKM, phanTram, dieuKien, ngayBD, ngayKT }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const pt = Number(phanTram);
        const dk = Number(dieuKien);

        if (!tenKM || !String(tenKM).trim()) {
            throw new HttpError(400, "Tên chương trình không được để trống");
        }
        if (!Number.isFinite(pt) || pt < 1 || pt > 100) {
            throw new HttpError(400, "Mức giảm phải từ 1 đến 100%");
        }
        if (!Number.isFinite(dk) || dk < 0) {
            throw new HttpError(400, "Điều kiện áp dụng không hợp lệ");
        }
        if (!ngayBD || !ngayKT || new Date(ngayKT) < new Date(ngayBD)) {
            throw new HttpError(400, "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }

        // maKM là varchar NOT NULL và KHÔNG tự tăng -> tự sinh mã (giống cách taoKhungGio làm)
        const maKM = 'KM' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maKM', sql.VarChar(20), maKM)
            .input('tenKM', sql.NVarChar(200), String(tenKM).trim())
            .input('phanTram', sql.Float, pt)
            .input('dieuKien', sql.NVarChar(100), String(dk))
            .input('ngayBD', sql.Date, ngayBD)
            .input('ngayKT', sql.Date, ngayKT)
            .query(`
                INSERT INTO KhuyenMai (maKM, tenKM, phanTram, dieuKien, ngayBD, ngayKT, trangThai)
                VALUES (@maKM, @tenKM, @phanTram, @dieuKien, @ngayBD, @ngayKT, 1)
            `);

        return { message: "Tạo khuyến mãi thành công!" };
    }

    // Bật/tắt trạng thái chương trình khuyến mãi (1 = đang chạy, 0 = tạm ngưng)
    async capNhatTrangThai(maKM, trangThai) {
        const sql = this.sql;
        const pool = await this.getPool();

        if (!maKM) throw new HttpError(400, "Thiếu mã khuyến mãi");

        const ketQua = await pool.request()
            .input('maKM', sql.VarChar(20), maKM)
            .input('trangThai', sql.Bit, trangThai ? 1 : 0)
            .query(`UPDATE KhuyenMai SET trangThai = @trangThai WHERE maKM = @maKM`);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(404, "Không tìm thấy chương trình khuyến mãi");
        }

        return { message: "Cập nhật trạng thái thành công!" };
    }

    async taoKhungGio({ ngayApDung, gioBD, gioKT, maKM }) {
        const sql = this.sql;
        const pool = await this.getPool();

        this.kiemTraKhungGio({ ngayApDung, gioBD, gioKT });
        const maKMHopLe = await this.kiemTraKhuyenMai(pool, maKM);

        const maKhungGio = 'KG' + Date.now().toString().slice(-6);

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .input('gioBD', sql.VarChar(10), gioBD)
            .input('gioKT', sql.VarChar(10), gioKT)
            .input('ngayApDung', sql.Date, ngayApDung)
            .input('maKM', sql.VarChar(20), maKMHopLe)
            .query(`
                INSERT INTO KhungGioFlashSale (maKhungGio, gioBD, gioKT, ngayApDung, trangThai, maKM) 
                VALUES (@maKhungGio, @gioBD, @gioKT, @ngayApDung, 'sap_dien_ra', @maKM)
            `);

        return { message: "Tạo khung giờ Flash Sale thành công!" };
    }

    // Kiểm tra dữ liệu khung giờ (dùng chung cho tạo + sửa)
    kiemTraKhungGio({ ngayApDung, gioBD, gioKT }) {
        if (!ngayApDung || !gioBD || !gioKT) {
            throw new HttpError(400, "Vui lòng nhập đầy đủ ngày, giờ bắt đầu và giờ kết thúc");
        }
        if (String(gioKT) <= String(gioBD)) {
            throw new HttpError(400, "Giờ kết thúc phải lớn hơn giờ bắt đầu");
        }
    }

    // maKM không bắt buộc; nếu có thì phải tồn tại trong bảng KhuyenMai. Trả về maKM hoặc null.
    async kiemTraKhuyenMai(pool, maKM) {
        if (!maKM) return null;
        const kq = await pool.request()
            .input('maKM', this.sql.VarChar(20), maKM)
            .query(`SELECT 1 AS ok FROM KhuyenMai WHERE maKM = @maKM`);
        if (kq.recordset.length === 0) {
            throw new HttpError(400, "Chương trình khuyến mãi không tồn tại");
        }
        return maKM;
    }

    // Sửa khung giờ: ngày, giờ bắt đầu/kết thúc và chương trình khuyến mãi áp dụng
    async capNhatKhungGio(maKhungGio, { ngayApDung, gioBD, gioKT, maKM }) {
        const sql = this.sql;
        const pool = await this.getPool();

        this.kiemTraKhungGio({ ngayApDung, gioBD, gioKT });
        const maKMHopLe = await this.kiemTraKhuyenMai(pool, maKM);

        const ketQua = await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .input('gioBD', sql.VarChar(10), gioBD)
            .input('gioKT', sql.VarChar(10), gioKT)
            .input('ngayApDung', sql.Date, ngayApDung)
            .input('maKM', sql.VarChar(20), maKMHopLe)
            .query(`
                UPDATE KhungGioFlashSale
                SET gioBD = @gioBD, gioKT = @gioKT, ngayApDung = @ngayApDung, maKM = @maKM
                WHERE maKhungGio = @maKhungGio
            `);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(404, "Không tìm thấy khung giờ Flash Sale");
        }
        // Gán khuyến mãi cho khung giờ -> tự tính lại giá Flash Sale của các sản phẩm đang có trong khung giờ
        if (maKMHopLe) {
            await pool.request()
                .input('maKhungGio', sql.VarChar(20), maKhungGio)
                .input('maKM', sql.VarChar(20), maKMHopLe)
                .query(`
                    UPDATE spfs
                    SET giaFlashSale = ROUND(sp.giaBan * (100 - km.phanTram) / 100, 0)
                    FROM SanPhamFlashSale spfs
                    JOIN SanPham sp ON sp.maSP = spfs.maSP
                    JOIN KhuyenMai km ON km.maKM = @maKM
                    WHERE spfs.maKhungGio = @maKhungGio
                `);
        }
        return { message: "Cập nhật khung giờ thành công!" };
    }

    // Xóa khung giờ: xóa luôn các sản phẩm trong khung giờ đó (trong 1 transaction)
    async xoaKhungGio(maKhungGio) {
        const sql = this.sql;
        const pool = await this.getPool();

        const tonTai = await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .query(`SELECT 1 AS ok FROM KhungGioFlashSale WHERE maKhungGio = @maKhungGio`);
        if (tonTai.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy khung giờ Flash Sale");
        }

        try {
            await pool.request()
                .input('maKhungGio', sql.VarChar(20), maKhungGio)
                .query(`
                    SET XACT_ABORT ON;
                    BEGIN TRANSACTION;
                    DELETE FROM SanPhamFlashSale WHERE maKhungGio = @maKhungGio;
                    DELETE FROM KhungGioFlashSale WHERE maKhungGio = @maKhungGio;
                    COMMIT TRANSACTION;
                `);
        } catch (loi) {
            // 547 = vi phạm khóa ngoại (còn bảng khác tham chiếu tới khung giờ này)
            if (loi.number === 547) {
                throw new HttpError(409, "Không thể xóa vì khung giờ này đã có dữ liệu liên quan");
            }
            throw loi;
        }
        return { message: "Đã xóa khung giờ Flash Sale!" };
    }

    // Gỡ 1 sản phẩm khỏi khung giờ Flash Sale
    async xoaSanPhamFlashSale(maKhungGio, maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('maKhungGio', sql.VarChar(20), maKhungGio)
            .input('maSP', sql.VarChar(20), maSP)
            .query(`DELETE FROM SanPhamFlashSale WHERE maKhungGio = @maKhungGio AND maSP = @maSP`);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(404, "Sản phẩm không còn trong khung giờ này");
        }
        return { message: "Đã gỡ sản phẩm khỏi Flash Sale!" };
    }

    // maFS chính là mã khung giờ (frontend gửi tên maFS)
    async themSanPhamFlashSale({ maFS, maSP, giaFlashSale, soLuongGioiHan }) {
        const sql = this.sql;
        const pool = await this.getPool();

        // Nếu khung giờ có áp dụng khuyến mãi -> tự tính giá = giá bán × (100 - %) / 100
        const thongTin = await pool.request()
            .input('maKhungGio', sql.VarChar(20), maFS)
            .input('maSP', sql.VarChar(20), maSP)
            .query(`
                SELECT km.phanTram, sp.giaBan
                FROM KhungGioFlashSale kg
                JOIN SanPham sp ON sp.maSP = @maSP
                LEFT JOIN KhuyenMai km ON km.maKM = kg.maKM
                WHERE kg.maKhungGio = @maKhungGio
            `);
        if (thongTin.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy khung giờ hoặc sản phẩm");
        }
        const { phanTram, giaBan } = thongTin.recordset[0];

        let giaCuoi = Number(giaFlashSale);
        if (phanTram) {
            giaCuoi = Math.round(Number(giaBan) * (100 - Number(phanTram)) / 100);
        }
        if (!Number.isFinite(giaCuoi) || giaCuoi < 0) {
            throw new HttpError(400, "Giá Flash Sale không hợp lệ");
        }

        await pool.request()
            .input('maKhungGio', sql.VarChar(20), maFS)
            .input('maSP', sql.VarChar(20), maSP)
            .input('giaFlashSale', sql.Float, giaCuoi)
            .input('soLuongGioiHan', sql.Int, soLuongGioiHan)
            .query(`
                INSERT INTO SanPhamFlashSale (maKhungGio, maSP, giaFlashSale, soLuongGioiHan, daBan) 
                VALUES (@maKhungGio, @maSP, @giaFlashSale, @soLuongGioiHan, 0)
            `);

        return { message: "Thêm sản phẩm vào Flash Sale thành công!" };
    }
}

module.exports = KhuyenMaiService;
