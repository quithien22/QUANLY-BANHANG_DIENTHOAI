// file: routes/ReturnRoutes.js
const BaseRoutes = require('../BaseRoutes');
const upload = require('../../middlewares/upload');
const { requireUser, requireSelf } = require('../../middlewares/auth');

class ReturnRoutes extends BaseRoutes {
    constructor(returnController) {
        super('/api/user/doitrahang');
        this.returnController = returnController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.returnController;
        // requireUser đứng TRƯỚC upload để người chưa đăng nhập không ghi được file nào lên đĩa
        this.router.post('/tao', requireUser(), upload.single('hinhAnh'), c.create);
        this.router.get('/:maKH', requireUser(), requireSelf('maKH'), c.list);
    }
}

module.exports = ReturnRoutes;
