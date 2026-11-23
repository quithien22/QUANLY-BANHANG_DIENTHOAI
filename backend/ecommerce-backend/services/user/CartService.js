// file: services/CartService.js
// Xử lý nghiệp vụ + truy vấn DB cho giỏ hàng. Không biết gì về req/res.
//
// GIỮ HÀNG (giữ tồn kho) - quy tắc chung:
//  - Thêm vào giỏ      -> trừ SanPham.tonKho ngay (hàng được "giữ" cho khách)
//  - Tăng / giảm SL    -> trừ / hoàn phần chênh lệch
//  - Xóa khỏi giỏ      -> hoàn tonKho
//  - Quá 15 phút       -> tự xóa dòng giỏ + hoàn tonKho (job nền + dọn khi khách gọi API)
//  - Đặt hàng          -> OrderService chuyển hàng đang giữ thành đơn, KHÔNG trừ kho lần 2
//
// Mọi thay đổi (dòng giỏ + tồn kho) nằm trong 1 transaction, và luôn khóa theo thứ tự
// GioHang -> SanPham để 2 request song song không bị deadlock / bán lố.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

const PHUT_GIU_HANG = 15;          // thời gian giữ hàng trong giỏ
const CHU_KY_QUET_MS = 30 * 1000;  // job nền quét giỏ hết hạn mỗi 30 giây

class CartService extends BaseService {
    constructor(db) {
        super(db);
        this._ready = null;
        this._timer = null;
        this._dangQuet = false;
    }

    // ===================== KHỞI TẠO =====================

    // Thêm cột GioHang.hetHanLuc (thời điểm hết hạn giữ hàng) nếu chưa có. Chạy 1 lần, an toàn khi gọi lại.
    async ensureSchema() {
        const pool = await this.getPool();
        await pool.request().query(`
            IF COL_LENGTH('GioHang', 'hetHanLuc') IS NULL
            BEGIN
                ALTER TABLE GioHang ADD hetHanLuc DATETIME NULL;
                -- Các dòng giỏ cũ chưa từng bị trừ kho -> xóa đi, nếu không lúc hết hạn sẽ "hoàn" kho ảo
                EXEC('DELETE FROM GioHang');
            END
        `);
    }

    ready() {
        if (!this._ready) {
            this._ready = this.ensureSchema().catch((err) => {
                this._ready = null; // lần sau thử lại
                throw err;
            });
        }
        return this._ready;
    }

    // Bật job nền: cứ 30 giây xóa các dòng giỏ quá hạn và hoàn tồn kho. Gọi 1 lần từ container.js
    startExpiryJob() {
        if (this._timer) return;

        const quet = async () => {
            if (this._dangQuet) return;
            this._dangQuet = true;
            try {
                const soDong = await this.releaseExpired();
                if (soDong > 0) {
                    console.log(`[Giỏ hàng] Đã xóa ${soDong} dòng quá ${PHUT_GIU_HANG} phút và hoàn lại tồn kho.`);
                }
            } catch (err) {
                console.error('[Giỏ hàng] Lỗi quét giỏ hết hạn:', err.message);
            } finally {
                this._dangQuet = false;
            }
        };

        console.log(`[Giỏ hàng] Đã bật giữ hàng ${PHUT_GIU_HANG} phút (quét hết hạn mỗi ${CHU_KY_QUET_MS / 1000} giây).`);
        quet();
        this._timer = setInterval(quet, CHU_KY_QUET_MS);
        if (this._timer.unref) this._timer.unref(); // timer không giữ tiến trình Node sống
    }

    // ===================== HÀM DÙNG CHUNG =====================

