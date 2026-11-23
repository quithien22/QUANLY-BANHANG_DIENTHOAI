// file: routes/WishlistRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser, requireSelf } = require('../../middlewares/auth');

class WishlistRoutes extends BaseRoutes {
    constructor(wishlistController) {
        super('/api/yeuthich');
        this.wishlistController = wishlistController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.wishlistController;
        this.router.post('/toggle', requireUser(), c.toggle);
        this.router.get('/:maKH', requireUser(), requireSelf('maKH'), c.list);
    }
}

module.exports = WishlistRoutes;
