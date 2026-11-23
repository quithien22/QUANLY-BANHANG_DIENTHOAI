// file: services/admin/SanPhamService.js
// Quản lý sản phẩm phía admin. GET danh sách cũng được frontend user dùng (ProductApi.getAll).
//
// Đã sửa so với bản cũ (chưa từng chạy thật nên lệch schema):
//  - SanPham không có cột tenLSP (tên loại nằm ở bảng LoaiSanPham) -> tra maLSP theo tên loại rồi ghi vào cột maLSP.
//  - maSP là mã chuỗi 'SPxxxxxx' (không phải số tự tăng) -> tự sinh mã khi thêm, dùng VarChar cho mọi truy vấn.
//  - Sửa sản phẩm: trước đây trangThai luôn bị đặt về 0 vì frontend gửi "dang_ban"/"ngung_ban" chứ không phải "1".
//  - Xóa = NGỪNG BÁN (trangThai = 0), đúng như nội dung xác nhận ở giao diện; DELETE cứng sẽ lỗi khóa ngoại
//    vì sản phẩm đã có trong hóa đơn / đánh giá.
//
// CHƯA LƯU (frontend có gửi nhưng backend bỏ qua vì cần biết cấu trúc bảng BienTheSanPham / ThongSoKyThuat):
//  biến thể dung lượng & màu sắc, thông số kỹ thuật, đơn vị tính.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');
const { layUrlAnh } = require('../../utils/imageUrl');

// Chấp nhận mảng hoặc chuỗi JSON của mảng; bỏ phần tử rỗng / không phải chuỗi
const docDanhSachChuoi = (giaTri) => {
    let mang = giaTri;
    if (typeof giaTri === 'string') {
        try { mang = JSON.parse(giaTri); } catch (_) { mang = []; }
    }
    if (!Array.isArray(mang)) return [];
    return mang.filter((x) => typeof x === 'string' && x.trim() !== '').map((x) => x.trim());
};

// "dang_ban" | "1" | "true" | 1 | true -> 1 ; "ngung_ban" | "0" | "false" | 0 | false -> 0 ; còn lại -> null (giữ nguyên)
const docTrangThai = (giaTri) => {
    if (giaTri === undefined || giaTri === null || giaTri === '') return null;
    const s = String(giaTri).toLowerCase();
    if (['dang_ban', '1', 'true'].includes(s)) return 1;
    if (['ngung_ban', '0', 'false'].includes(s)) return 0;
    return null;
};

const docSoNguyen = (giaTri, tenTruong, { toiThieu = 0 } = {}) => {
    const so = Number(giaTri);
    if (!Number.isInteger(so) || so < toiThieu || so > 2000000000) {
        throw new HttpError(400, `${tenTruong} không hợp lệ.`);
    }
    return so;
};

