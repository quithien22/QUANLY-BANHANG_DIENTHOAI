// file: controllers/OrderController.js
const BaseController = require('../BaseController');

class OrderController extends BaseController {
    constructor(orderService) {
        super();
        this.orderService = orderService;
    }

    // POST /api/hoadon/dat-hang
    placeOrder = this.handle(async (req, res) => {
        const { maHoaDon, tongTien } = await this.orderService.placeOrder({ ...req.body, maKH: req.auth.maKH });
        res.status(200).json({ success: true, message: "Đặt hàng thành công", maHoaDon, tongTien });
    }, "Lỗi đặt hàng");

    // PUT /api/hoadon/huy-don/:maHoaDon
    cancelOrder = this.handle(async (req, res) => {
        await this.orderService.cancelOrder(req.params.maHoaDon, req.auth.maKH);
        res.json({ success: true, message: "Hủy đơn hàng và cập nhật vận chuyển thành công!" });
    }, "Lỗi khi hủy đơn", { serverMessage: (err) => "Lỗi server: " + err.message });

    // GET /api/hoadon/khachhang/:maKH
    getOrders = this.handle(async (req, res) => {
        res.json(await this.orderService.getOrdersByCustomer(req.params.maKH));
    }, "Lỗi lấy đơn hàng", { plainText: true, serverMessage: (err) => "Lỗi lấy đơn hàng: " + err.message });

    // GET /api/hoadon/lich-su/:maKH
    getHistory = this.handle(async (req, res) => {
        const data = await this.orderService.getHistory(req.params.maKH);
        res.status(200).json({ success: true, data });
    }, "Lỗi lấy lịch sử đơn hàng", { serverMessage: (err) => err.message });

    // GET /api/hoadon/chi-tiet/:maHoaDon
    getItems = this.handle(async (req, res) => {
        const data = await this.orderService.getOrderItems(req.params.maHoaDon, req.auth.maKH);
        res.status(200).json({ success: true, data });
    }, "Lỗi lấy chi tiết hóa đơn", { serverMessage: (err) => err.message });
}

module.exports = OrderController;
