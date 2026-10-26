// file: controllers/ContentController.js
const BaseController = require('../BaseController');

class ContentController extends BaseController {
    constructor(contentService) {
        super();
        this.contentService = contentService;
    }

    // GET /api/caidat/banner
    getBanners = this.handle(async (req, res) => {
        res.json(await this.contentService.getBanners());
    }, "Lỗi lấy danh sách banner", { plainText: true, serverMessage: (err) => err.message });

    // GET /api/faq
    getFaq = this.handle(async (req, res) => {
        res.json(await this.contentService.getFaq());
    }, "Lỗi lấy danh sách FAQ", { serverMessage: (err) => "Lỗi server: " + err.message });
}

module.exports = ContentController;
