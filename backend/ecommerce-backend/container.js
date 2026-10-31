// file: container.js
// Nơi duy nhất khởi tạo và nối các đối tượng: Database -> Service -> Controller -> Routes.
// Thêm module mới: thêm vài dòng ở đây, server.js không cần sửa.
const Database = require('./config/Database');

// ===================== ADMIN MODULES =====================
//Services
const AuthAdminService = require('./services/admin/AuthAdminService');
const KhachHangService = require('./services/admin/KhachHangService');
const HoaDonService = require('./services/admin/HoaDonService');
const NhanVienService = require('./services/admin/NhanVienService');
const ChamCongService = require('./services/admin/ChamCongService');
const NhaCungCapService = require('./services/admin/NhaCungCapService');
const PhieuNhapService = require('./services/admin/PhieuNhapService');
const KhuyenMaiService = require('./services/admin/KhuyenMaiService');
const DanhGiaService = require('./services/admin/DanhGiaService');
const ThuongHieuService = require('./services/admin/ThuongHieuService');
const VanChuyenService = require('./services/admin/VanChuyenService');
const SanPhamService = require('./services/admin/SanPhamService');
const DoiTraHangService = require('./services/admin/DoiTraHangService');
const CaiDatService = require('./services/admin/CaiDatService');
const BannerService = require('./services/admin/BannerService');
const ThongKeService = require('./services/admin/ThongKeService');
const HoTroService = require('./services/admin/HoTroService');
//Controller
const AuthAdminController = require('./controllers/admin/AuthAdminController');
const KhachHangController = require('./controllers/admin/KhachHangController');
const HoaDonController = require('./controllers/admin/HoaDonController');
const NhanVienController = require('./controllers/admin/NhanVienController');
const ChamCongController = require('./controllers/admin/ChamCongController');
const NhaCungCapController = require('./controllers/admin/NhaCungCapController');
const PhieuNhapController = require('./controllers/admin/PhieuNhapController');
const KhuyenMaiController = require('./controllers/admin/KhuyenMaiController');
const DanhGiaController = require('./controllers/admin/DanhGiaController');
const ThuongHieuController = require('./controllers/admin/ThuongHieuController');
const VanChuyenController = require('./controllers/admin/VanChuyenController');
const SanPhamController = require('./controllers/admin/SanPhamController');
const DoiTraHangController = require('./controllers/admin/DoiTraHangController');
const CaiDatController = require('./controllers/admin/CaiDatController');
const BannerController = require('./controllers/admin/BannerController');
const ThongKeController = require('./controllers/admin/ThongKeController');
const HoTroController = require('./controllers/admin/HoTroController');
//Routes
const AuthAdminRoutes = require('./routes/admin/AuthAdminRoutes');
const KhachHangRoutes = require('./routes/admin/KhachHangRoutes');
const HoaDonRoutes = require('./routes/admin/HoaDonRoutes');
const NhanVienRoutes = require('./routes/admin/NhanVienRoutes');
const ChamCongRoutes = require('./routes/admin/ChamCongRoutes');
const NhaCungCapRoutes = require('./routes/admin/NhaCungCapRoutes');
const PhieuNhapRoutes = require('./routes/admin/PhieuNhapRoutes');
const KhuyenMaiRoutes = require('./routes/admin/KhuyenMaiRoutes');
const DanhGiaRoutes = require('./routes/admin/DanhGiaRoutes');
const ThuongHieuRoutes = require('./routes/admin/ThuongHieuRoutes');
const VanChuyenRoutes = require('./routes/admin/VanChuyenRoutes');
const SanPhamRoutes = require('./routes/admin/SanPhamRoutes');
const DoiTraHangRoutes = require('./routes/admin/DoiTraHangRoutes');
const CaiDatRoutes = require('./routes/admin/CaiDatRoutes');
const BannerRoutes = require('./routes/admin/BannerRoutes');
const ThongKeRoutes = require('./routes/admin/ThongKeRoutes');
const HoTroRoutes = require('./routes/admin/HoTroRoutes');

