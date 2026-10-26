// file: controllers/admin/BannerController.js
const BaseController = require('../BaseController');

class BannerController extends BaseController {
    constructor(bannerService) {
        super();
        this.bannerService = bannerService;
    }

    // POST /api/caidat/banner  (multipart: hinhAnh)
    them = this.handle(async (req, res) => {
        const ketQua = await this.bannerService.them(req.body, req.file);
        res.json({ success: true, ...ketQua });
    }, "Lỗi thêm banner");

    // PUT /api/caidat/banner/trangthai/:id
    doiTrangThai = this.handle(async (req, res) => {
        const ketQua = await this.bannerService.doiTrangThai(req.params.id, req.body.trangThai);
        res.json({ success: true, ...ketQua });
    }, "Lỗi đổi trạng thái banner");

    // DELETE /api/caidat/banner/:id
    xoa = this.handle(async (req, res) => {
        const ketQua = await this.bannerService.xoa(req.params.id);
        res.json({ success: true, ...ketQua });
    }, "Lỗi xóa banner");
}

module.exports = BannerController;
