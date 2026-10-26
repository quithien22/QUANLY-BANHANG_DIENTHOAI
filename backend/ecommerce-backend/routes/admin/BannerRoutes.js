// file: routes/admin/BannerRoutes.js
// Cùng gốc /api/caidat/banner với GET của ContentRoutes (user) nhưng khác method nên không đụng nhau.
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');

class BannerRoutes extends BaseRoutes {
    constructor(bannerController) {
        super('/api/caidat/banner');
        this.bannerController = bannerController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.bannerController;
        this.router.post('/', upload.single('hinhAnh'), c.them);
        this.router.put('/trangthai/:id', c.doiTrangThai);
        this.router.delete('/:id', c.xoa);
    }
}

module.exports = BannerRoutes;
