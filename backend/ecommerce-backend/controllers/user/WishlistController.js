// file: controllers/WishlistController.js
const BaseController = require('../BaseController');

class WishlistController extends BaseController {
    constructor(wishlistService) {
        super();
        this.wishlistService = wishlistService;
    }

    // POST /api/yeuthich/toggle
    toggle = this.handle(async (req, res) => {
        const { maKH, maSP } = req.body;
        const action = await this.wishlistService.toggle(maKH, maSP);
        res.json({ success: true, action });
    }, "Lỗi API toggle yêu thích", { serverMessage: (err) => "Lỗi server: " + err.message });

    // GET /api/yeuthich/:maKH
    list = this.handle(async (req, res) => {
        res.json(await this.wishlistService.listByCustomer(req.params.maKH));
    }, "Lỗi lấy danh sách yêu thích", { plainText: true, serverMessage: (err) => "Lỗi server: " + err.message });
}

module.exports = WishlistController;
