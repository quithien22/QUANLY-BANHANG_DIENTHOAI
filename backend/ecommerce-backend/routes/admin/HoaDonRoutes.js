// file: routes/admin/HoaDonRoutes.js
// Cùng đường dẫn gốc /api/hoadon với OrderRoutes của user nhưng các route con khác nhau nên không đụng nhau.
const BaseRoutes = require('../BaseRoutes');
const { requireAdmin } = require('../../middlewares/auth');

class HoaDonRoutes extends BaseRoutes {
    constructor(hoaDonController) {
        super('/api/hoadon');
        this.hoaDonController = hoaDonController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.hoaDonController;
        this.router.get('/', requireAdmin(), c.layDanhSach);
        this.router.get('/toanbo', requireAdmin(), c.layToanBo);
        this.router.get('/chitiet/:maHoaDon', requireAdmin(), c.layChiTiet);
        this.router.put('/capnhat-trangthai/:maHoaDon', requireAdmin(), c.capNhatTrangThai);
    }
}

module.exports = HoaDonRoutes;
