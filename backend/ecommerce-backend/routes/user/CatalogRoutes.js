// file: routes/CatalogRoutes.js
// Mount ở /api. Lưu ý: KHÔNG khai báo GET /api/sanpham và GET /api/thuonghieu ở đây,
// vì hai đường dẫn đó đang do route admin trong server.js phục vụ (đăng ký trước).
const BaseRoutes = require('../BaseRoutes');

class CatalogRoutes extends BaseRoutes {
    constructor(catalogController) {
        super('/api');
        this.catalogController = catalogController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.catalogController;
        this.router.get('/user/danhmuc', c.listBrands);
        this.router.get('/sanpham/loai-san-pham/:maLSP', c.listByProductType);
        this.router.get('/sanpham/tim-kiem', c.search);
        this.router.get('/sanpham/thuonghieu/:tenHang', c.listByBrand);
        this.router.get('/sanpham/chitiet/:maSP', c.getDetail);
    }
}

module.exports = CatalogRoutes;
