// file: controllers/ReviewController.js
const BaseController = require('../BaseController');

class ReviewController extends BaseController {
    constructor(reviewService) {
        super();
        this.reviewService = reviewService;
    }

    // GET /api/danhgia/:maSP
    list = this.handle(async (req, res) => {
        res.json(await this.reviewService.listByProduct(req.params.maSP));
    }, "Lỗi lấy danh sách đánh giá", { plainText: true, serverMessage: (err) => "Lỗi server: " + err.message });

    // POST /api/danhgia/them
    add = this.handle(async (req, res) => {
        await this.reviewService.add({ ...req.body, maKH: req.auth.maKH });
        res.json({ success: true, message: "Đã gửi đánh giá thành công!" });
    }, "Lỗi thêm đánh giá", { serverMessage: (err) => "Lỗi server: " + err.message });

    // PUT /api/danhgia/sua/:maDanhGia
    update = this.handle(async (req, res) => {
        await this.reviewService.update(req.params.maDanhGia, { ...req.body, maKH: req.auth.maKH });
        res.json({ success: true, message: "Cập nhật đánh giá thành công." });
    }, "Lỗi sửa đánh giá", { serverMessage: (err) => "Lỗi server: " + err.message });

    // DELETE /api/danhgia/xoa/:maDanhGia   (maKH lấy từ token, không đọc từ body)
    remove = this.handle(async (req, res) => {
        await this.reviewService.remove(req.params.maDanhGia, req.auth.maKH);
        res.json({ success: true, message: "Xóa đánh giá thành công." });
    }, "Lỗi xóa đánh giá", { serverMessage: (err) => "Lỗi server: " + err.message });
}

module.exports = ReviewController;
