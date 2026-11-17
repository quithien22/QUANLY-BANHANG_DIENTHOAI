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

            // 2.5. Chuyển hàng ĐANG GIỮ trong giỏ thành đơn, chỉ trừ kho phần còn thiếu.
            // - Khi thêm vào giỏ, CartService đã trừ tonKho (giữ hàng 15 phút). Nếu ở đây trừ lại
            //   toàn bộ thì mỗi đơn bị trừ kho 2 lần.
            // - Cách làm: lấy các dòng giỏ của khách (đang giữ bao nhiêu mỗi sản phẩm = daGiu), xóa giỏ,
            //   rồi với từng sản phẩm cập nhật đúng phần chênh: tonKho = tonKho + daGiu - daDat.
            //     + Mua từ giỏ:  daGiu = daDat  -> tồn kho không đổi
            //     + Mua ngay:    daGiu = 0      -> trừ đúng như trước đây
            //     + Giỏ giữ dư so với đơn (hoặc sản phẩm không có trong đơn) -> hoàn phần dư
            // - Dòng giỏ quá 15 phút nhưng job chưa kịp dọn vẫn đang giữ kho nên vẫn tính vào daGiu;
            //   nếu hàng đã bị người khác mua mất thì điều kiện bên dưới sẽ báo hết hàng (409).
            // - Khóa theo thứ tự GioHang -> SanPham (sắp theo maSP) để tránh deadlock.
            // - Câu UPDATE giữ khóa ghi tới khi commit: người đến sau phải chờ, rồi đánh giá lại
            //   điều kiện -> nếu hết hàng thì rowsAffected = 0.
            const gioHangDangGiu = await new sql.Request(transaction)
                .input('maKH', sql.VarChar(20), maKH)
                .query(`SELECT maSP, soLuong FROM GioHang WITH (UPDLOCK, HOLDLOCK) WHERE maKH = @maKH`);

            const daGiu = new Map();
            for (const dong of gioHangDangGiu.recordset) {
                const key = String(dong.maSP);
                daGiu.set(key, (daGiu.get(key) || 0) + Number(dong.soLuong));
            }

            // Xóa giỏ của khách (đơn đã gom hết hàng đang giữ). Rollback thì giỏ tự quay lại.
            await new sql.Request(transaction)
                .input('maKH', sql.VarChar(20), maKH)
                .query(`DELETE FROM GioHang WHERE maKH = @maKH`);

            // Gộp các dòng cùng maSP (khác màu/dung lượng) vì tồn kho tính theo sản phẩm.
            const canDat = new Map();
            for (const sp of danhSachSanPham) {
                const sl = Number(sp.soLuong) || 0;
                if (!sp.maSP || sl <= 0) {
                    throw new HttpError(400, "Thông tin sản phẩm hoặc số lượng không hợp lệ.");
                }
                const key = String(sp.maSP);
                canDat.set(key, (canDat.get(key) || 0) + sl);
            }

            const dsMaSP = [...new Set([...canDat.keys(), ...daGiu.keys()])].sort((a, b) => a.localeCompare(b));

            for (const maSP of dsMaSP) {
                const daDat = canDat.get(maSP) || 0;
                const giu = daGiu.get(maSP) || 0;

                const ketQuaCapNhatKho = await new sql.Request(transaction)
                    .input('maSP', sql.VarChar(20), maSP)
                    .input('daGiu', sql.Int, giu)
                    .input('daDat', sql.Int, daDat)
                    .query(`
                        UPDATE SanPham
                        SET tonKho = tonKho + @daGiu - @daDat
                        WHERE maSP = @maSP
                          AND (@daDat = 0 OR trangThai = 1)
                          AND tonKho + @daGiu >= @daDat
                    `);

                if (ketQuaCapNhatKho.rowsAffected[0] === 0 && daDat > 0) {
                    throw new HttpError(409, "Sản phẩm đã hết hàng hoặc không đủ số lượng, vui lòng kiểm tra lại giỏ hàng.");
                }
            }

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

            // 7. Giỏ hàng của khách đã được xóa ở bước 2.5 (cùng transaction)

            await transaction.commit();
            return { maHoaDon, tongTien: tongTienCuoi };
        } catch (err) {
            // Có lỗi giữa chừng -> hoàn tác để không để lại transaction treo
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }
    }

    // Chỉ hủy được đơn đang ở trạng thái 'cho_xac_nhan'.
    // Hủy + hoàn tồn kho + hủy vận chuyển nằm trong 1 transaction.
    async cancelOrder(maHoaDon) {
        const sql = this.sql;
        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // UPDATE có điều kiện trạng thái: chỉ 1 người hủy thành công (rowsAffected = 1),
            // nên bấm hủy 2 lần / 2 request song song cũng không hoàn kho 2 lần.
            const result = await new sql.Request(transaction)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query(`
                    UPDATE HoaDon
                    SET trangThai = 'da_huy'
                    WHERE maHoaDon = @maHoaDon AND trangThai = 'cho_xac_nhan'
                `);

            if (result.rowsAffected[0] === 0) {
                throw new HttpError(400, "Không thể hủy đơn hàng này (có thể đã được xử lý).");
            }

            // Hoàn tồn kho. Gộp theo maSP trước khi JOIN, nếu không UPDATE...FROM
            // chỉ cộng 1 dòng cho mỗi sản phẩm khi đơn có nhiều dòng cùng maSP.
            await new sql.Request(transaction)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query(`
                    UPDATE sp
                    SET sp.tonKho = sp.tonKho + ct.tongSL
                    FROM SanPham sp
                    JOIN (
                        SELECT maSP, SUM(soLuong) AS tongSL
                        FROM ChiTietHoaDon
                        WHERE maHoaDon = @maHoaDon
                        GROUP BY maSP
                    ) ct ON sp.maSP = ct.maSP
                `);

            await new sql.Request(transaction)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query(`
                    UPDATE VanChuyen
                    SET trangThai = 'da_huy'
                    WHERE maHoaDon = @maHoaDon
                `);

            await transaction.commit();
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw err;
        }
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
                    dcgh.diaChiChiTiet,
                    tt.phuongThuc,
                    vc.ngayGiaoDuKien
                FROM HoaDon hd
                JOIN KhachHang kh ON hd.maKH = kh.maKH
                LEFT JOIN DiaChiGiaoHang dcgh ON hd.maDiaChi = dcgh.maDiaChi
                LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
                LEFT JOIN VanChuyen vc ON hd.maHoaDon = vc.maHoaDon
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
                    cthd.maSP, cthd.maBienThe, bt.giaTri AS phanLoai, 
                    cthd.soLuong, 
                    cthd.giaBan AS donGia, 
                    sp.tenSP, 
                    sp.hinhAnh
                FROM ChiTietHoaDon cthd
                JOIN SanPham sp ON cthd.maSP = sp.maSP
                LEFT JOIN BienTheSanPham bt ON cthd.maBienThe = bt.maBienThe
                WHERE cthd.maHoaDon = @maHoaDon
            `);
        return result.recordset;
    }
}

module.exports = OrderService;
