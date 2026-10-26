// file: services/admin/ChamCongService.js
// Chấm công và lương nhân viên.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class ChamCongService extends BaseService {
    // Bảng chấm công + lương của toàn bộ nhân viên theo tháng/năm (mỗi ngày đi làm là 1 dòng)
    async layBang(thang, nam) {
        const sql = this.sql;
        const pool = await this.getPool();

        const ketQua = await pool.request()
            .input('thang', sql.Int, thang || new Date().getMonth() + 1)
            .input('nam', sql.Int, nam || new Date().getFullYear())
            .query(`
                SELECT 
                    nv.maNV, 
                    nv.hoTen, 
                    cv.tenCV,
                    cc.thoiGianChamCong,
                    l.luongCoBan, 
                    l.luongThuong, 
                    l.luongThucNhan,
                    (
                        SELECT COUNT(*) 
                        FROM ChamCong 
                         WHERE maNV = nv.maNV 
                          AND MONTH(thoiGianChamCong) = @thang 
                          AND YEAR(thoiGianChamCong) = @nam
                    ) AS tongNgayCong
                FROM NhanVien nv
                LEFT JOIN ChucVu cv ON nv.maCV = cv.maCV  
                LEFT JOIN ChamCong cc ON nv.maNV = cc.maNV 
                     AND MONTH(cc.thoiGianChamCong) = @thang 
                     AND YEAR(cc.thoiGianChamCong) = @nam
                LEFT JOIN Luong l ON nv.maNV = l.maNV
            `);

        return ketQua.recordset;
    }

    // Tự động chấm công khi nhân viên đăng nhập: mỗi ngày chỉ chèn 1 bản ghi
    async chamCongTuDong(maNV) {
        const sql = this.sql;

        if (!maNV) {
            throw new HttpError(400, "Thiếu mã nhân viên!");
        }

        const pool = await this.getPool();

        const daCham = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(`
                SELECT * FROM ChamCong 
                WHERE maNV = @maNV AND CAST(thoiGianChamCong AS DATE) = CAST(GETDATE() AS DATE)
            `);

        if (daCham.recordset.length === 0) {
            await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query(`
                    INSERT INTO ChamCong (maNV, thoiGianChamCong) 
                    VALUES (@maNV, GETDATE())
                `);
            return { message: "Đã tự động chấm công cho hôm nay." };
        }

        return { message: "Hôm nay nhân viên này đã được chấm công trước đó rồi." };
    }

    // Tính / cập nhật lương cả tháng.
    // Lương thực nhận = (lương cơ bản / 26 ngày chuẩn) * số ngày làm + thưởng
    async tinhLuong(thang, nam) {
        const sql = this.sql;
        const pool = await this.getPool();

        const dsChamCong = await pool.request()
            .input('thang', sql.Int, thang)
            .input('nam', sql.Int, nam)
            .query(`
                SELECT maNV, COUNT(thoiGianChamCong) AS soNgayLam
                FROM ChamCong
                WHERE MONTH(thoiGianChamCong) = @thang AND YEAR(thoiGianChamCong) = @nam
                GROUP BY maNV
            `);

        for (const { maNV, soNgayLam } of dsChamCong.recordset) {
            // Chưa có bảng lương thì mặc định lương cơ bản 10 triệu, thưởng 500 nghìn
            const thongTin = await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query(`
                    SELECT ISNULL(l.luongCoBan, 10000000) AS luongCoBan, ISNULL(l.luongThuong, 500000) AS luongThuong
                    FROM NhanVien nv
                    LEFT JOIN Luong l ON nv.maNV = l.maNV
                    WHERE nv.maNV = @maNV
                `);

            const luongCoBan = thongTin.recordset.length > 0 ? thongTin.recordset[0].luongCoBan : 10000000;
            const luongThuong = thongTin.recordset.length > 0 ? thongTin.recordset[0].luongThuong : 500000;

            const luongThucNhan = Math.round((Number(luongCoBan) / 26.0) * soNgayLam + Number(luongThuong));

            const daCoLuong = await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .query("SELECT * FROM Luong WHERE maNV = @maNV");

            if (daCoLuong.recordset.length > 0) {
                await pool.request()
                    .input('maNV', sql.VarChar, maNV)
                    .input('tongNgayCong', sql.Int, soNgayLam)
                    .input('luongThucNhan', sql.Decimal(15, 2), luongThucNhan)
                    .query(`
                        UPDATE Luong 
                        SET tongNgayCong = @tongNgayCong, luongThucNhan = @luongThucNhan 
                        WHERE maNV = @maNV
                    `);
            } else {
                const maLuong = 'L' + maNV + Date.now().toString().slice(-4);
                await pool.request()
                    .input('maLuong', sql.VarChar, maLuong)
                    .input('maNV', sql.VarChar, maNV)
                    .input('tongNgayCong', sql.Int, soNgayLam)
                    .input('luongCoBan', sql.Decimal(15, 2), luongCoBan)
                    .input('luongThuong', sql.Decimal(15, 2), luongThuong)
                    .input('luongThucNhan', sql.Decimal(15, 2), luongThucNhan)
                    .query(`
                        INSERT INTO Luong (maLuong, maNV, tongNgayCong, luongCoBan, luongThuong, luongThucNhan)
                        VALUES (@maLuong, @maNV, @tongNgayCong, @luongCoBan, @luongThuong, @luongThucNhan)
                    `);
            }
        }

        return { message: "Tính toán và cập nhật lương thành công!" };
    }

    // Sửa lương cơ bản / thưởng. CHỈ Giám đốc (CV01) được phép
    async capNhatLuongCoBan(maNV, { luongCoBanMoi, luongThuongMoi, maCVNguoiThaoTac }) {
        const sql = this.sql;

        if (maCVNguoiThaoTac !== 'CV01') {
            throw new HttpError(403, "Bạn không có quyền tăng hoặc sửa lương nhân viên! Chỉ có Giám đốc mới thực hiện được.");
        }

        const pool = await this.getPool();

        const daCoLuong = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query("SELECT * FROM Luong WHERE maNV = @maNV");

        if (daCoLuong.recordset.length > 0) {
            await pool.request()
                .input('maNV', sql.VarChar, maNV)
                .input('luongCoBan', sql.Decimal(15, 2), luongCoBanMoi)
                .input('luongThuong', sql.Decimal(15, 2), luongThuongMoi || 0)
                .query(`
                    UPDATE Luong 
                    SET luongCoBan = @luongCoBan, luongThuong = ISNULL(@luongThuong, luongThuong)
                    WHERE maNV = @maNV
                `);
        } else {
            await pool.request()
                .input('maLuong', sql.VarChar, 'L' + maNV)
                .input('maNV', sql.VarChar, maNV)
                .input('luongCoBan', sql.Decimal(15, 2), luongCoBanMoi)
                .input('luongThuong', sql.Decimal(15, 2), luongThuongMoi || 0)
                .input('tongNgayCong', sql.Int, 0)
                .input('luongThucNhan', sql.Decimal(15, 2), luongCoBanMoi)
                .query(`
                    INSERT INTO Luong (maLuong, maNV, tongNgayCong, luongCoBan, luongThuong, luongThucNhan)
                    VALUES (@maLuong, @maNV, @tongNgayCong, @luongCoBan, @luongThuong, @luongThucNhan)
                `);
        }

        return { message: "Cập nhật mức lương thành công!" };
    }
}

module.exports = ChamCongService;