    // Xóa các dòng giỏ đã quá hạn và hoàn tồn kho. Truyền maKH để chỉ dọn giỏ của 1 khách.
    // DELETE ... OUTPUT INTO là 1 câu duy nhất nên 2 nơi cùng dọn (job + request) không hoàn kho 2 lần.
    // Trả về số dòng đã xóa.
    async releaseExpired(maKH = null) {
        await this.ready();
        const sql = this.sql;
        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            let dieuKienKH = '';
            if (maKH) {
                request.input('maKH', sql.VarChar(20), maKH);
                dieuKienKH = 'AND maKH = @maKH';
            }

            const result = await request.query(`
                DECLARE @het TABLE (maSP VARCHAR(50), soLuong INT);

                DELETE FROM GioHang
                OUTPUT DELETED.maSP, DELETED.soLuong INTO @het
                WHERE hetHanLuc IS NOT NULL AND hetHanLuc <= GETDATE() ${dieuKienKH};

                UPDATE sp
                SET sp.tonKho = sp.tonKho + h.tong
                FROM SanPham sp
                JOIN (SELECT maSP, SUM(soLuong) AS tong FROM @het GROUP BY maSP) h ON sp.maSP = h.maSP;

                SELECT COUNT(*) AS soDong FROM @het;
            `);

            await transaction.commit();
            return result.recordset[0].soDong;
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }
    }

    // Giữ hàng: trừ tồn kho bằng 1 câu UPDATE có điều kiện (chống bán quá số lượng).
    // Hết hàng / không đủ -> rowsAffected = 0 -> ném lỗi 409 (transaction của người gọi sẽ rollback).
    async _giuKho(transaction, maSP, soLuong) {
        const sql = this.sql;
        const ketQua = await new sql.Request(transaction)
            .input('maSP', sql.VarChar(20), maSP)
            .input('soLuong', sql.Int, soLuong)
            .query(`
                UPDATE SanPham
                SET tonKho = tonKho - @soLuong
                WHERE maSP = @maSP AND trangThai = 1 AND tonKho >= @soLuong
            `);

        console.log(`[Giỏ hàng] Giữ kho maSP=${maSP} số lượng=${soLuong} -> dòng bị ảnh hưởng: ${ketQua.rowsAffected[0]}`);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(409, "Sản phẩm đã hết hàng hoặc không đủ số lượng tồn kho.");
        }
    }

    // Hoàn hàng đang giữ về tồn kho
    async _hoanKho(transaction, maSP, soLuong) {
        const sql = this.sql;
        await new sql.Request(transaction)
            .input('maSP', sql.VarChar(20), maSP)
            .input('soLuong', sql.Int, soLuong)
            .query(`UPDATE SanPham SET tonKho = tonKho + @soLuong WHERE maSP = @maSP`);
    }

    // ===================== API GIỎ HÀNG =====================

    // Xem giỏ hàng của 1 khách hàng (chỉ các dòng còn hạn giữ hàng)
    async getCartByCustomerId(maKH) {
        await this.ready();
        // Dọn các dòng hết hạn của khách này trước. Lỗi dọn không chặn việc xem giỏ (câu SELECT dưới đã lọc hết hạn)
        await this.releaseExpired(maKH).catch((err) => console.error('Lỗi dọn giỏ hết hạn:', err.message));

        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT 
                    gh.maGioHang, gh.maKH, gh.maSP, gh.maBienThe, gh.soLuong,
                    gh.hetHanLuc,
                    DATEDIFF(SECOND, GETDATE(), gh.hetHanLuc) AS conLaiGiay,
                    sp.tenSP, sp.hinhAnh, sp.giaBan,
                    bt.giaTri AS bienTheGiaTri, bt.giaChenhLech
                FROM GioHang gh
                JOIN SanPham sp ON gh.maSP = sp.maSP
                LEFT JOIN BienTheSanPham bt ON gh.maBienThe = bt.maBienThe
                WHERE gh.maKH = @maKH
                  AND (gh.hetHanLuc IS NULL OR gh.hetHanLuc > GETDATE())
                ORDER BY gh.ngayThem DESC
            `);

        return result.recordset;
    }

    // Thêm sản phẩm vào giỏ + GIỮ HÀNG (trừ tồn kho). Nếu đã có (cùng maKH + maSP + tenPhanLoai) -> cộng dồn số lượng.
    // Mỗi lần thêm, hạn giữ hàng của dòng đó được tính lại 15 phút.
    async addToCart({ maKH, maSP, maBienThe, tenPhanLoai, soLuong, giaTaiThoiDiemThem }) {
        await this.ready();
        const sql = this.sql;

        const soLuongThem = Number(soLuong);
        if (!maKH || !maSP) {
            throw new HttpError(400, "Thiếu thông tin khách hàng hoặc sản phẩm.");
        }
        if (!Number.isInteger(soLuongThem) || soLuongThem <= 0) {
            throw new HttpError(400, "Số lượng không hợp lệ.");
        }

        // Dọn dòng hết hạn của khách này để không "hồi sinh" một dòng đã quá 15 phút
        await this.releaseExpired(maKH).catch((err) => console.error('Lỗi dọn giỏ hết hạn:', err.message));

        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // ================= THUẬT TOÁN XỬ LÝ GIÁ THÔNG MINH =================
            // 1. Lấy giá gốc của sản phẩm từ Database
            const spResult = await new sql.Request(transaction)
                .input('maSP', sql.VarChar, maSP)
                .query(`SELECT giaBan FROM SanPham WHERE maSP = @maSP`);

            if (spResult.recordset.length === 0) {
                throw new HttpError(404, "Sản phẩm không tồn tại.");
            }

            const giaGoc = Number(spResult.recordset[0].giaBan) || 0;
            const giaTruyenLen = Number(giaTaiThoiDiemThem) || 0;

            // 2. Nhận diện cách nhập giá:
            // - Giá truyền lên < giá gốc (VD: 0đ hoặc 4.000.000đ) => Giá Gốc + Giá Phụ Thu.
            // - Giá truyền lên >= giá gốc (VD: 6.490.000đ) => giữ nguyên để không bị cộng dồn gấp đôi.
            let giaThucTe = giaTruyenLen;
            if (giaTruyenLen < giaGoc) {
                giaThucTe = giaGoc + giaTruyenLen;
            }
            // ===================================================================

            // Khóa dòng giỏ trước (GioHang -> SanPham), UPDLOCK + HOLDLOCK để bấm đúp không tạo 2 dòng trùng
            const checkResult = await new sql.Request(transaction)
                .input('maKH', sql.VarChar, maKH)
                .input('maSP', sql.VarChar, maSP)
                .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                .query(`
                    SELECT maGioHang FROM GioHang WITH (UPDLOCK, HOLDLOCK)
                    WHERE maKH = @maKH AND maSP = @maSP AND ISNULL(tenPhanLoai, '') = ISNULL(@tenPhanLoai, '')
                `);

            // GIỮ HÀNG: trừ tồn kho. Không đủ hàng thì ném 409 và rollback, giỏ không đổi
            await this._giuKho(transaction, maSP, soLuongThem);

            if (checkResult.recordset.length > 0) {
                // Đã có sẵn phiên bản màu/dung lượng này -> cộng dồn số lượng, tính lại hạn giữ hàng
                await new sql.Request(transaction)
                    .input('maGioHang', sql.Int, checkResult.recordset[0].maGioHang)
                    .input('soLuongThem', sql.Int, soLuongThem)
                    .input('phut', sql.Int, PHUT_GIU_HANG)
                    .query(`
                        UPDATE GioHang 
                        SET soLuong = soLuong + @soLuongThem,
                            hetHanLuc = DATEADD(MINUTE, @phut, GETDATE())
                        WHERE maGioHang = @maGioHang
                    `);
            } else {
                // Phiên bản mới -> thêm dòng mới với giá thực tế đã tính
                await new sql.Request(transaction)
                    .input('maKH', sql.VarChar, maKH)
                    .input('maSP', sql.VarChar, maSP)
                    .input('maBienThe', sql.VarChar, maBienThe)
                    .input('tenPhanLoai', sql.NVarChar, tenPhanLoai)
                    .input('soLuong', sql.Int, soLuongThem)
                    .input('gia', sql.Int, giaThucTe)
                    .input('phut', sql.Int, PHUT_GIU_HANG)
                    .query(`
                        INSERT INTO GioHang (maKH, maSP, maBienThe, tenPhanLoai, soLuong, gia, hetHanLuc) 
                        VALUES (@maKH, @maSP, @maBienThe, @tenPhanLoai, @soLuong, @gia, DATEADD(MINUTE, @phut, GETDATE()))
                    `);
            }

            await transaction.commit();
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }

        return { message: "Đã thêm vào giỏ hàng", phutGiuHang: PHUT_GIU_HANG };
    }

    // Cập nhật số lượng 1 dòng trong giỏ (nút + / -).
    //  - Tăng: giữ thêm phần chênh (hết hàng -> 409) và tính lại hạn 15 phút
    //  - Giảm: hoàn phần chênh về tồn kho
    //  - Số lượng <= 0: xóa dòng + hoàn toàn bộ
    //  - Dòng đã hết hạn / không còn: báo lỗi để giao diện tải lại giỏ
    // maKH (lấy từ token): chỉ sửa được dòng giỏ của CHÍNH khách đó; dòng của người khác coi như không tồn tại.
    async updateCartQuantity(maGioHang, soLuong, maKH) {
        await this.ready();
        const sql = this.sql;

        const soLuongMoi = Number(soLuong);
        if (!Number.isInteger(soLuongMoi)) {
            throw new HttpError(400, "Số lượng không hợp lệ.");
        }

        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        let daXoa = false;
        let hetHanKhiBam = false;

        try {
            const dong = await new sql.Request(transaction)
                .input('maGioHang', sql.Int, maGioHang)
                .input('maKH', sql.VarChar(20), maKH)
                .query(`
                    SELECT maSP, soLuong,
                           CASE WHEN hetHanLuc IS NOT NULL AND hetHanLuc <= GETDATE() THEN 1 ELSE 0 END AS daHetHan
                    FROM GioHang WITH (UPDLOCK, HOLDLOCK)
                    WHERE maGioHang = @maGioHang AND maKH = @maKH
                `);

            if (dong.recordset.length === 0) {
                if (soLuongMoi <= 0) {
                    // Muốn xóa mà dòng đã không còn -> coi như xong
                    daXoa = true;
                } else {
                    throw new HttpError(404, "Sản phẩm không còn trong giỏ (có thể đã quá 15 phút giữ hàng). Vui lòng tải lại giỏ hàng.");
                }
            } else {
                const { maSP, soLuong: soLuongCu, daHetHan } = dong.recordset[0];

                if (daHetHan || soLuongMoi <= 0) {
                    // Hết hạn, hoặc khách giảm về 0: xóa dòng và hoàn toàn bộ số đang giữ
                    await new sql.Request(transaction)
                        .input('maGioHang', sql.Int, maGioHang)
                        .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);
                    await this._hoanKho(transaction, maSP, soLuongCu);

                    daXoa = true;
                    hetHanKhiBam = !!daHetHan && soLuongMoi > 0;
                } else {
                    const chenhLech = soLuongMoi - soLuongCu;

                    if (chenhLech > 0) {
                        await this._giuKho(transaction, maSP, chenhLech);
                        await new sql.Request(transaction)
                            .input('maGioHang', sql.Int, maGioHang)
                            .input('soLuong', sql.Int, soLuongMoi)
                            .input('phut', sql.Int, PHUT_GIU_HANG)
                            .query(`
                                UPDATE GioHang
                                SET soLuong = @soLuong, hetHanLuc = DATEADD(MINUTE, @phut, GETDATE())
                                WHERE maGioHang = @maGioHang
                            `);
                    } else if (chenhLech < 0) {
                        await this._hoanKho(transaction, maSP, -chenhLech);
                        await new sql.Request(transaction)
                            .input('maGioHang', sql.Int, maGioHang)
                            .input('soLuong', sql.Int, soLuongMoi)
                            .query(`UPDATE GioHang SET soLuong = @soLuong WHERE maGioHang = @maGioHang`);
                    }
                }
            }

            await transaction.commit();
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }

        if (hetHanKhiBam) {
            throw new HttpError(410, "Sản phẩm đã quá 15 phút giữ hàng nên bị xóa khỏi giỏ. Vui lòng thêm lại.");
        }

        return { message: daXoa ? "Đã xóa sản phẩm khỏi giỏ" : "Đã cập nhật số lượng" };
    }

    // Xóa hẳn 1 dòng khỏi giỏ + hoàn tồn kho đang giữ
    // maKH (lấy từ token): chỉ xóa được dòng giỏ của chính khách đó.
    async removeItem(maGioHang, maKH) {
        await this.ready();
        const sql = this.sql;
        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Khóa dòng để job nền / request khác không hoàn kho cùng lúc
            const dong = await new sql.Request(transaction)
                .input('maGioHang', sql.Int, maGioHang)
                .input('maKH', sql.VarChar(20), maKH)
                .query(`
                    SELECT maSP, soLuong FROM GioHang WITH (UPDLOCK, HOLDLOCK)
                    WHERE maGioHang = @maGioHang AND maKH = @maKH
                `);

            if (dong.recordset.length > 0) {
                await new sql.Request(transaction)
                    .input('maGioHang', sql.Int, maGioHang)
                    .query(`DELETE FROM GioHang WHERE maGioHang = @maGioHang`);
                await this._hoanKho(transaction, dong.recordset[0].maSP, dong.recordset[0].soLuong);
            }

            await transaction.commit();
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }

        return { message: "Đã xóa sản phẩm khỏi giỏ" };
    }
}

module.exports = CartService;
