// file: routes/AddressRoutes.js
const BaseRoutes = require('../BaseRoutes');
const { requireUser, requireSelf } = require('../../middlewares/auth');

class AddressRoutes extends BaseRoutes {
    constructor(addressController) {
        super('/api/diachi');
        this.addressController = addressController;
        this.registerRoutes();
    }

    registerRoutes() {
        const c = this.addressController;
        this.router.post('/them', requireUser(), c.add);
        this.router.put('/sua/:maDiaChi', requireUser(), c.update);
        this.router.delete('/xoa/:maDiaChi', requireUser(), c.remove);
        this.router.get('/:maKH', requireUser(), requireSelf('maKH'), c.list);
    }
}

module.exports = AddressRoutes;
