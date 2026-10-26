// file: routes/admin/NhanVienRoutes.js
// Mount ở /api vì gom hai nhóm đường dẫn: /nhanvien/... và /admin/nhanvien/...
const BaseRoutes = require('../BaseRoutes');

class NhanVienRoutes extends BaseRoutes {
    constructor(nhanVienController) {
        super('/api');
        this.nhanVienController = nhanVienController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.nhanVienController;
        this.router.get('/nhanvien', c.layDanhSach);
        this.router.post('/nhanvien/tao-tai-khoan', c.taoTaiKhoan);
        this.router.post('/admin/nhanvien/them', c.them);
        this.router.put('/admin/nhanvien/sua/:maNV', c.sua);
        this.router.delete('/admin/nhanvien/xoa/:maNV', c.xoa);
    }
}

module.exports = NhanVienRoutes;
