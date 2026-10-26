// file: routes/WishlistRoutes.js
const BaseRoutes = require('../BaseRoutes');

class WishlistRoutes extends BaseRoutes {
    constructor(wishlistController) {
        super('/api/yeuthich');
        this.wishlistController = wishlistController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.wishlistController;
        this.router.post('/toggle', c.toggle);
        this.router.get('/:maKH', c.list);
    }
}

module.exports = WishlistRoutes;
