// file: routes/admin/SanPhamRoutes.js
// Route upload ảnh dùng middleware multer chung (middlewares/upload.js).
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');
const { requireAdmin } = require('../../middlewares/auth');

class SanPhamRoutes extends BaseRoutes {
    constructor(sanPhamController) {
        super('/api/sanpham');
        this.sanPhamController = sanPhamController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.sanPhamController;
        // GET công khai: cả storefront lẫn admin đều dùng để xem danh sách sản phẩm
        this.router.get('/', c.layDanhSach);
        // requireAdmin đứng TRƯỚC upload để người lạ không ghi được file nào lên đĩa
        this.router.post('/them', requireAdmin(), upload.array('anhSanPham', 10), c.them);
        this.router.put('/sua/:maSP', requireAdmin(), upload.array('anhSanPham', 10), c.sua);
        this.router.delete('/:maSP', requireAdmin(), c.xoa);
    }
}

module.exports = SanPhamRoutes;
