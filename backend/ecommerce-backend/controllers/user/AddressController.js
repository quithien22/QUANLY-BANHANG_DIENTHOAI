// file: controllers/AddressController.js
const BaseController = require('../BaseController');

class AddressController extends BaseController {
    constructor(addressService) {
        super();
        this.addressService = addressService;
    }

    // GET /api/diachi/:maKH
    list = this.handle(async (req, res) => {
        const data = await this.addressService.listByCustomer(req.params.maKH);
        res.status(200).json({ success: true, data });
    }, "Lỗi lấy sổ địa chỉ", { serverMessage: (err) => err.message });

    // POST /api/diachi/them
    add = this.handle(async (req, res) => {
        await this.addressService.add(req.body);
        res.status(200).json({ success: true, message: "Thêm địa chỉ thành công" });
    }, "Lỗi thêm địa chỉ", { serverMessage: (err) => err.message });

    // PUT /api/diachi/sua/:maDiaChi
    update = this.handle(async (req, res) => {
        await this.addressService.update(req.params.maDiaChi, req.body);
        res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ" });
    }, "Lỗi sửa địa chỉ", { serverMessage: (err) => err.message });

    // DELETE /api/diachi/xoa/:maDiaChi
    remove = this.handle(async (req, res) => {
        await this.addressService.remove(req.params.maDiaChi);
        res.status(200).json({ success: true, message: "Đã xóa địa chỉ" });
    }, "Lỗi xóa địa chỉ", { serverMessage: (err) => err.message });
}

module.exports = AddressController;
