// file: services/OrderService.js
// Đặt hàng, hủy đơn, xem đơn hàng của khách.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class OrderService extends BaseService {
    // Tạo địa chỉ (nếu chưa có) -> hóa đơn -> chi tiết -> thanh toán -> vận chuyển
    // -> xóa giỏ hàng. Tất cả trong 1 transaction.
    async placeOrder({ maKH, hoTen, sdt, diaChi, phuongThuc, maKM, danhSachSanPham }) {
        const sql = this.sql;

        if (!maKH || !hoTen || !sdt || !diaChi || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
            throw new HttpError(400, "Thiếu thông tin bắt buộc để đặt hàng.");
        }

        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Tìm địa chỉ trùng trong sổ địa chỉ, chưa có thì thêm mới
            const kiemTraKetQua = await new sql.Request(transaction)
                .input('maKH', sql.VarChar(20), maKH)
                .input('hoTenNguoiNhan', sql.NVarChar(50), hoTen)
                .input('SDT', sql.VarChar(15), sdt)
                .input('diaChiChiTiet', sql.NVarChar(sql.MAX), diaChi)
                .query(`
                    SELECT maDiaChi FROM DiaChiGiaoHang 
                    WHERE maKH = @maKH 
                      AND hoTenNguoiNhan = @hoTenNguoiNhan 
                      AND SDT = @SDT 
                      AND diaChiChiTiet = @diaChiChiTiet
                `);

            let maDiaChi;
            if (kiemTraKetQua.recordset.length > 0) {
                maDiaChi = kiemTraKetQua.recordset[0].maDiaChi;
            } else {
                const ketQuaThem = await new sql.Request(transaction)
                    .input('maKH', sql.VarChar(20), maKH)
                    .input('hoTenNguoiNhan', sql.NVarChar(50), hoTen)
                    .input('SDT', sql.VarChar(15), sdt)
                    .input('diaChiChiTiet', sql.NVarChar(sql.MAX), diaChi)
                    .query(`
                        INSERT INTO DiaChiGiaoHang (maKH, hoTenNguoiNhan, SDT, diaChiChiTiet, macDinh)
                        OUTPUT INSERTED.maDiaChi
                        VALUES (@maKH, @hoTenNguoiNhan, @SDT, @diaChiChiTiet, 0)
                    `);
                maDiaChi = ketQuaThem.recordset[0].maDiaChi;
            }

            // 2. Tính tổng tiền theo giá thực tế gửi lên
            let tongTienHang = 0;
            for (const sp of danhSachSanPham) {
                sp.giaThucTe = Number(sp.gia) || Number(sp.giaBan) || 0;
                tongTienHang += sp.giaThucTe * (Number(sp.soLuong) || 0);
            }
            const tongTienCuoi = tongTienHang;

            // 3. Hóa đơn
            const maHoaDon = 'HD' + Date.now();
            await new sql.Request(transaction)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .input('tongTien', sql.Float, tongTienCuoi)
                .input('maKH', sql.VarChar(20), maKH)
                .input('maKM', sql.VarChar(20), maKM || null)
                .input('maDiaChi', sql.Int, maDiaChi)
                .query(`
                    INSERT INTO HoaDon (maHoaDon, tongTien, maKH, maNV, maKM, maDiaChi, thoiGianLap, trangThai)
                    VALUES (@maHoaDon, @tongTien, @maKH, NULL, @maKM, @maDiaChi, GETDATE(), 'cho_xac_nhan')
                `);

            // 4. Chi tiết hóa đơn
            for (const sp of danhSachSanPham) {
                await new sql.Request(transaction)
                    .input('maHoaDon', sql.VarChar(20), maHoaDon)
                    .input('maSP', sql.VarChar(20), sp.maSP)
                    .input('maBienThe', sql.VarChar(20), sp.maBienThe || null)
                    .input('soLuong', sql.Int, sp.soLuong)
                    .input('giaBan', sql.Float, sp.giaThucTe)
                    .query(`
                        INSERT INTO ChiTietHoaDon (maHoaDon, maSP, maBienThe, soLuong, giaBan)
                        VALUES (@maHoaDon, @maSP, @maBienThe, @soLuong, @giaBan)
                    `);
            }

            // 5. Thanh toán
            const maThanhToan = 'TT' + Date.now();
            await new sql.Request(transaction)
                .input('maThanhToan', sql.VarChar(20), maThanhToan)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .input('phuongThuc', sql.VarChar(30), phuongThuc || 'cod')
                .input('soTien', sql.Float, tongTienCuoi)
                .query(`
                    INSERT INTO ThanhToan (maThanhToan, maHoaDon, phuongThuc, soTien, trangThai, thoiGian)
                    VALUES (@maThanhToan, @maHoaDon, @phuongThuc, @soTien, 'cho_thanh_toan', GETDATE())
                `);

            // 6. Vận chuyển
            const maVanChuyen = 'VC' + Date.now();
            await new sql.Request(transaction)
                .input('maVanChuyen', sql.VarChar(20), maVanChuyen)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query(`
                    INSERT INTO VanChuyen (maVanChuyen, maHoaDon, donViVanChuyen, maVanDon, phiVanChuyen, trangThai, ngayGiaoDuKien)
                    VALUES (@maVanChuyen, @maHoaDon, NULL, NULL, 0, 'cho_lay_hang', DATEADD(day, 3, GETDATE()))
                `);

            // 7. Xóa giỏ hàng của khách
            await new sql.Request(transaction)
                .input('maKH', sql.VarChar(20), maKH)
                .query(`DELETE FROM GioHang WHERE maKH = @maKH`);

            await transaction.commit();
            return { maHoaDon, tongTien: tongTienCuoi };
        } catch (err) {
            // Có lỗi giữa chừng -> hoàn tác để không để lại transaction treo
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }
    }

    // Chỉ hủy được đơn đang ở trạng thái 'cho_xac_nhan'
    async cancelOrder(maHoaDon) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                UPDATE HoaDon 
                SET trangThai = 'da_huy' 
                WHERE maHoaDon = @maHoaDon AND trangThai = 'cho_xac_nhan'
            `);

        if (result.rowsAffected[0] === 0) {
            throw new HttpError(400, "Không thể hủy đơn hàng này (có thể đã được xử lý).");
        }

        await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                UPDATE VanChuyen 
                SET trangThai = 'da_huy' 
                WHERE maHoaDon = @maHoaDon
            `);
    }

    // Trang "Đơn hàng của bạn": mỗi đơn kèm danh sách sản phẩm
    async getOrdersByCustomer(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const orderResult = await pool.request()
            .input('maKH', sql.VarChar(20), maKH)
            .query(`
                SELECT hd.maHoaDon, hd.tongTien, hd.thoiGianLap, hd.trangThai, 
                       vc.ngayGiaoDuKien, 
                       dc.hoTenNguoiNhan, dc.SDT, dc.diaChiChiTiet,
                       tt.phuongThuc
                FROM HoaDon hd
                LEFT JOIN VanChuyen vc ON hd.maHoaDon = vc.maHoaDon
                LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
                LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
                WHERE hd.maKH = @maKH
                ORDER BY hd.thoiGianLap DESC
            `);

        const danhSachDonHang = orderResult.recordset;

        for (const donHang of danhSachDonHang) {
            const detailResult = await pool.request()
                .input('maHoaDon', sql.VarChar(20), donHang.maHoaDon)
                .query(`
                    SELECT ct.soLuong, ct.giaBan, sp.tenSP, sp.hinhAnh, bt.giaTri as mauSac
                    FROM ChiTietHoaDon ct
                    JOIN SanPham sp ON ct.maSP = sp.maSP
                    LEFT JOIN BienTheSanPham bt ON ct.maBienThe = bt.maBienThe
                    WHERE ct.maHoaDon = @maHoaDon
                `);
            donHang.chiTietSanPham = detailResult.recordset;
        }

        return danhSachDonHang;
    }

    // Trang "Lịch sử mua hàng"
    async getHistory(maKH) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maKH', sql.VarChar, maKH)
            .query(`
                SELECT 
                    hd.maHoaDon, 
                    hd.tongTien, 
                    hd.maKH, 
                    hd.maNV, 
                    hd.maKM, 
                    hd.maDiaChi, 
                    hd.thoiGianLap, 
                    hd.trangThai,
                    kh.hoTen as hoTenKhachHang,
                    dcgh.hoTenNguoiNhan,
                    dcgh.SDT,
                    dcgh.diaChiChiTiet
                FROM HoaDon hd
                JOIN KhachHang kh ON hd.maKH = kh.maKH
                LEFT JOIN DiaChiGiaoHang dcgh ON hd.maDiaChi = dcgh.maDiaChi
                WHERE hd.maKH = @maKH
                ORDER BY hd.thoiGianLap DESC
            `);
        return result.recordset;
    }

    // Chi tiết sản phẩm của 1 hóa đơn (dùng cho "Đặt lại đơn hàng")
    async getOrderItems(maHoaDon) {
        const sql = this.sql;
        const pool = await this.getPool();

        const result = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                SELECT 
                    cthd.maHoaDon, 
                    cthd.maSP, 
                    cthd.soLuong, 
                    cthd.giaBan AS donGia, 
                    sp.tenSP, 
                    sp.hinhAnh
                FROM ChiTietHoaDon cthd
                JOIN SanPham sp ON cthd.maSP = sp.maSP
                WHERE cthd.maHoaDon = @maHoaDon
            `);
        return result.recordset;
    }
}

module.exports = OrderService;
