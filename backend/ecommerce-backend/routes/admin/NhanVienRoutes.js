// file: routes/admin/NhanVienRoutes.js
// Mount ở /api vì gom hai nhóm đường dẫn: /nhanvien/... và /admin/nhanvien/...
const BaseRoutes = require('../BaseRoutes');
const { ROLES, requireAdmin } = require('../../middlewares/auth');

class NhanVienRoutes extends BaseRoutes {
    constructor(nhanVienController) {
        super('/api');
        this.nhanVienController = nhanVienController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.nhanVienController;
        this.router.get('/nhanvien', requireAdmin(), c.layDanhSach);
        // Quản lý nhân sự: chỉ Giám đốc + Quản lý. Việc gán / sửa / xóa chức vụ CV01, CV02 do service chặn tiếp (chỉ Giám đốc).
        this.router.post('/nhanvien/tao-tai-khoan', requireAdmin(...ROLES.QUAN_TRI), c.taoTaiKhoan);
        this.router.post('/admin/nhanvien/them', requireAdmin(...ROLES.QUAN_TRI), c.them);
        this.router.put('/admin/nhanvien/sua/:maNV', requireAdmin(...ROLES.QUAN_TRI), c.sua);
        this.router.delete('/admin/nhanvien/xoa/:maNV', requireAdmin(...ROLES.QUAN_TRI), c.xoa);
    }
}

module.exports = NhanVienRoutes;
