// file: routes/ReviewRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser } = require('../../middlewares/auth');

class ReviewRoutes extends BaseRoutes {
    constructor(reviewController) {
        super('/api/danhgia');
        this.reviewController = reviewController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.reviewController;
        this.router.post('/them', requireUser(), c.add);
        this.router.put('/sua/:maDanhGia', requireUser(), c.update);
        this.router.delete('/xoa/:maDanhGia', requireUser(), c.remove);
        this.router.get('/:maSP', c.list); // công khai: ai cũng xem được đánh giá
    }
}

module.exports = ReviewRoutes;
