// file: controllers/CartController.js
// Nhận request, gọi CartService, trả JSON. Không viết SQL ở đây.
const BaseController = require('../BaseController');

class CartController extends BaseController {
    // Tiêm CartService qua constructor
    constructor(cartService) {
        super();
        this.cartService = cartService;
    }

    // GET /api/giohang/:maKH
    getCart = this.handle(async (req, res) => {
        const { maKH } = req.params;
        const data = await this.cartService.getCartByCustomerId(maKH);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(data);
    }, "Lỗi lấy giỏ hàng");

    // POST /api/giohang/them
    addToCart = this.handle(async (req, res) => {
        const result = await this.cartService.addToCart(req.body);
        res.status(200).json({ success: true, ...result });
    }, "Lỗi API thêm giỏ hàng", { exposeMessage: false });

    // PUT /api/giohang/capnhat-soluong/:maGioHang
    updateQuantity = this.handle(async (req, res) => {
        const { maGioHang } = req.params;
        const { soLuong } = req.body;
        const result = await this.cartService.updateCartQuantity(maGioHang, soLuong);
        res.status(200).json({ success: true, ...result });
    }, "Lỗi cập nhật số lượng giỏ hàng");

    // DELETE /api/giohang/:maGioHang
    removeItem = this.handle(async (req, res) => {
        const { maGioHang } = req.params;
        const result = await this.cartService.removeItem(maGioHang);
        res.status(200).json({ success: true, ...result });
    }, "Lỗi xóa giỏ hàng");
}

module.exports = CartController;
