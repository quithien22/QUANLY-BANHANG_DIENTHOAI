// file: routes/ReturnRoutes.js
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');

class ReturnRoutes extends BaseRoutes {
    constructor(returnController) {
        super('/api/user/doitrahang');
        this.returnController = returnController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.returnController;
        this.router.post('/tao', upload.single('hinhAnh'), c.create);
        this.router.get('/:maKH', c.list);
    }
}

module.exports = ReturnRoutes;
