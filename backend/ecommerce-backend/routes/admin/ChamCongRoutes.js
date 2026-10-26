// file: routes/admin/ChamCongRoutes.js
// Mount ở /api vì gom hai nhóm: /chamcong/... và /luong/...
const BaseRoutes = require('../BaseRoutes');

class ChamCongRoutes extends BaseRoutes {
    constructor(chamCongController) {
        super('/api');
        this.chamCongController = chamCongController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.chamCongController;
        this.router.get('/chamcong', c.layBang);
        this.router.post('/chamcong/tu-dong', c.chamCongTuDong);
        this.router.post('/luong/tinh-toan', c.tinhLuong);
        this.router.put('/luong/cap-nhat-co-ban/:maNV', c.capNhatLuongCoBan);
    }
}

module.exports = ChamCongRoutes;
