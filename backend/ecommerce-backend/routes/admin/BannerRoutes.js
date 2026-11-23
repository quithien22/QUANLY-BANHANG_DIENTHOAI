// file: routes/admin/BannerRoutes.js
// Cùng gốc /api/caidat/banner với GET của ContentRoutes (user, công khai) nhưng khác method nên không đụng nhau.
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');
const { requireAdmin } = require('../../middlewares/auth');

class BannerRoutes extends BaseRoutes {
    constructor(bannerController) {
        super('/api/caidat/banner');
        this.bannerController = bannerController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.bannerController;
        // requireAdmin đứng TRƯỚC upload để người lạ không ghi được file nào lên đĩa
        this.router.post('/', requireAdmin(), upload.single('hinhAnh'), c.them);
        this.router.put('/trangthai/:id', requireAdmin(), c.doiTrangThai);
        this.router.delete('/:id', requireAdmin(), c.xoa);
    }
}

module.exports = BannerRoutes;
