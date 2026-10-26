// file: services/admin/SanPhamService.js
// Quản lý sản phẩm phía admin. GET danh sách cũng được frontend user dùng (ProductApi.getAll).
// LƯU Ý: logic them/sua/xoa được giữ NGUYÊN từ server.js cũ (trước đây chưa từng được mount nên chưa chạy thật).
const BaseService = require('../BaseService');
const { layUrlAnh } = require('../../utils/imageUrl');

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

    // danhSachFile: mảng file do multer trả về (req.files). Ảnh đầu = ảnh đại diện, các ảnh sau vào HinhAnhSanPham
    async them({ tenSP, hang, tenLSP, giaBan, tonKho }, danhSachFile = []) {
        const sql = this.sql;
        const pool = await this.getPool();
        const giaoDich = new sql.Transaction(pool);
        await giaoDich.begin();

        try {
            const anhDaiDien = danhSachFile.length > 0 ? layUrlAnh(danhSachFile[0].filename) : null;

            const ketQuaSP = await new sql.Request(giaoDich)
                .input('tenSP', sql.NVarChar, tenSP)
                .input('hang', sql.NVarChar, hang)
                .input('tenLSP', sql.NVarChar, tenLSP)
                .input('giaBan', sql.Int, giaBan)
                .input('tonKho', sql.Int, tonKho)
                .input('hinhAnh', sql.VarChar, anhDaiDien)
                .query(`
                    INSERT INTO SanPham (tenSP, hang, tenLSP, giaBan, tonKho, hinhAnh, trangThai)
                    OUTPUT INSERTED.maSP
                    VALUES (@tenSP, @hang, @tenLSP, @giaBan, @tonKho, @hinhAnh, 1)
                `);
            const maSPMoi = ketQuaSP.recordset[0].maSP;

            for (let i = 1; i < danhSachFile.length; i++) {
                await new sql.Request(giaoDich)
                    .input('maSP', sql.Int, maSPMoi)
                    .input('duongDan', sql.VarChar, layUrlAnh(danhSachFile[i].filename))
                    .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
            }

            await giaoDich.commit();
            return { message: "Thêm sản phẩm thành công", newProductId: maSPMoi };
        } catch (loi) {
            await giaoDich.rollback();
            throw loi;
        }
    }

    async sua(maSP, { tenSP, hang, tenLSP, giaBan, tonKho, trangThai }, danhSachFile = []) {
        const sql = this.sql;
        const pool = await this.getPool();

        // Cột trangThai trong DB là kiểu bit (0/1), frontend gửi lên chuỗi "1" hoặc "0"
        const trangThaiBit = (trangThai === "1" || trangThai === "true") ? 1 : 0;

        await pool.request()
            .input('maSP', sql.VarChar(10), maSP)
            .input('tenSP', sql.NVarChar, tenSP)
            .input('hang', sql.NVarChar, hang)
            .input('tenLSP', sql.NVarChar, tenLSP)
            .input('giaBan', sql.Int, giaBan)
            .input('tonKho', sql.Int, tonKho)
            .input('trangThai', sql.Bit, trangThaiBit)
            .query(`
                UPDATE SanPham
                SET tenSP = @tenSP, hang = @hang, tenLSP = @tenLSP,
                    giaBan = @giaBan, tonKho = @tonKho, trangThai = @trangThai
                WHERE maSP = @maSP
            `);

        for (const file of danhSachFile) {
            await pool.request()
                .input('maSP', sql.Int, maSP)
                .input('duongDan', sql.VarChar, layUrlAnh(file.filename))
                .query(`INSERT INTO HinhAnhSanPham (maSP, duongDan) VALUES (@maSP, @duongDan)`);
        }

        return { message: "Cập nhật sản phẩm thành công" };
    }

    async xoa(maSP) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maSP', sql.Int, maSP)
            .query(`DELETE FROM SanPham WHERE maSP = @maSP`);

        return { message: "Xóa sản phẩm thành công" };
    }
}

module.exports = SanPhamService;
