// file: routes/ContentRoutes.js
// Chỉ có GET banner và GET faq. POST banner (admin) vẫn nằm trong server.js.
const BaseRoutes = require('../BaseRoutes');

class ContentRoutes extends BaseRoutes {
    constructor(contentController) {
        super('/api');
        this.contentController = contentController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.contentController;
        this.router.get('/caidat/banner', c.getBanners);
        this.router.get('/faq', c.getFaq);
    }
}

module.exports = ContentRoutes;