class SanPhamService extends BaseService {
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT sp.*, lsp.tenLSP
            FROM SanPham sp
            LEFT JOIN LoaiSanPham lsp ON sp.maLSP = lsp.maLSP
        `);
        return ketQua.recordset;
    }

    // Tra mã loại theo tên loại; không có thì báo lỗi rõ ràng thay vì để SQL báo "Invalid column name"
    async timMaLoai(yeuCau, tenLSP) {
        const sql = this.sql;
        const ketQua = await yeuCau()
            .input('tenLSP', sql.NVarChar(100), tenLSP)
            .query('SELECT TOP 1 maLSP FROM LoaiSanPham WHERE tenLSP = @tenLSP');
        if (ketQua.recordset.length === 0) {
            throw new HttpError(400, `Loại sản phẩm "${tenLSP}" chưa tồn tại. Hãy chọn một loại có sẵn trong danh sách gợi ý.`);
        }
        return ketQua.recordset[0].maLSP;
    }

    // Thêm ảnh phụ vào HinhAnhSanPham nếu bảng này có trong DB (kiểm tra bằng OBJECT_ID để không lỗi khi chưa tạo bảng)
    async themAnhPhu(giaoDich, maSP, danhSachUrl) {
        const sql = this.sql;
        for (const url of danhSachUrl) {
            await new sql.Request(giaoDich)
                .input('maSP', sql.VarChar(20), maSP)
                .input('duongDan', sql.VarChar(500), url)
                .query(`
                    IF OBJECT_ID(N'HinhAnhSanPham', N'U') IS NOT NULL
                        INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)
                `);
        }
    }

    // danhSachFile: mảng file do multer trả về (req.files). Ảnh đầu (file rồi tới link) = ảnh đại diện, các ảnh sau = ảnh phụ
    async them({ tenSP, hang, tenLSP, giaBan, tonKho, badge, tag, anhLinks }, danhSachFile = []) {
        const sql = this.sql;

        if (!tenSP || !String(tenSP).trim() || !hang || !String(hang).trim() || !tenLSP || !String(tenLSP).trim()) {
            throw new HttpError(400, "Vui lòng nhập tên sản phẩm, hãng và loại sản phẩm.");
        }
        const gia = docSoNguyen(giaBan, "Giá bán", { toiThieu: 1 });
        const ton = (tonKho === undefined || tonKho === '' || tonKho === null) ? 0 : docSoNguyen(tonKho, "Tồn kho");

        const tatCaAnh = [
            ...danhSachFile.map((f) => layUrlAnh(f.filename)),
            ...docDanhSachChuoi(anhLinks),
        ];

        const pool = await this.getPool();
        const giaoDich = new sql.Transaction(pool);
        await giaoDich.begin();

        try {
            const maLSP = await this.timMaLoai(() => new sql.Request(giaoDich), String(tenLSP).trim());

            // Mã dạng 'SP' + 6 số cuối của thời gian (cùng kiểu với dữ liệu hiện có), kiểm tra trùng rồi mới dùng
            let maSPMoi = null;
            for (let lan = 0; lan < 5 && !maSPMoi; lan++) {
                const thu = 'SP' + (Date.now() + lan).toString().slice(-6);
                const daCo = await new sql.Request(giaoDich)
                    .input('maSP', sql.VarChar(20), thu)
                    .query('SELECT 1 AS daCo FROM SanPham WHERE maSP = @maSP');
                if (daCo.recordset.length === 0) maSPMoi = thu;
            }
            if (!maSPMoi) throw new HttpError(500, "Không tạo được mã sản phẩm mới, vui lòng thử lại.");

            await new sql.Request(giaoDich)
                .input('maSP', sql.VarChar(20), maSPMoi)
                .input('tenSP', sql.NVarChar(255), String(tenSP).trim())
                .input('hang', sql.NVarChar(100), String(hang).trim())
                .input('maLSP', sql.VarChar(20), maLSP)
                .input('giaBan', sql.Int, gia)
                .input('tonKho', sql.Int, ton)
                .input('hinhAnh', sql.VarChar(500), tatCaAnh[0] || null)
                .input('badge', sql.NVarChar(100), badge ? String(badge).trim() : '')
                .input('tag', sql.NVarChar(100), tag ? String(tag).trim() : '')
                .query(`
                    INSERT INTO SanPham (maSP, tenSP, hang, maLSP, giaBan, tonKho, hinhAnh, trangThai, badge, tag, diemDanhGiaTB, soLuongDanhGia)
                    VALUES (@maSP, @tenSP, @hang, @maLSP, @giaBan, @tonKho, @hinhAnh, 1, @badge, @tag, 0, 0)
                `);

            await this.themAnhPhu(giaoDich, maSPMoi, tatCaAnh.slice(1));

            await giaoDich.commit();
            return { message: "Thêm sản phẩm thành công", newProductId: maSPMoi };
        } catch (loi) {
            try { await giaoDich.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw loi;
        }
    }

    async sua(maSP, { tenSP, hang, tenLSP, giaBan, tonKho, trangThai, badge, tag, anhCu, anhLinks }, danhSachFile = []) {
        const sql = this.sql;

        const gia = (giaBan === undefined || giaBan === '' || giaBan === null) ? null : docSoNguyen(giaBan, "Giá bán", { toiThieu: 1 });
        const ton = (tonKho === undefined || tonKho === '' || tonKho === null) ? null : docSoNguyen(tonKho, "Tồn kho");
        const trangThaiBit = docTrangThai(trangThai); // null = không gửi -> giữ nguyên (trước đây luôn thành 0)

        // Ảnh: giữ ảnh cũ còn lại + ảnh mới (link, file). Ảnh đầu tiên là ảnh đại diện.
        // Nếu admin xóa hết ảnh mà không thêm ảnh mới thì giữ nguyên ảnh hiện tại (sản phẩm không được trống ảnh đại diện).
        const anhCuConGiu = docDanhSachChuoi(anhCu);
        const anhMoi = [
            ...docDanhSachChuoi(anhLinks),
            ...danhSachFile.map((f) => layUrlAnh(f.filename)),
        ];
        const anhDaiDien = [...anhCuConGiu, ...anhMoi][0] || null;
        const anhPhuMoi = anhMoi.filter((url) => url !== anhDaiDien);

        const pool = await this.getPool();
        const giaoDich = new sql.Transaction(pool);
        await giaoDich.begin();

        try {
            const tonTai = await new sql.Request(giaoDich)
                .input('maSP', sql.VarChar(20), maSP)
                .query('SELECT 1 AS daCo FROM SanPham WITH (UPDLOCK) WHERE maSP = @maSP');
            if (tonTai.recordset.length === 0) {
                throw new HttpError(404, "Không tìm thấy sản phẩm.");
            }

            const maLSP = (tenLSP && String(tenLSP).trim())
                ? await this.timMaLoai(() => new sql.Request(giaoDich), String(tenLSP).trim())
                : null;

            // ISNULL(@x, cột): trường nào không gửi lên thì giữ nguyên giá trị cũ
            await new sql.Request(giaoDich)
                .input('maSP', sql.VarChar(20), maSP)
                .input('tenSP', sql.NVarChar(255), tenSP ? String(tenSP).trim() : null)
                .input('hang', sql.NVarChar(100), hang ? String(hang).trim() : null)
                .input('maLSP', sql.VarChar(20), maLSP)
                .input('giaBan', sql.Int, gia)
                .input('tonKho', sql.Int, ton)
                .input('trangThai', sql.Bit, trangThaiBit)
                .input('hinhAnh', sql.VarChar(500), anhDaiDien)
                .input('badge', sql.NVarChar(100), badge === undefined || badge === null ? null : String(badge).trim())
                .input('tag', sql.NVarChar(100), tag === undefined || tag === null ? null : String(tag).trim())
                .query(`
                    UPDATE SanPham
                    SET tenSP = ISNULL(@tenSP, tenSP),
                        hang = ISNULL(@hang, hang),
                        maLSP = ISNULL(@maLSP, maLSP),
                        giaBan = ISNULL(@giaBan, giaBan),
                        tonKho = ISNULL(@tonKho, tonKho),
                        trangThai = ISNULL(@trangThai, trangThai),
                        hinhAnh = ISNULL(@hinhAnh, hinhAnh),
                        badge = ISNULL(@badge, badge),
                        tag = ISNULL(@tag, tag)
                    WHERE maSP = @maSP
                `);

            await this.themAnhPhu(giaoDich, maSP, anhPhuMoi);

            await giaoDich.commit();
            return { message: "Cập nhật sản phẩm thành công" };
        } catch (loi) {
            try { await giaoDich.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw loi;
        }
    }

    // "Xóa" = ngừng bán. Giữ lại dòng sản phẩm để hóa đơn, đánh giá, yêu thích cũ vẫn trỏ đúng.
    async xoa(maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('maSP', sql.VarChar(20), maSP)
            .query(`UPDATE SanPham SET trangThai = 0 WHERE maSP = @maSP`);

        if (ketQua.rowsAffected[0] === 0) {
            throw new HttpError(404, "Không tìm thấy sản phẩm.");
        }

        return { message: "Đã ngừng bán sản phẩm" };
    }
}

module.exports = SanPhamService;
