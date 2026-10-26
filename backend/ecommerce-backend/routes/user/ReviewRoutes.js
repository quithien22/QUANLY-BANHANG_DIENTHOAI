// file: routes/ReviewRoutes.js
const BaseRoutes = require('../BaseRoutes');

class ReviewRoutes extends BaseRoutes {
    constructor(reviewController) {
        super('/api/danhgia');
        this.reviewController = reviewController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.reviewController;
        this.router.post('/them', c.add);
        this.router.put('/sua/:maDanhGia', c.update);
        this.router.delete('/xoa/:maDanhGia', c.remove);
        this.router.get('/:maSP', c.list);
    }
}

module.exports = ReviewRoutes;
