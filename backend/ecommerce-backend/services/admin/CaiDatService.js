// file: services/admin/CaiDatService.js
// Cài đặt hệ thống: hồ sơ cá nhân, thông tin cửa hàng, vận chuyển, đổi mật khẩu.
const BaseService = require('../BaseService');
const HttpError = require('../../errors/HttpError');

class CaiDatService extends BaseService {
    // Trả về hồ sơ người đăng nhập (nếu có maNV) + cấu hình cửa hàng + vận chuyển
    async layTatCa(maNV) {
        const sql = this.sql;
        const pool = await this.getPool();

        const duLieuHeThong = await pool.request().query("SELECT * FROM CaiDatHeThong WHERE id = 1");
        const heThong = duLieuHeThong.recordset.length > 0 ? duLieuHeThong.recordset[0] : {};

        let hoSo = {};
        if (maNV) {
            try {
                const nguoiDung = await pool.request()
                    .input('maNV', sql.VarChar, maNV)
                    .query(`
                        SELECT hoTen, SDT AS soDienThoai, email, avatar AS anhDaiDien 
                        FROM NhanVien 
                        WHERE maNV = @maNV
                    `);
                if (nguoiDung.recordset.length > 0) hoSo = nguoiDung.recordset[0];
            } catch (loi) {
                console.log("Cảnh báo: Bảng NhanVien thiếu cột email hoặc avatar. Bỏ qua lấy hồ sơ.");
            }
        }

        let danhSachDonVi = [];
        try {
            if (heThong.donViHoTro) danhSachDonVi = JSON.parse(heThong.donViHoTro);
        } catch (loi) {
            console.log("Lỗi parse JSON donViHoTro:", loi);
        }

        return {
            hoSo,
            cuaHang: {
                tenCuaHang: heThong.tenCuaHang || "",
                diaChi: heThong.diaChi || "",
                hotline: heThong.hotline || "",
                logo: heThong.logo || "",
                moTa: heThong.moTa || ""
            },
            vanChuyen: {
                phiMacDinh: heThong.phiMacDinh || 0,
                nguongMienPhi: heThong.nguongMienPhi || 0,
                donViHoTro: danhSachDonVi
            }
        };
    }

    async capNhatHoSo({ maNV, hoTen, soDienThoai, email }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('SDT', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email || null)
            .query("UPDATE NhanVien SET hoTen = @hoTen, SDT = @SDT, email = @email WHERE maNV = @maNV");
    }

    // Giữ nguyên logic cũ: kiểm tra trong bảng TaiKhoan, so sánh mật khẩu dạng chữ thường
    async doiMatKhau({ maNV, hienTai, moi }) {
        const sql = this.sql;
        const pool = await this.getPool();

        const kiemTra = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('matKhauCu', sql.VarChar, hienTai)
            .query("SELECT * FROM TaiKhoan WHERE (tenDangNhap = @maNV OR maNV = @maNV) AND matKhau = @matKhauCu");

        if (kiemTra.recordset.length === 0) {
            throw new HttpError(400, "Mật khẩu hiện tại không đúng!");
        }

        await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('matKhauMoi', sql.VarChar, moi)
            .query("UPDATE TaiKhoan SET matKhau = @matKhauMoi WHERE (tenDangNhap = @maNV OR maNV = @maNV)");
    }

    async capNhatCuaHang({ tenCuaHang, diaChi, hotline, moTa }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('tenCuaHang', sql.NVarChar, tenCuaHang)
            .input('diaChi', sql.NVarChar, diaChi)
            .input('hotline', sql.VarChar, hotline)
            .input('moTa', sql.NVarChar, moTa)
            .query(`UPDATE CaiDatHeThong SET tenCuaHang=@tenCuaHang, diaChi=@diaChi, hotline=@hotline, moTa=@moTa WHERE id=1`);
    }

    async capNhatVanChuyen({ phiMacDinh, nguongMienPhi, donViHoTro }) {
        const sql = this.sql;
        const pool = await this.getPool();

        await pool.request()
            .input('phiMacDinh', sql.Float, phiMacDinh || 0)
            .input('nguongMienPhi', sql.Float, nguongMienPhi || 0)
            .input('donViHoTro', sql.NVarChar, JSON.stringify(donViHoTro))
            .query(`UPDATE CaiDatHeThong SET phiMacDinh=@phiMacDinh, nguongMienPhi=@nguongMienPhi, donViHoTro=@donViHoTro WHERE id=1`);
    }
}

module.exports = CaiDatService;
