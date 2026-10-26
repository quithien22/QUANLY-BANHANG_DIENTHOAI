// file: controllers/CatalogController.js
const BaseController = require('../BaseController');

class CatalogController extends BaseController {
    constructor(catalogService) {
        super();
        this.catalogService = catalogService;
    }

    // GET /api/user/danhmuc
    listBrands = this.handle(async (req, res) => {
        res.json(await this.catalogService.listActiveBrands());
    }, "Lỗi lấy danh mục", { plainText: true, serverMessage: (err) => "Lỗi server chi tiết: " + err.message });

    // GET /api/sanpham/loai-san-pham/:maLSP
    listByProductType = this.handle(async (req, res) => {
        res.json(await this.catalogService.listByProductType(req.params.maLSP));
    }, "Lỗi lấy sản phẩm theo loại", { serverMessage: "Lỗi server" });

    // GET /api/sanpham/tim-kiem?tuKhoa=...
    search = this.handle(async (req, res) => {
        res.json(await this.catalogService.search(req.query.tuKhoa));
    }, "Lỗi khi tìm kiếm sản phẩm", { plainText: true, serverMessage: (err) => "Lỗi server: " + err.message });

    // GET /api/sanpham/thuonghieu/:tenHang
    listByBrand = this.handle(async (req, res) => {
        res.json(await this.catalogService.listByBrand(req.params.tenHang));
    }, "Lỗi lấy sản phẩm theo thương hiệu", { plainText: true, serverMessage: (err) => "Lỗi server chi tiết: " + err.message });

    // GET /api/sanpham/chitiet/:maSP
    getDetail = this.handle(async (req, res) => {
        res.json(await this.catalogService.getProductDetail(req.params.maSP));
    }, "Lỗi lấy chi tiết sản phẩm");
}

module.exports = CatalogController;
