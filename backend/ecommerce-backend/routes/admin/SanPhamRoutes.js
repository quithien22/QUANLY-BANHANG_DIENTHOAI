// file: routes/admin/SanPhamRoutes.js
// Route upload ảnh dùng middleware multer chung (middlewares/upload.js).
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');

class SanPhamRoutes extends BaseRoutes {
    constructor(sanPhamController) {
        super('/api/sanpham');
        this.sanPhamController = sanPhamController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.sanPhamController;
        this.router.get('/', c.layDanhSach);
        this.router.post('/them', upload.array('anhSanPham', 10), c.them);
        this.router.put('/sua/:maSP', upload.array('anhSanPham', 10), c.sua);
        this.router.delete('/:maSP', c.xoa);
    }
}

module.exports = SanPhamRoutes;
