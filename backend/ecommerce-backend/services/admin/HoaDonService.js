// file: services/admin/HoaDonService.js
// Quản lý hóa đơn / đơn hàng phía admin: xem danh sách, đổi trạng thái (kèm cộng/trừ điểm tích lũy, hoàn/trừ tồn kho).
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class HoaDonService extends BaseService {
    // Danh sách hóa đơn dạng gọn (mới nhất trước)
    async layDanhSach() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            SELECT hd.maHoaDon, hd.tongTien, hd.thoiGianLap, hd.trangThai,
                   ISNULL(kh.hoTen, dc.hoTenNguoiNhan) AS tenKhachHang,
                   ISNULL(kh.SDT, dc.SDT) AS soDienThoai
            FROM HoaDon hd
            LEFT JOIN KhachHang kh ON hd.maKH = kh.maKH
            LEFT JOIN DiaChiGiaoHang dc ON hd.maDiaChi = dc.maDiaChi
            ORDER BY hd.thoiGianLap DESC
        `);
        return ketQua.recordset;
    }

    // Danh sách đầy đủ cho trang Quản lý đơn hàng (kèm tên SP đầu tiên, ảnh, tổng số lượng...)
    // thoiGianLap: chuỗi dd/MM/yyyy để hiển thị; thoiGianLapGoc: ngày giờ gốc để lọc theo ngày.
    async layToanBo() {
        const pool = await this.getPool();
        const ketQua = await pool.request().query(`
            WITH TongSoLuongHD AS (
                SELECT maHoaDon, SUM(CAST(soLuong AS INT)) AS tongSoLuongSP
                FROM ChiTietHoaDon
                GROUP BY maHoaDon
            )
            SELECT 
                h.maHoaDon, 
                h.tongTien, 
                FORMAT(h.thoiGianLap, 'dd/MM/yyyy') AS thoiGianLap,
                h.thoiGianLap AS thoiGianLapGoc,
                h.trangThai,
                ISNULL(k.hoTen, dc.hoTenNguoiNhan) AS tenKhachHang, 
                ISNULL(NULLIF(k.SDT, ''), dc.SDT) AS sdtKhachHang,
                nv.hoTen AS tenNhanVien,
                ISNULL(tsl.tongSoLuongSP, 0) AS tongSoLuongSP,
                (
                    SELECT TOP 1 sp.tenSP 
                    FROM ChiTietHoaDon ct 
                    JOIN SanPham sp ON ct.maSP = sp.maSP 
                    WHERE ct.maHoaDon = h.maHoaDon
                ) AS tenSanPham,
                (
                    SELECT TOP 1 sp.hinhAnh 
                    FROM ChiTietHoaDon ct 
                    JOIN SanPham sp ON ct.maSP = sp.maSP 
                    WHERE ct.maHoaDon = h.maHoaDon
                ) AS img
            FROM HoaDon h
            LEFT JOIN KhachHang k ON h.maKH = k.maKH
            LEFT JOIN NhanVien nv ON h.maNV = nv.maNV
            LEFT JOIN DiaChiGiaoHang dc ON h.maDiaChi = dc.maDiaChi
            LEFT JOIN TongSoLuongHD tsl ON h.maHoaDon = tsl.maHoaDon
            ORDER BY h.thoiGianLap DESC
        `);
        return ketQua.recordset;
    }

    // Chi tiết 1 đơn: người nhận, địa chỉ, thanh toán, vận chuyển và TOÀN BỘ sản phẩm trong đơn
    async layChiTiet(maHoaDon) {
        const sql = this.sql;
        const pool = await this.getPool();

        const thongTin = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                SELECT h.maHoaDon, h.tongTien, h.thoiGianLap, h.trangThai, h.maKM,
                       k.hoTen AS tenKhachHang,
                       ISNULL(NULLIF(k.SDT, ''), dc.SDT) AS soDienThoai,
                       dc.hoTenNguoiNhan, dc.SDT AS sdtNguoiNhan, dc.diaChiChiTiet,
                       tt.phuongThuc, tt.trangThai AS trangThaiThanhToan,
                       vc.trangThai AS trangThaiVanChuyen, vc.ngayGiaoDuKien
                FROM HoaDon h
                LEFT JOIN KhachHang k ON h.maKH = k.maKH
                LEFT JOIN DiaChiGiaoHang dc ON h.maDiaChi = dc.maDiaChi
                LEFT JOIN ThanhToan tt ON h.maHoaDon = tt.maHoaDon
                LEFT JOIN VanChuyen vc ON h.maHoaDon = vc.maHoaDon
                WHERE h.maHoaDon = @maHoaDon
            `);

        if (thongTin.recordset.length === 0) {
            throw new HttpError(404, "Không tìm thấy hóa đơn");
        }

        const sanPham = await pool.request()
            .input('maHoaDon', sql.VarChar, maHoaDon)
            .query(`
                SELECT ct.maSP, ct.soLuong, ct.giaBan, sp.tenSP, sp.hinhAnh,
                       bt.giaTri AS phanLoai
                FROM ChiTietHoaDon ct
                JOIN SanPham sp ON ct.maSP = sp.maSP
                LEFT JOIN BienTheSanPham bt ON ct.maBienThe = bt.maBienThe
                WHERE ct.maHoaDon = @maHoaDon
            `);

        return { thongTin: thongTin.recordset[0], sanPham: sanPham.recordset };
    }

    // Đổi trạng thái đơn hàng. Toàn bộ nằm trong 1 transaction.
    //  - Đơn chuyển sang 'hoan_tat'  -> cộng điểm (1 điểm / 100.000đ)
    //  - Đơn đang 'hoan_tat' bị đổi sang trạng thái khác -> trừ lại điểm đã cộng
    //  - Đơn chuyển sang 'da_huy'    -> HOÀN tồn kho (hàng đã bị trừ lúc khách đặt) và hủy vận chuyển.
    //    Trước đây admin hủy đơn thì tồn kho không được hoàn -> hàng "mất" khỏi kho.
    //  - Đơn đang 'da_huy' được mở lại -> trừ tồn kho lại (không đủ hàng thì báo 409, không đổi gì)
    // options.dongBoVanChuyen = false: bỏ qua việc cập nhật bảng VanChuyen (dùng khi chính VanChuyenService gọi vào,
    // vì nó đã tự cập nhật trạng thái vận chuyển).
    async capNhatTrangThai(maHoaDon, trangThai, { dongBoVanChuyen = true } = {}) {
        const sql = this.sql;

        if (typeof trangThai !== 'string' || !trangThai.trim()) {
            throw new HttpError(400, "Thiếu trạng thái mới của đơn hàng.");
        }

        const pool = await this.getPool();
        const giaoDich = new sql.Transaction(pool);
        await giaoDich.begin();

        try {
            // Khóa dòng hóa đơn: 2 người cùng đổi trạng thái không được hoàn kho / cộng điểm 2 lần
            const hdCu = await new sql.Request(giaoDich)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query(`
                    SELECT maKH, tongTien, trangThai AS trangThaiCu
                    FROM HoaDon WITH (UPDLOCK, HOLDLOCK)
                    WHERE maHoaDon = @maHoaDon
                `);

            if (hdCu.recordset.length === 0) {
                throw new HttpError(404, "Không tìm thấy hóa đơn");
            }

            const hd = hdCu.recordset[0];
            const trangThaiCu = hd.trangThaiCu;

            await new sql.Request(giaoDich)
                .input('trangThai', sql.VarChar(30), trangThai)
                .input('maHoaDon', sql.VarChar(20), maHoaDon)
                .query("UPDATE HoaDon SET trangThai = @trangThai WHERE maHoaDon = @maHoaDon");

            // ---- Tồn kho khi hủy / mở lại đơn ----
            const vuaHuy = trangThai === 'da_huy' && trangThaiCu !== 'da_huy';
            const vuaMoLai = trangThaiCu === 'da_huy' && trangThai !== 'da_huy';

            if (vuaHuy) {
                await new sql.Request(giaoDich)
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

                if (dongBoVanChuyen) {
                    await new sql.Request(giaoDich)
                        .input('maHoaDon', sql.VarChar(20), maHoaDon)
                        .query("UPDATE VanChuyen SET trangThai = 'da_huy' WHERE maHoaDon = @maHoaDon");
                }
            } else if (vuaMoLai) {
                const dongHang = await new sql.Request(giaoDich)
                    .input('maHoaDon', sql.VarChar(20), maHoaDon)
                    .query(`
                        SELECT maSP, SUM(soLuong) AS tongSL
                        FROM ChiTietHoaDon
                        WHERE maHoaDon = @maHoaDon
                        GROUP BY maSP
                        ORDER BY maSP
                    `);

                for (const { maSP, tongSL } of dongHang.recordset) {
                    const kq = await new sql.Request(giaoDich)
                        .input('maSP', sql.VarChar(20), maSP)
                        .input('soLuong', sql.Int, tongSL)
                        .query(`
                            UPDATE SanPham SET tonKho = tonKho - @soLuong
                            WHERE maSP = @maSP AND tonKho >= @soLuong
                        `);
                    if (kq.rowsAffected[0] === 0) {
                        throw new HttpError(409, `Không đủ tồn kho để mở lại đơn hàng (sản phẩm ${maSP}).`);
                    }
                }

                if (dongBoVanChuyen) {
                    await new sql.Request(giaoDich)
                        .input('maHoaDon', sql.VarChar(20), maHoaDon)
                        .query("UPDATE VanChuyen SET trangThai = 'cho_lay_hang' WHERE maHoaDon = @maHoaDon");
                }
            }

            // ---- Logic tích điểm ----
            if (hd.maKH) {
                const diemThayDoi = Math.floor(Number(hd.tongTien) / 100000);

                if (trangThai === 'hoan_tat' && trangThaiCu !== 'hoan_tat' && diemThayDoi > 0) {
                    await new sql.Request(giaoDich)
                        .input('diemCong', sql.Int, diemThayDoi)
                        .input('maKH', sql.VarChar(20), hd.maKH)
                        .query("UPDATE KhachHang SET diemTichLuy = ISNULL(diemTichLuy, 0) + @diemCong WHERE maKH = @maKH");
                }

                if (trangThaiCu === 'hoan_tat' && trangThai !== 'hoan_tat' && diemThayDoi > 0) {
                    await new sql.Request(giaoDich)
                        .input('diemTru', sql.Int, diemThayDoi)
                        .input('maKH', sql.VarChar(20), hd.maKH)
                        .query("UPDATE KhachHang SET diemTichLuy = ISNULL(diemTichLuy, 0) - @diemTru WHERE maKH = @maKH");
                }

                // Đồng bộ lại tổng số đơn của khách
                await new sql.Request(giaoDich)
                    .input('maKH', sql.VarChar(20), hd.maKH)
                    .query(`
                        UPDATE KhachHang 
                        SET tongDonHang = (SELECT COUNT(*) FROM HoaDon WHERE maKH = @maKH)
                        WHERE maKH = @maKH
                    `);
            }

            await giaoDich.commit();
        } catch (loi) {
            try { await giaoDich.rollback(); } catch (_) { /* transaction đã đóng */ }
            throw loi;
        }

        return { message: "Cập nhật trạng thái thành công!" };
    }
}

module.exports = HoaDonService;