// ===================== USER MODULES =====================
//Services
const CartService = require('./services/user/CartService');
const AuthService = require('./services/user/AuthService');
const CustomerService = require('./services/user/CustomerService');
const CatalogService = require('./services/user/CatalogService');
const PromotionService = require('./services/user/PromotionService');
const ContentService = require('./services/user/ContentService');
const OrderService = require('./services/user/OrderService');
const PaymentService = require('./services/user/PaymentService');
const WishlistService = require('./services/user/WishlistService');
const ReviewService = require('./services/user/ReviewService');
const ReturnService = require('./services/user/ReturnService');
const AddressService = require('./services/user/AddressService');
const ChatbotService = require('./services/user/ChatbotService');
//Controller
const CartController = require('./controllers/user/CartController');
const AuthController = require('./controllers/user/AuthController');
const CustomerController = require('./controllers/user/CustomerController');
const CatalogController = require('./controllers/user/CatalogController');
const PromotionController = require('./controllers/user/PromotionController');
const ContentController = require('./controllers/user/ContentController');
const OrderController = require('./controllers/user/OrderController');
const PaymentController = require('./controllers/user/PaymentController');
const WishlistController = require('./controllers/user/WishlistController');
const ReviewController = require('./controllers/user/ReviewController');
const ReturnController = require('./controllers/user/ReturnController');
const AddressController = require('./controllers/user/AddressController');
const ChatbotController = require('./controllers/user/ChatbotController');
//Routes
const CartRoutes = require('./routes/user/CartRoutes');
const AuthRoutes = require('./routes/user/AuthRoutes');
const CustomerRoutes = require('./routes/user/CustomerRoutes');
const CatalogRoutes = require('./routes/user/CatalogRoutes');
const PromotionRoutes = require('./routes/user/PromotionRoutes');
const ContentRoutes = require('./routes/user/ContentRoutes');
const OrderRoutes = require('./routes/user/OrderRoutes');
const PaymentRoutes = require('./routes/user/PaymentRoutes');
const WishlistRoutes = require('./routes/user/WishlistRoutes');
const ReviewRoutes = require('./routes/user/ReviewRoutes');
const ReturnRoutes = require('./routes/user/ReturnRoutes');
const AddressRoutes = require('./routes/user/AddressRoutes');
const ChatbotRoutes = require('./routes/user/ChatbotRoutes');

// Trả về danh sách { path, router } để server.js mount lần lượt
module.exports = function buildContainer(dbConfig) {
    const db = new Database(dbConfig);

    return [
        // ---------------- ADMIN ROUTES ----------------
        new AuthAdminRoutes(new AuthAdminController(new AuthAdminService(db))),
        new KhachHangRoutes(new KhachHangController(new KhachHangService(db))),
        new HoaDonRoutes(new HoaDonController(new HoaDonService(db))),
        new NhanVienRoutes(new NhanVienController(new NhanVienService(db))),
        new ChamCongRoutes(new ChamCongController(new ChamCongService(db))),
        new NhaCungCapRoutes(new NhaCungCapController(new NhaCungCapService(db))),
        new PhieuNhapRoutes(new PhieuNhapController(new PhieuNhapService(db))),
        new KhuyenMaiRoutes(new KhuyenMaiController(new KhuyenMaiService(db))),
        new DanhGiaRoutes(new DanhGiaController(new DanhGiaService(db))),
        new ThuongHieuRoutes(new ThuongHieuController(new ThuongHieuService(db))),
        new VanChuyenRoutes(new VanChuyenController(new VanChuyenService(db))),
        new SanPhamRoutes(new SanPhamController(new SanPhamService(db))),
        new DoiTraHangRoutes(new DoiTraHangController(new DoiTraHangService(db))),
        new CaiDatRoutes(new CaiDatController(new CaiDatService(db))),
        new BannerRoutes(new BannerController(new BannerService(db))),
        new ThongKeRoutes(new ThongKeController(new ThongKeService(db))),
        new HoTroRoutes(new HoTroController(new HoTroService(db))),

        // ---------------- USER ROUTES ----------------
        new CartRoutes(new CartController(new CartService(db))),
        new AuthRoutes(new AuthController(new AuthService(db))),
        new CustomerRoutes(new CustomerController(new CustomerService(db))),
        new CatalogRoutes(new CatalogController(new CatalogService(db))),
        new PromotionRoutes(new PromotionController(new PromotionService(db))),
        new ContentRoutes(new ContentController(new ContentService(db))),
        new OrderRoutes(new OrderController(new OrderService(db))),
        new PaymentRoutes(new PaymentController(new PaymentService(db))),
        new WishlistRoutes(new WishlistController(new WishlistService(db))),
        new ReviewRoutes(new ReviewController(new ReviewService(db))),
        new ReturnRoutes(new ReturnController(new ReturnService(db))),
        new AddressRoutes(new AddressController(new AddressService(db))),
        new ChatbotRoutes(new ChatbotController(new ChatbotService(db))),
    ].map((routes) => routes.toMount());
};
